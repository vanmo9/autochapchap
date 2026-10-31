import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminModeration() {
  const [tab, setTab] = useState('cars');
  const [cars, setCars] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      const [c, u] = await Promise.all([api('/admin/vehicles'), api('/admin/users')]);
      setCars(c);
      setUsers(u);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function moderateCar(car, action) {
    const text = action === 'remove'
      ? 'Remove this listing? Its open future bookings will be cancelled and any payments refunded.'
      : 'Restore this listing?';
    if (!window.confirm(text)) return;
    setError('');
    setNotice('');
    setBusyId(car._id);
    try {
      const result = await api(`/admin/vehicles/${car._id}`, { method: 'PATCH', body: { action } });
      setNotice(
        action === 'remove'
          ? `${car.make} ${car.model} removed. ${result.cancelledBookings} booking(s) cancelled.`
          : `${car.make} ${car.model} restored.`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function moderateUser(user, action) {
    const text = action === 'suspend'
      ? `Suspend ${user.fullName}? They will not be able to log in or use the system.`
      : `Reactivate ${user.fullName}?`;
    if (!window.confirm(text)) return;
    setError('');
    setNotice('');
    setBusyId(user._id);
    try {
      await api(`/admin/users/${user._id}`, { method: 'PATCH', body: { action } });
      setNotice(`${user.fullName} ${action === 'suspend' ? 'suspended' : 'reactivated'}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="container">
      <h1>Admin: moderation</h1>
      <div className="actions" style={{ marginBottom: 16 }}>
        <button className={tab === 'cars' ? '' : 'secondary'} onClick={() => setTab('cars')}>
          Listings {cars ? `(${cars.length})` : ''}
        </button>
        <button className={tab === 'users' ? '' : 'secondary'} onClick={() => setTab('users')}>
          Users {users ? `(${users.length})` : ''}
        </button>
      </div>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      {(!cars || !users) && !error && <p>Loading...</p>}

      {tab === 'cars' && cars && (
        cars.length === 0 ? <p>There are no listings yet.</p> : (
          <table>
            <thead>
              <tr><th>Car</th><th>Host</th><th>Location</th><th>Price / day</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car._id}>
                  <td>{car.make} {car.model} ({car.year})</td>
                  <td>
                    {car.hostId?.fullName}
                    <br />
                    <span className="muted">{car.hostId?.email}</span>
                  </td>
                  <td>{car.location}</td>
                  <td>KES {car.dailyPrice.toLocaleString()}</td>
                  <td><span className="badge">{car.listingStatus}</span></td>
                  <td>
                    {car.listingStatus === 'removed' ? (
                      <button className="small" disabled={busyId === car._id} onClick={() => moderateCar(car, 'restore')}>Restore</button>
                    ) : (
                      <button className="secondary small" disabled={busyId === car._id} onClick={() => moderateCar(car, 'remove')}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'users' && users && (
        users.length === 0 ? <p>There are no users yet.</p> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Verification</th><th>Account</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><span className="badge">{u.verificationStatus}</span></td>
                  <td><span className="badge">{u.accountStatus || 'active'}</span></td>
                  <td>
                    {u.accountStatus === 'suspended' ? (
                      <button className="small" disabled={busyId === u._id} onClick={() => moderateUser(u, 'reactivate')}>Reactivate</button>
                    ) : (
                      <button className="secondary small" disabled={busyId === u._id} onClick={() => moderateUser(u, 'suspend')}>Suspend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}