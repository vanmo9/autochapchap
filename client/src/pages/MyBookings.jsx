import { useEffect, useState } from 'react';
import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [payingId, setPayingId] = useState('');
  const [phone, setPhone] = useState('');
  const [payError, setPayError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const [b, p] = await Promise.all([api('/bookings/mine'), api('/payments/mine')]);
      setBookings(b);
      setPayments(p);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  const paymentFor = (b) => payments.find((p) => p.bookingId === b._id);

  const canCancel = (b) =>
    b.status === 'requested' || (b.status === 'confirmed' && new Date(b.startDate) > new Date());

  async function cancel(b) {
    const paid = paymentFor(b)?.status === 'paid';
    if (!window.confirm(paid ? 'Cancel this booking? Your payment will be refunded.' : 'Cancel this booking?')) return;
    setError('');
    setNotice('');
    setBusyId(b._id);
    try {
      await api(`/bookings/${b._id}/cancel`, { method: 'PATCH' });
      if (payingId === b._id) setPayingId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function pay(e, b) {
    e.preventDefault();
    setPayError('');
    setNotice('');
    setBusyId(b._id);
    try {
      const payment = await api('/payments', { method: 'POST', body: { bookingId: b._id, phone } });
      setNotice(`Payment of KES ${payment.amount.toLocaleString()} received. Reference ${payment.reference}.`);
      setPayingId('');
      setPhone('');
      await load();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setBusyId('');
    }
  }

  const payingBooking = bookings?.find((b) => b._id === payingId);

  return (
    <div className="container">
      <h1>My bookings</h1>
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      {!bookings && !error && <p>Loading...</p>}
      {bookings && bookings.length === 0 && <p>You have no bookings yet.</p>}
      {bookings && bookings.length > 0 && (
        <table>
          <thead>
            <tr><th>Car</th><th>Host</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th>Action</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const p = paymentFor(b);
              return (
                <tr key={b._id}>
                  <td>{b.vehicleId?.make} {b.vehicleId?.model}</td>
                  <td>{b.hostId?.fullName}</td>
                  <td>{fmt(b.startDate)} to {fmt(b.endDate)}</td>
                  <td>KES {b.totalPrice.toLocaleString()}</td>
                  <td><span className="badge">{b.status}</span></td>
                  <td>
                    {p ? (
                      <>
                        <span className="badge">{p.status === 'paid' ? 'Paid' : 'Refunded'}</span>
                        <br />
                        <span className="muted">{p.reference}</span>
                      </>
                    ) : b.status === 'confirmed' ? (
                      <span className="badge">Unpaid</span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      {b.status === 'confirmed' && !p && (
                        <button className="small" onClick={() => { setPayingId(b._id); setPayError(''); setNotice(''); }}>
                          Pay now
                        </button>
                      )}
                      {canCancel(b) && (
                        <button className="secondary small" disabled={busyId === b._id} onClick={() => cancel(b)}>
                          Cancel
                        </button>
                      )}
                      {!(b.status === 'confirmed' && !p) && !canCancel(b) && <span className="muted">-</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {payingBooking && (
        <form onSubmit={(e) => pay(e, payingBooking)} className="card" style={{ maxWidth: 440, marginTop: 24 }}>
          <h3>Pay for {payingBooking.vehicleId?.make} {payingBooking.vehicleId?.model}</h3>
          <p><strong>Amount: KES {payingBooking.totalPrice.toLocaleString()}</strong></p>
          <p className="muted">Demo payment. No real money is charged.</p>
          <label>M-Pesa phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" required />
          {payError && <p className="error">{payError}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" disabled={busyId === payingBooking._id}>
              {busyId === payingBooking._id ? 'Processing...' : 'Confirm payment'}
            </button>
            <button type="button" className="secondary" onClick={() => setPayingId('')}>Close</button>
          </div>
        </form>
      )}
    </div>
  );
}