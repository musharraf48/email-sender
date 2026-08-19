import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emails: unknown[] = Array.isArray(body?.emails) ? body.emails : [];

    const normalized = [
      ...new Set(
        emails
          .filter((email): email is string => typeof email === 'string')
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 0 && isValidEmail(email))
      ),
    ];

    if (normalized.length === 0) {
      return NextResponse.json({ success: true, duplicates: [] });
    }

    const applications = await prisma.application.findMany({
      where: { email: { in: normalized } },
      orderBy: { appliedAt: 'desc' },
      select: {
        email: true,
        jobType: true,
        status: true,
        appliedAt: true,
        companyName: true,
        emailSent: true,
      },
    });

    const seen = new Set<string>();
    const duplicates = applications.filter((app) => {
      if (seen.has(app.email)) return false;
      seen.add(app.email);
      return true;
    });

    return NextResponse.json({ success: true, duplicates });
  } catch (error: unknown) {
    console.error('Applications check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check applications';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
