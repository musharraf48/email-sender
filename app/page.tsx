'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, Plus, Trash2, User } from 'lucide-react';
import { JOB_TYPES } from '@/lib/job-templates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type DuplicateApp = {
  email: string;
  jobType: string;
  status: string;
  appliedAt: string;
  companyName: string | null;
};

const formatAppliedDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function Home() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [jobType, setJobType] = useState('React Developer');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; message: string }>>([]);
  const [duplicates, setDuplicates] = useState<DuplicateApp[]>([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<string, 'apply' | 'discard'>>({});
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const sendEmails = async (emailsToSend: string[]) => {
    if (emailsToSend.length === 0) {
      setMessage({ type: 'error', text: 'No emails left to send. Discarded already-applied addresses.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToSend, jobType, recruiterPhone }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
        const totalCount = data.results?.length || 0;

        if (successCount === totalCount) {
          setMessage({ type: 'success', text: `All ${totalCount} email(s) sent successfully!` });
        } else {
          setMessage({
            type: 'error',
            text: `${successCount} of ${totalCount} email(s) sent successfully. Some failed.`,
          });
        }

        setEmails(['']);
        setRecruiterPhone('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send emails' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResults([]);

    const emailsToSend = [
      ...new Set(emails.map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0)),
    ];

    if (emailsToSend.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one email address' });
      setLoading(false);
      return;
    }

    try {
      const checkResponse = await fetch('/api/applications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToSend }),
      });
      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.success) {
        setMessage({ type: 'error', text: checkData.error || 'Failed to check previous applications' });
        setLoading(false);
        return;
      }

      const found: DuplicateApp[] = checkData.duplicates || [];
      if (found.length > 0) {
        setPendingEmails(emailsToSend);
        setDuplicates(found);
        setDuplicateDecisions({});
        setDialogOpen(true);
        setLoading(false);
        return;
      }

      await sendEmails(emailsToSend);
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const finishDuplicates = async (decisions: Record<string, 'apply' | 'discard'>) => {
    const discarded = new Set(
      Object.entries(decisions)
        .filter(([, decision]) => decision === 'discard')
        .map(([email]) => email)
    );
    const emailsToSend = pendingEmails.filter((email) => !discarded.has(email));
    setDialogOpen(false);
    setDuplicates([]);
    setPendingEmails([]);
    setDuplicateDecisions({});
    setLoading(true);
    setMessage(null);
    await sendEmails(emailsToSend);
  };

  const decideDuplicate = (email: string, decision: 'apply' | 'discard') => {
    const next = { ...duplicateDecisions, [email]: decision };
    setDuplicateDecisions(next);
    const allDecided = duplicates.every((item) => next[item.email]);
    if (allDecided) {
      void finishDuplicates(next);
    }
  };

  const cancelDuplicates = () => {
    setDialogOpen(false);
    setDuplicates([]);
    setPendingEmails([]);
    setDuplicateDecisions({});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/60 via-background to-background p-4 sm:p-6">
      <Card className="w-full max-w-lg border-border/60 shadow-xl shadow-black/20">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Job Application Email Sender</CardTitle>
              <CardDescription className="mt-1.5">
                Send tailored applications with your CV attached
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href="/applications">View Tracker</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 shrink-0 text-primary" />
              Musharraf Ansari
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <a
                href="mailto:musharraf.code@gmail.com"
                className="break-all hover:text-primary hover:underline"
              >
                musharraf.code@gmail.com
              </a>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Recruiter Email Address(es)</Label>
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder="recruiter@company.com"
                    disabled={loading}
                    className="min-w-0"
                  />
                  {index === emails.length - 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addEmailField}
                      disabled={loading}
                      title="Add another email"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeEmailField(index)}
                      disabled={loading}
                      title="Remove this email"
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiterPhone">
                Recruiter Phone Number{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="recruiterPhone"
                type="tel"
                value={recruiterPhone}
                onChange={(e) => setRecruiterPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType} disabled={loading}>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || emails.every((email) => !email.trim())}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Application(s)'
              )}
            </Button>
          </form>

          {message && (
            <Alert
              variant={message.type === 'success' ? 'success' : 'destructive'}
              className="mt-5"
            >
              {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="mt-5 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
              <h3 className="text-sm font-semibold">Email Results</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    result.success
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  <span className="font-medium">{result.email}:</span> {result.message}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && cancelDuplicates()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Already applied</DialogTitle>
            <DialogDescription>
              You have already applied to {duplicates.length === 1 ? 'this email' : 'these emails'}.
              Choose apply again or discard for each one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {duplicates.map((item) => {
              const decision = duplicateDecisions[item.email];
              return (
                <div key={item.email} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="break-all text-sm font-medium">{item.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied on {formatAppliedDate(item.appliedAt)}
                    {item.jobType ? ` as ${item.jobType}` : ''}
                    {item.status ? ` · ${item.status}` : ''}
                    {item.companyName ? ` · ${item.companyName}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === 'apply' ? 'default' : 'outline'}
                      onClick={() => decideDuplicate(item.email, 'apply')}
                    >
                      Apply again
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === 'discard' ? 'destructive' : 'outline'}
                      onClick={() => decideDuplicate(item.email, 'discard')}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
