import { Link } from 'react-router-dom';

export default function CarCard({ car }) {
  const verified = car.hostId?.verificationStatus === 'verified';
  return (
    <Link to={`/cars/${car._id}`} className="car-card">
      <div className="photo">Photo</div>
      <h3>{car.make} {car.model} ({car.year})</h3>
      <p className="muted">{car.location}</p>
      <p><strong>KES {car.dailyPrice.toLocaleString()} / day</strong></p>
      <p className="muted">{car.vehicleType} · {car.fuelType} · {car.seats} seats</p>
      {verified && <span className="badge">Verified host</span>}
    </Link>
  );
}