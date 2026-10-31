import { useEffect, useState } from 'react';
import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      setBookings(await api('/bookings/mine'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  const canCancel = (b) =>
    b.status === 'requested' || (b.status === 'confirmed' && new Date(b.startDate) > new Date());

  async function cancel(b) {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    setBusyId(b._id);
    try {
      await api(`/bookings/${b._id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="container">
      <h1>My bookings</h1>
      {error && <p className="error">{error}</p>}
      {!bookings && !error && <p>Loading...</p>}
      {bookings && bookings.length === 0 && <p>You have no bookings yet.</p>}
      {bookings && bookings.length > 0 && (
        <table>
          <thead>
            <tr><th>Car</th><th>Host</th><th>Dates</th><th>Total</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.vehicleId?.make} {b.vehicleId?.model}</td>
                <td>{b.hostId?.fullName}</td>
                <td>{fmt(b.startDate)} to {fmt(b.endDate)}</td>
                <td>KES {b.totalPrice.toLocaleString()}</td>
                <td><span className="badge">{b.status}</span></td>
                <td>
                  {canCancel(b) ? (
                    <button className="secondary small" disabled={busyId === b._id} onClick={() => cancel(b)}>
                      Cancel
                    </button>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}