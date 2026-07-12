'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Application = {
  id: string;
  email: string;
  domain: string;
  companyName: string | null;
  jobType: string;
  subject: string;
  status: string;
  appliedAt: string;
  expiresAt: string;
  messageId: string | null;
  emailSent: boolean;
  sendError: string | null;
  recruiterName: string | null;
  recruiterPhone: string | null;
  jobTitle: string | null;
  location: string | null;
  workMode: string | null;
  salary: string | null;
  source: string | null;
  notes: string | null;
  followUpDate: string | null;
  lastContactAt: string | null;
  priority: string;
  tags: string | null;
};

const STATUSES = ['applied', 'replied', 'interview', 'offer', 'rejected', 'expired', 'withdrawn', 'hired'];
const JOB_TYPES = ['React Developer', 'React Native Developer', 'Frontend Developer', 'Web Developer'];
const PRIORITIES = ['low', 'medium', 'high'];
const PAGE_SIZE = 10;

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const daysUntilExpiry = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const statusColor = (status: string): React.CSSProperties => {
  const colors: Record<string, React.CSSProperties> = {
    applied: { backgroundColor: '#e7f1ff', color: '#004085' },
    replied: { backgroundColor: '#d1ecf1', color: '#0c5460' },
    interview: { backgroundColor: '#fff3cd', color: '#856404' },
    offer: { backgroundColor: '#d4edda', color: '#155724' },
    rejected: { backgroundColor: '#f8d7da', color: '#721c24' },
    expired: { backgroundColor: '#e2e3e5', color: '#383d41' },
    withdrawn: { backgroundColor: '#f5f5f5', color: '#666' },
    hired: { backgroundColor: '#c3e6cb', color: '#155724' },
  };
  return colors[status] || { backgroundColor: '#f8f9fa', color: '#333' };
};

const emptyForm = {
  companyName: '',
  jobType: 'React Developer',
  jobTitle: '',
  status: 'applied',
  recruiterName: '',
  recruiterPhone: '',
  location: '',
  workMode: '',
  salary: '',
  source: '',
  notes: '',
  priority: 'medium',
  tags: '',
  followUpDate: '',
  lastContactAt: '',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));

      const response = await fetch(`/api/applications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setPagination(data.pagination);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load applications' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while loading applications' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openEdit = (app: Application) => {
    setEditing(app);
    setForm({
      companyName: app.companyName || '',
      jobType: app.jobType,
      jobTitle: app.jobTitle || '',
      status: app.status,
      recruiterName: app.recruiterName || '',
      recruiterPhone: app.recruiterPhone || '',
      location: app.location || '',
      workMode: app.workMode || '',
      salary: app.salary || '',
      source: app.source || '',
      notes: app.notes || '',
      priority: app.priority || 'medium',
      tags: app.tags || '',
      followUpDate: app.followUpDate ? app.followUpDate.slice(0, 10) : '',
      lastContactAt: app.lastContactAt ? app.lastContactAt.slice(0, 10) : '',
    });
    setMessage(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/applications/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          followUpDate: form.followUpDate || null,
          lastContactAt: form.lastContactAt || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Application updated' });
        closeEdit();
        fetchApplications();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while saving' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application record?')) return;

    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Application deleted' });
        fetchApplications();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while deleting' });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Application Tracker</h1>
            <p style={styles.subtitle}>
              Records auto-expire to <strong>expired</strong> after 15 days if still &quot;applied&quot;
            </p>
          </div>
          <Link href="/" style={styles.linkButton}>
            ← Send Application
          </Link>
        </div>

        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Search email, company, domain..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={styles.select}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div
            style={{
              ...styles.banner,
              ...(message.type === 'success' ? styles.bannerSuccess : styles.bannerError),
            }}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p style={styles.loading}>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div style={styles.empty}>
            <p>No applications yet. Send your first one from the home page.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Job</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Applied</th>
                  <th style={styles.th}>Expires</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const daysLeft = daysUntilExpiry(app.expiresAt);
                  return (
                    <tr key={app.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{app.companyName || '—'}</strong>
                        <div style={styles.muted}>{app.domain}</div>
                      </td>
                      <td style={styles.td}>{app.email}</td>
                      <td style={styles.td}>{app.jobType}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...statusColor(app.status) }}>
                          {app.status}
                        </span>
                        {!app.emailSent && <div style={styles.warn}>Send failed</div>}
                      </td>
                      <td style={styles.td}>{formatDate(app.appliedAt)}</td>
                      <td style={styles.td}>
                        {formatDate(app.expiresAt)}
                        {app.status === 'applied' && daysLeft >= 0 && (
                          <div style={styles.muted}>{daysLeft}d left</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => openEdit(app)} style={styles.editBtn}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(app.id)} style={styles.deleteBtn}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pagination && pagination.total > 0 && (
              <div style={styles.pagination}>
                <span style={styles.pageInfo}>
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={styles.pageButtons}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!pagination.hasPrevPage}
                    style={{
                      ...styles.pageBtn,
                      ...(!pagination.hasPrevPage ? styles.pageBtnDisabled : {}),
                    }}
                  >
                    ← Prev
                  </button>
                  <span style={styles.pageNumber}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    style={{
                      ...styles.pageBtn,
                      ...(!pagination.hasNextPage ? styles.pageBtnDisabled : {}),
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {editing && (
          <div style={styles.overlay} onClick={closeEdit}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Edit Application</h2>
              <p style={styles.modalMeta}>
                {editing.email} · applied {formatDate(editing.appliedAt)}
              </p>

              <div style={styles.formGrid}>
                <Field label="Company Name">
                  <input
                    style={styles.input}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </Field>

                <Field label="Job Type">
                  <select
                    style={styles.input}
                    value={form.jobType}
                    onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Job Title">
                  <input
                    style={styles.input}
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  />
                </Field>

                <Field label="Status">
                  <select
                    style={styles.input}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Recruiter Name">
                  <input
                    style={styles.input}
                    value={form.recruiterName}
                    onChange={(e) => setForm({ ...form, recruiterName: e.target.value })}
                  />
                </Field>

                <Field label="Recruiter Phone">
                  <input
                    style={styles.input}
                    type="tel"
                    value={form.recruiterPhone}
                    onChange={(e) => setForm({ ...form, recruiterPhone: e.target.value })}
                  />
                </Field>

                <Field label="Location">
                  <input
                    style={styles.input}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </Field>

                <Field label="Work Mode">
                  <input
                    style={styles.input}
                    placeholder="Remote / Hybrid / Onsite"
                    value={form.workMode}
                    onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                  />
                </Field>

                <Field label="Salary">
                  <input
                    style={styles.input}
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  />
                </Field>

                <Field label="Source">
                  <input
                    style={styles.input}
                    placeholder="LinkedIn, Naukri, referral..."
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  />
                </Field>

                <Field label="Priority">
                  <select
                    style={styles.input}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tags">
                  <input
                    style={styles.input}
                    placeholder="startup, remote, dream-company"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </Field>

                <Field label="Follow-up Date">
                  <input
                    type="date"
                    style={styles.input}
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </Field>

                <Field label="Last Contact">
                  <input
                    type="date"
                    style={styles.input}
                    value={form.lastContactAt}
                    onChange={(e) => setForm({ ...form, lastContactAt: e.target.value })}
                  />
                </Field>

                <Field label="Notes" full>
                  <textarea
                    style={styles.textarea}
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Field>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeEdit} style={styles.cancelBtn} disabled={saving}>
                  Cancel
                </button>
                <button type="button" onClick={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label style={{ ...styles.field, ...(full ? styles.fieldFull : {}) }}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '24px',
  },
  wrapper: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
  },
  linkButton: {
    padding: '10px 16px',
    backgroundColor: '#0070f3',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  banner: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  bannerSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  bannerError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
  },
  empty: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  tableWrap: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '14px 16px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fafafa',
  },
  pageInfo: {
    fontSize: '13px',
    color: '#666',
  },
  pageButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pageBtn: {
    padding: '8px 14px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  pageBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  pageNumber: {
    fontSize: '13px',
    color: '#555',
    minWidth: '100px',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    borderBottom: '1px solid #eee',
    color: '#555',
    fontWeight: '600',
    backgroundColor: '#fafafa',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'top',
  },
  muted: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
  },
  warn: {
    fontSize: '11px',
    color: '#c0392b',
    marginTop: '4px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  editBtn: {
    padding: '6px 10px',
    marginRight: '6px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  modalMeta: {
    color: '#666',
    fontSize: '13px',
    marginBottom: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: '#eee',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 16px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
