import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function AddCar() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    make: '', model: '', year: '', vehicleType: 'suv', fuelType: 'diesel',
    seats: '', location: '', dailyPrice: '', description: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/vehicles', {
        method: 'POST',
        body: {
          ...form,
          year: Number(form.year),
          seats: Number(form.seats),
          dailyPrice: Number(form.dailyPrice)
        }
      });
      navigate('/host');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="card wide-card">
        <h2>Add a car listing</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div><label>Make</label><input value={form.make} onChange={update('make')} placeholder="Toyota" required /></div>
            <div><label>Model</label><input value={form.model} onChange={update('model')} placeholder="Prado TX" required /></div>
            <div><label>Year</label><input type="number" min="1990" max="2027" value={form.year} onChange={update('year')} required /></div>
            <div>
              <label>Car type</label>
              <select value={form.vehicleType} onChange={update('vehicleType')}>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            <div>
              <label>Fuel type</label>
              <select value={form.fuelType} onChange={update('fuelType')}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div><label>Seats</label><input type="number" min="1" max="20" value={form.seats} onChange={update('seats')} required /></div>
            <div><label>Daily price (KES)</label><input type="number" min="1" value={form.dailyPrice} onChange={update('dailyPrice')} required /></div>
            <div><label>Location</label><input value={form.location} onChange={update('location')} placeholder="Nairobi, Westlands" required /></div>
          </div>
          <label>Description</label>
          <textarea rows="4" value={form.description} onChange={update('description')} placeholder="Condition, mileage limit, rules..." />
          <div className="actions" style={{ marginTop: 20 }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Publish listing'}</button>
            <Link to="/host"><button type="button" className="secondary">Cancel</button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}