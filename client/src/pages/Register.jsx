import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'customer' });
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card form-card">
      <h2>Create your account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Full name</label>
        <input value={form.fullName} onChange={update('fullName')} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={update('email')} required />
        <label>Phone number</label>
        <input value={form.phone} onChange={update('phone')} required />
        <label>Password (at least 8 characters)</label>
        <input type="password" value={form.password} onChange={update('password')} required />
        <label>I want to</label>
        <select value={form.role} onChange={update('role')}>
          <option value="customer">Rent a car (Customer)</option>
          <option value="host">List my car (Host)</option>
        </select>
        <button type="submit">Register</button>
      </form>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}