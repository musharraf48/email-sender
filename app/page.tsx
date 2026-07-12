'use client';

import Link from 'next/link';
import { useState } from 'react';
import { JOB_TYPES } from '@/lib/job-templates';

export default function Home() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [jobType, setJobType] = useState('React Developer');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; message: string }>>([]);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResults([]);

    // Filter out empty emails and trim
    const emailsToSend = emails
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emailsToSend.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one email address' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailsToSend, jobType, recruiterPhone }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        const totalCount = data.results?.length || 0;
        
        if (successCount === totalCount) {
          setMessage({ type: 'success', text: `All ${totalCount} email(s) sent successfully!` });
        } else {
          setMessage({ 
            type: 'error', 
            text: `${successCount} of ${totalCount} email(s) sent successfully. Some failed.` 
          });
        }
        
        // Reset form
        setEmails(['']);
        setRecruiterPhone('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send emails' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Job Application Email Sender</h1>
          <Link href="/applications" style={styles.trackerLink}>
            View Tracker →
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Recruiter Email Address(es)
            </label>
            {emails.map((email, index) => (
              <div key={index} style={styles.emailFieldContainer}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  placeholder="recruiter@company.com"
                  style={styles.input}
                  disabled={loading}
                />
                {index === emails.length - 1 ? (
                  <button
                    type="button"
                    onClick={addEmailField}
                    style={styles.addButton}
                    disabled={loading}
                    title="Add another email"
                  >
                    +
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeEmailField(index)}
                    style={styles.removeButton}
                    disabled={loading}
                    title="Remove this email"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="recruiterPhone" style={styles.label}>
              Recruiter Phone Number <span style={styles.optional}>(optional)</span>
            </label>
            <input
              id="recruiterPhone"
              type="tel"
              value={recruiterPhone}
              onChange={(e) => setRecruiterPhone(e.target.value)}
              placeholder="+91 98765 43210"
              style={styles.inputFull}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="jobType" style={styles.label}>
              Job Type
            </label>
            <select
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || emails.every(email => !email.trim())}
            style={{
              ...styles.button,
              ...(loading || emails.every(email => !email.trim()) ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Sending...' : 'Send Application(s)'}
          </button>
        </form>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.type === 'success' ? styles.messageSuccess : styles.messageError),
            }}
          >
            {message.text}
          </div>
        )}

        {results.length > 0 && (
          <div style={styles.resultsContainer}>
            <h3 style={styles.resultsTitle}>Email Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  ...styles.resultItem,
                  ...(result.success ? styles.resultSuccess : styles.resultError),
                }}
              >
                <strong>{result.email}:</strong> {result.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  trackerLink: {
    fontSize: '13px',
    color: '#0070f3',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emailFieldContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  addButton: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    lineHeight: '1',
    minWidth: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    lineHeight: '1',
    minWidth: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
  },
  optional: {
    fontWeight: '400',
    color: '#888',
  },
  inputFull: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  message: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  resultsContainer: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
  },
  resultsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  resultItem: {
    padding: '8px 12px',
    marginBottom: '8px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  resultSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  resultError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
};

