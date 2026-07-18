import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';

const LOOKBACK_DAYS = 45;
const MAX_BODY_LENGTH = 20000;

const AUTO_REPLY_SUBJECT =
  /\b(out of office|automatic reply|auto[- ]?reply|autoreply|delivery status|undeliverable|mail delivery|failure notice|returned mail)\b/i;

export type ReplyCheckResult = {
  scanned: number;
  matched: number;
  updated: Array<{
    id: string;
    email: string;
    companyName: string | null;
    matchedBy: 'messageId' | 'email';
  }>;
  skippedAutoReplies: number;
};

type PendingMatch = {
  uid: number;
  app: {
    id: string;
    email: string;
    companyName: string | null;
  };
  matchedBy: 'messageId' | 'email';
  replyFrom: string | null;
  replySubject: string | null;
  replyBody: string | null;
  replyAt: Date | null;
};

const normalizeMessageId = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.trim().replace(/^<|>$/g, '').toLowerCase();
  return cleaned || null;
};

const extractMessageIds = (value: string | null | undefined): string[] => {
  if (!value) return [];
  const matches = value.match(/<[^>]+>/g);
  if (matches?.length) {
    return matches.map((id) => normalizeMessageId(id)!).filter(Boolean);
  }
  const single = normalizeMessageId(value);
  return single ? [single] : [];
};

const isAutoReply = (headers: {
  subject?: string | null;
  autoSubmitted?: string | null;
  precedence?: string | null;
}): boolean => {
  const autoSubmitted = headers.autoSubmitted?.toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return true;

  const precedence = headers.precedence?.toLowerCase();
  if (precedence && ['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) return true;

  if (headers.subject && AUTO_REPLY_SUBJECT.test(headers.subject)) return true;

  return false;
};

const truncateBody = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return null;
  if (cleaned.length <= MAX_BODY_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_BODY_LENGTH)}\n\n…(truncated)`;
};

const htmlToText = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

export async function checkInboxReplies(): Promise<ReplyCheckResult> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required for reply checking');
  }

  const applications = await prisma.application.findMany({
    where: {
      emailSent: true,
      OR: [{ status: 'applied' }, { status: 'replied', replyBody: null }],
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      messageId: true,
      appliedAt: true,
      status: true,
      replyBody: true,
    },
    orderBy: { appliedAt: 'desc' },
  });

  if (applications.length === 0) {
    return { scanned: 0, matched: 0, updated: [], skippedAutoReplies: 0 };
  }

  const messageIdMap = new Map<string, (typeof applications)[number]>();
  const emailMap = new Map<string, (typeof applications)[number]>();

  for (const app of applications) {
    const msgId = normalizeMessageId(app.messageId);
    if (msgId && !messageIdMap.has(msgId)) {
      messageIdMap.set(msgId, app);
    }
    const email = app.email.toLowerCase();
    if (!emailMap.has(email)) {
      emailMap.set(email, app);
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const updatedIds = new Set<string>();
  const pending: PendingMatch[] = [];
  let scanned = 0;
  let skippedAutoReplies = 0;

  await client.connect();

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids = await client.search({ since }, { uid: true });
      if (!uids || uids === false || (Array.isArray(uids) && uids.length === 0)) {
        return { scanned: 0, matched: 0, updated: [], skippedAutoReplies: 0 };
      }

      for await (const msg of client.fetch(
        uids,
        {
          envelope: true,
          uid: true,
          headers: ['in-reply-to', 'references', 'auto-submitted', 'precedence'],
        },
        { uid: true }
      )) {
        scanned += 1;

        const headerLines = msg.headers?.toString() || '';
        const getHeader = (name: string) => {
          const regex = new RegExp(`^${name}:\\s*(.+)$`, 'im');
          const match = headerLines.match(regex);
          return match?.[1]?.trim() || null;
        };

        const inReplyTo = getHeader('in-reply-to');
        const references = getHeader('references');
        const autoSubmitted = getHeader('auto-submitted');
        const precedence = getHeader('precedence');
        const subject = msg.envelope?.subject || null;

        if (isAutoReply({ subject, autoSubmitted, precedence })) {
          skippedAutoReplies += 1;
          continue;
        }

        const relatedIds = [
          ...extractMessageIds(inReplyTo),
          ...extractMessageIds(references),
        ];

        let matchedApp: (typeof applications)[number] | undefined;
        let matchedBy: 'messageId' | 'email' | undefined;

        for (const relatedId of relatedIds) {
          const app = messageIdMap.get(relatedId);
          if (app && !updatedIds.has(app.id)) {
            matchedApp = app;
            matchedBy = 'messageId';
            break;
          }
        }

        if (!matchedApp) {
          const fromAddresses = msg.envelope?.from || [];
          for (const from of fromAddresses) {
            const fromEmail = from.address?.toLowerCase();
            if (!fromEmail) continue;
            const app = emailMap.get(fromEmail);
            if (app && !updatedIds.has(app.id)) {
              const msgDate = msg.envelope?.date;
              if (msgDate && msgDate < app.appliedAt) continue;
              matchedApp = app;
              matchedBy = 'email';
              break;
            }
          }
        }

        if (!matchedApp || !matchedBy || msg.uid == null) continue;

        updatedIds.add(matchedApp.id);
        pending.push({
          uid: msg.uid,
          app: {
            id: matchedApp.id,
            email: matchedApp.email,
            companyName: matchedApp.companyName,
          },
          matchedBy,
          replyFrom:
            msg.envelope?.from
              ?.map((f) => (f.name ? `${f.name} <${f.address}>` : f.address))
              .filter(Boolean)
              .join(', ') || null,
          replySubject: subject,
          replyBody: null,
          replyAt: msg.envelope?.date || new Date(),
        });
      }

      for (const item of pending) {
        try {
          const downloaded = await client.download(item.uid, undefined, { uid: true });
          if (downloaded?.content) {
            const chunks: Buffer[] = [];
            for await (const chunk of downloaded.content) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const source = Buffer.concat(chunks);
            const parsed = await simpleParser(source);
            item.replySubject = parsed.subject || item.replySubject;
            item.replyAt = parsed.date || item.replyAt;
            item.replyFrom = parsed.from?.text || item.replyFrom;
            item.replyBody = truncateBody(
              parsed.text || (parsed.html ? htmlToText(parsed.html) : null)
            );
          }
        } catch (parseError) {
          console.error(`Failed to download reply uid=${item.uid}:`, parseError);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout errors
    }
  }

  if (pending.length > 0) {
    const now = new Date();
    await prisma.$transaction(
      pending.map((item) =>
        prisma.application.update({
          where: { id: item.app.id },
          data: {
            status: 'replied',
            lastContactAt: item.replyAt || now,
            replyFrom: item.replyFrom,
            replySubject: item.replySubject,
            replyBody: item.replyBody,
            replyAt: item.replyAt,
          },
        })
      )
    );
  }

  return {
    scanned,
    matched: pending.length,
    updated: pending.map((item) => ({
      id: item.app.id,
      email: item.app.email,
      companyName: item.app.companyName,
      matchedBy: item.matchedBy,
    })),
    skippedAutoReplies,
  };
}
