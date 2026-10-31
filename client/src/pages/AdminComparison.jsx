import { useEffect, useState } from 'react';
import { api } from '../api';
import { brokerBaseline as base } from '../brokerBaseline';

const hoursText = (h) => {
  if (h === null || h === undefined) return 'No data yet';
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} minutes` : `${h.toFixed(1)} hours`;
};
const known = (v, unit = '') => (v === null || v === undefined ? 'Not collected yet' : `${v}${unit}`);

export default function AdminComparison() {
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/metrics').then(setM).catch((err) => setError(err.message));
  }, []);

  const count = (s) => (m?.byStatus?.[s] ?? 0);

  return (
    <div className="container">
      <h1>Admin: AutoChapChap vs the broker process</h1>
      <p className="muted">
        AutoChapChap figures are measured from this system's own test bookings, not from real users.
        Broker figures come from my survey: {base.source}
        {base.sampleSize ? ` (${base.sampleSize} people)` : ' (not collected yet)'}.
      </p>
      {error && <p className="error">{error}</p>}
      {!m && !error && <p>Loading...</p>}

      {m && (
        <>
          <div className="stats">
            <div className="card stat"><span>Total bookings</span><strong>{m.totalBookings}</strong></div>
            <div className="card stat"><span>Answered by hosts</span><strong>{m.respondedCount}</strong></div>
            <div className="card stat"><span>Confirmed or completed</span><strong>{count('confirmed') + count('completed')}</strong></div>
            <div className="card stat"><span>Active listings</span><strong>{m.activeListings}</strong></div>
          </div>

          <h2>Comparison</h2>
          <table>
            <thead>
              <tr><th>Measure</th><th>AutoChapChap</th><th>Broker process (survey)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>People involved in one hire</td>
                <td>2 (customer and host)</td>
                <td>{known(base.avgPeopleInvolved)}</td>
              </tr>
              <tr>
                <td>Steps for the customer</td>
                <td>5 (search, open the car, request, host confirms, pay)</td>
                <td>{known(base.avgSteps)}</td>
              </tr>
              <tr>
                <td>Time until the owner answers</td>
                <td>
                  Average {hoursText(m.avgResponseHours)}, median {hoursText(m.medianResponseHours)}
                  {m.respondedCount > 0 ? ` (${m.respondedCount} test bookings)` : ''}
                </td>
                <td>{known(base.avgHoursToGetCar, ' hours')}</td>
              </tr>
              <tr>
                <td>Extra margin added to the owner's price</td>
                <td>KES 0 (no platform fee in this prototype)</td>
                <td>{known(base.avgBrokerMarginKes, ' KES per day')}</td>
              </tr>
              <tr>
                <td>Identity checks</td>
                <td>ID and licence reviewed by an Admin, status visible to both sides</td>
                <td>Informal copy of ID or licence sent over WhatsApp (as described in my proposal)</td>
              </tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 12 }}>
            Limits: the AutoChapChap times come from my own testing, there is no real payment or insurance,
            and the broker figures depend on how many people I surveyed.
          </p>
        </>
      )}
    </div>
  );
}