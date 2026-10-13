import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HostDashboard() {
  const [cars, setCars] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [c, r] = await Promise.all([api('/vehicles/mine'), api('/bookings/requests')]);
      setCars(c);
      setRequests(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function respond(id, action) {
    setError('');
    try {
      await api(`/bookings/${id}/respond`, { method: 'PATCH', body: { action } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(car) {
    setError('');
    const next = car.listingStatus === 'active' ? 'paused' : 'active';
    try {
      await api(`/vehicles/${car._id}`, { method: 'PUT', body: { listingStatus: next } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeCount = cars.filter((c) => c.listingStatus === 'active').length;
  const pendingCount = requests.filter((r) => r.status === 'requested').length;
  const confirmedCount = requests.filter((r) => r.status === 'confirmed').length;

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Host dashboard</h1>
        <Link to="/host/add-car"><button>+ Add car</button></Link>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div className="card stat"><span>Active listings</span><p className="num">{activeCount}</p></div>
        <div className="card stat"><span>Pending requests</span><p className="num">{pendingCount}</p></div>
        <div className="card stat"><span>Confirmed bookings</span><p className="num">{confirmedCount}</p></div>
      </div>

      <h2>My cars</h2>
      {cars.length === 0 ? (
        <p>You have not listed any cars yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Car</th><th>Location</th><th>Price / day</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c._id}>
                <td>{c.make} {c.model} ({c.year})</td>
                <td>{c.location}</td>
                <td>KES {c.dailyPrice.toLocaleString()}</td>
                <td><span className="badge">{c.listingStatus}</span></td>
                <td>
                  <button className="secondary small" onClick={() => toggleStatus(c)}>
                    {c.listingStatus === 'active' ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 40 }}>Booking requests</h2>
      {requests.length === 0 ? (
        <p>No booking requests yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id}>
                <td>
                  {r.customerId?.fullName}
                  <br /><span className="muted">{r.customerId?.phone} · ID {r.customerId?.verificationStatus}</span>
                </td>
                <td>{r.vehicleId?.make} {r.vehicleId?.model}</td>
                <td>{fmt(r.startDate)} to {fmt(r.endDate)}</td>
                <td>KES {r.totalPrice.toLocaleString()}</td>
                <td><span className="badge">{r.status}</span></td>
                <td>
                  {r.status === 'requested' ? (
                    <div className="actions">
                      <button className="small" onClick={() => respond(r._id, 'confirm')}>Accept</button>
                      <button className="secondary small" onClick={() => respond(r._id, 'decline')}>Decline</button>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}