import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HostDashboard() {
  const [cars, setCars] = useState(null);
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      const [c, r] = await Promise.all([api('/vehicles/mine'), api('/bookings/requests')]);
      setCars(c);
      setRequests(r);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id, path, body) {
    setError('');
    setBusyId(id);
    try {
      await api(`/bookings/${id}/${path}`, { method: 'PATCH', body });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function toggleCar(car) {
    setError('');
    const next = car.listingStatus === 'active' ? 'paused' : 'active';
    try {
      await api(`/vehicles/${car._id}`, { method: 'PUT', body: { listingStatus: next } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const count = (status) => (requests ? requests.filter((r) => r.status === status).length : '-');

  return (
    <div className="container">
      <div className="row-between">
        <h1>Host dashboard</h1>
        <Link to="/host/add"><button>+ Add car</button></Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div className="card stat"><span>Listed cars</span><strong>{cars ? cars.length : '-'}</strong></div>
        <div className="card stat"><span>Pending requests</span><strong>{count('requested')}</strong></div>
        <div className="card stat"><span>Confirmed bookings</span><strong>{count('confirmed')}</strong></div>
        <div className="card stat"><span>Completed trips</span><strong>{count('completed')}</strong></div>
      </div>

      <h2>My cars</h2>
      {!cars && !error && <p>Loading...</p>}
      {cars && cars.length === 0 && <p>You have not listed any cars yet.</p>}
      {cars && cars.length > 0 && (
        <table>
          <thead>
            <tr><th>Car</th><th>Location</th><th>Price / day</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car._id}>
                <td>{car.make} {car.model} ({car.year})</td>
                <td>{car.location}</td>
                <td>KES {car.dailyPrice.toLocaleString()}</td>
                <td><span className="badge">{car.listingStatus}</span></td>
                <td>
                  <button className="secondary small" onClick={() => toggleCar(car)}>
                    {car.listingStatus === 'active' ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 40 }}>Booking requests</h2>
      {requests && requests.length === 0 && <p>No booking requests yet.</p>}
      {requests && requests.length > 0 && (
        <table>
          <thead>
            <tr><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {requests.map((b) => {
              const started = new Date(b.startDate) <= new Date();
              return (
                <tr key={b._id}>
                  <td>
                    {b.customerId?.fullName}
                    <br />
                    <span className="muted">
                      {b.customerId?.verificationStatus === 'verified' ? 'Verified' : 'Not verified'}
                    </span>
                  </td>
                  <td>{b.vehicleId?.make} {b.vehicleId?.model}</td>
                  <td>{fmt(b.startDate)} to {fmt(b.endDate)}</td>
                  <td>KES {b.totalPrice.toLocaleString()}</td>
                  <td><span className="badge">{b.status}</span></td>
                  <td>
                    {b.status === 'requested' && (
                      <div className="actions">
                        <button className="small" disabled={busyId === b._id} onClick={() => act(b._id, 'respond', { action: 'confirm' })}>Accept</button>
                        <button className="secondary small" disabled={busyId === b._id} onClick={() => act(b._id, 'respond', { action: 'decline' })}>Decline</button>
                      </div>
                    )}
                    {b.status === 'confirmed' && started && (
                      <button className="small" disabled={busyId === b._id} onClick={() => act(b._id, 'complete')}>
                        Mark completed
                      </button>
                    )}
                    {b.status === 'confirmed' && !started && <span className="muted">Starts {fmt(b.startDate)}</span>}
                    {!['requested', 'confirmed'].includes(b.status) && <span className="muted">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}