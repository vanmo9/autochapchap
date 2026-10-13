import { useEffect, useState } from 'react';
import { api } from '../api';
import CarCard from '../components/CarCard';

const EMPTY = { location: '', vehicleType: '', fuelType: '', maxPrice: '' };

export default function Home() {
  const [filters, setFilters] = useState(EMPTY);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function search(f) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(f).forEach(([key, value]) => { if (value) params.append(key, value); });
    try {
      setCars(await api(`/vehicles?${params.toString()}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(EMPTY); }, []);

  const update = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  return (
    <div className="container">
      <h1>Get a car without the broker chain</h1>
      <p className="muted">Cars listed directly by their owners.</p>

      <form
        className="card filters"
        onSubmit={(e) => { e.preventDefault(); search(filters); }}
      >
        <div>
          <label>Location</label>
          <input placeholder="e.g. Nairobi" value={filters.location} onChange={update('location')} />
        </div>
        <div>
          <label>Car type</label>
          <select value={filters.vehicleType} onChange={update('vehicleType')}>
            <option value="">Any</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="van">Van</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
        <div>
          <label>Fuel</label>
          <select value={filters.fuelType} onChange={update('fuelType')}>
            <option value="">Any</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>
        <div>
          <label>Max price / day (KES)</label>
          <input type="number" min="0" value={filters.maxPrice} onChange={update('maxPrice')} />
        </div>
        <div className="filter-buttons">
          <button type="submit">Search</button>
          <button
            type="button"
            className="secondary"
            onClick={() => { setFilters(EMPTY); search(EMPTY); }}
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading cars...</p>
      ) : cars.length === 0 ? (
        <p>No cars found. Try changing the filters.</p>
      ) : (
        <>
          <h2>{cars.length} car{cars.length === 1 ? '' : 's'} found</h2>
          <div className="grid">
            {cars.map((car) => <CarCard key={car._id} car={car} />)}
          </div>
        </>
      )}
    </div>
  );
}