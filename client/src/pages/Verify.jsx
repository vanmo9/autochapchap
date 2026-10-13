import { useEffect, useState } from 'react';
import { api } from '../api';

const API_URL = 'http://localhost:5000/api';
const TYPES = [
  { key: 'national_id', label: 'National ID' },
  { key: 'driving_licence', label: 'Driving licence' }
];
const OVERALL = {
  not_uploaded: 'Not uploaded',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected'
};
const DOC_STATUS = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };

function UploadCard({ type, doc, onDone }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!file) return setError('Please choose a file first');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('documentType', type.key);
      fd.append('file', file);
      const res = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setFile(null);
      setResetKey((k) => k + 1);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card doc-card">
      <h3>{type.label}</h3>
      <p>
        Status:{' '}
        <span className="badge">{doc ? DOC_STATUS[doc.status] : 'Not uploaded'}</span>
      </p>
      {doc?.status === 'rejected' && (
        <p className="error">Rejected: {doc.rejectionReason}. Please upload a clearer copy.</p>
      )}
      {doc?.status === 'approved' ? (
        <p className="muted">This document has been approved.</p>
      ) : (
        <form onSubmit={submit}>
          <input
            key={resetKey}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <p className="muted">JPG, PNG or PDF, up to 5 MB.</p>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? 'Uploading...' : doc ? 'Replace and resubmit' : 'Upload'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function Verify() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setData(await api('/documents/mine'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <h1>Verify your identity</h1>
      <p className="muted">
        Upload clear photos of your documents. An Admin reviews them, and you can only request or
        list cars once both are approved.
      </p>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p>Loading...</p>}
      {data && (
        <>
          <p>
            Overall status: <span className="badge">{OVERALL[data.verificationStatus]}</span>
          </p>
          <div className="doc-grid">
            {TYPES.map((t) => (
              <UploadCard
                key={t.key}
                type={t}
                doc={data.documents.find((d) => d.documentType === t.key)}
                onDone={load}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}