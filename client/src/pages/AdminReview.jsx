import { useEffect, useState } from 'react';
import { api } from '../api';

const API_URL = 'http://localhost:5000/api';
const LABEL = { national_id: 'National ID', driving_licence: 'Driving licence' };
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function Preview({ docId }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    fetch(`${API_URL}/documents/${docId}/file`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load the file');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setType(blob.type);
        setUrl(objectUrl);
      })
      .catch((e) => setErr(e.message));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  if (err) return <p className="error">{err}</p>;
  if (!url) return <p>Loading file...</p>;
  if (type === 'application/pdf')
    return <a href={url} target="_blank" rel="noreferrer">Open the PDF in a new tab</a>;
  return <img src={url} alt="Uploaded document" className="preview-img" />;
}

export default function AdminReview() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [openId, setOpenId] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      setDocs(await api('/documents/pending'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function review(doc, action) {
    setError('');
    setNotice('');
    setBusyId(doc.id);
    try {
      const result = await api(`/documents/${doc.id}/review`, {
        method: 'PATCH',
        body: { action, reason }
      });
      setNotice(
        `${doc.user?.fullName}: ${LABEL[doc.documentType]} ${action === 'approve' ? 'approved' : 'rejected'}. ` +
        `Overall status is now ${result.userVerificationStatus}.`
      );
      setRejectId('');
      setReason('');
      setOpenId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="container">
      <h1>Admin: identity verification queue</h1>
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      {!docs && !error && <p>Loading...</p>}
      {docs && docs.length === 0 && <p>No documents are waiting for review.</p>}
      {docs && docs.length > 0 && (
        <p className="muted">{docs.length} document{docs.length === 1 ? '' : 's'} waiting for review.</p>
      )}

      {docs && docs.map((d) => (
        <div key={d.id} className="card doc-card" style={{ marginBottom: 16 }}>
          <strong>{d.user?.fullName}</strong>{' '}
          <span className="badge">{d.user?.role}</span>
          <p className="muted">{d.user?.email} · {d.user?.phone}</p>
          <p>{LABEL[d.documentType]}, uploaded {fmt(d.createdAt)}</p>

          <div className="actions">
            <button className="secondary small" onClick={() => setOpenId(openId === d.id ? '' : d.id)}>
              {openId === d.id ? 'Hide file' : 'View file'}
            </button>
            <button className="small" disabled={busyId === d.id} onClick={() => review(d, 'approve')}>
              Approve
            </button>
            <button
              className="secondary small"
              disabled={busyId === d.id}
              onClick={() => { setRejectId(rejectId === d.id ? '' : d.id); setReason(''); }}
            >
              Reject
            </button>
          </div>

          {openId === d.id && <div style={{ marginTop: 12 }}><Preview docId={d.id} /></div>}

          {rejectId === d.id && (
            <div style={{ marginTop: 12 }}>
              <label>Reason for rejecting (the user will see this)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Image is blurry"
              />
              <button
                className="small"
                style={{ marginTop: 10 }}
                disabled={busyId === d.id || !reason.trim()}
                onClick={() => review(d, 'reject')}
              >
                Confirm rejection
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}