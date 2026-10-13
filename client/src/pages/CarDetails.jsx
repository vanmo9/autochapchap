import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function CarDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api(`/vehicles/${id}`).then(setCar).catch((err) => setLoadError(err.message));
  }, [id]);

  if (loadError) return <div className="container"><p className="error">{loadError}</p></div>;
  if (!car) return <div className="container"><p>Loading...</p></div>;

  const days = startDate && endDate
    ? Math.ceil((new Date(endDate) - new Date(startDate)) / DAY_MS)
    : 0;
  const total = days > 0 ? days * car.dailyPrice : 0;
  const verified = car.hostId?.verificationStatus === 'verified';
  const today = new Date().toISOString().split('T')[0];

  async function requestBooking(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api('/bookings', { method: 'POST', body: { vehicleId: car._id, startDate, endDate } });
      navigate('/my-bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container details">
      <div>
        <div className="photo big">Main car photo</div>
        <h3>Description</h3>
        <p>{car.description || 'No description provided.'}</p>
      </div>

      <div>
        <h1>{car.make} {car.model} ({car.year})</h1>
        <h2>KES {car.dailyPrice.toLocaleString()} / day</h2>
        <p>{car.vehicleType} · {car.fuelType} · {car.seats} seats</p>
        <p>Location: {car.location}</p>
        <p>Self-drive only</p>

        <div className="card host-box">
          <strong>Host: {car.hostId?.fullName}</strong>
          <p className="muted">
            {verified ? 'Verified host (ID and licence reviewed by Admin)' : 'Host not yet verified'}
          </p>
        </div>

        {!user && (
          <p><Link to="/login">Log in</Link> as a customer to request this car.</p>
        )}
        {user && user.role !== 'customer' && (
          <p className="muted">Only customer accounts can request bookings.</p>
        )}
        {user?.role === 'customer' && (
          <form onSubmit={requestBooking} className="card" style={{ marginTop: 16 }}>
            <label>Pick-up date</label>
            <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <label>Return date</label>
            <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            {days > 0 && (
              <p><strong>{days} day{days === 1 ? '' : 's'} x KES {car.dailyPrice.toLocaleString()} = KES {total.toLocaleString()}</strong></p>
            )}
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={sending} style={{ width: '100%', marginTop: 12 }}>
              {sending ? 'Sending...' : 'Request booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}