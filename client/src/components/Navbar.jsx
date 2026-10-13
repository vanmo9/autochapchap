import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <Link to="/" className="logo">AutoChapChap</Link>
      <div className="nav-links">
        <Link to="/">Browse cars</Link>
        {user?.role === 'customer' && <Link to="/my-bookings">My bookings</Link>}
        {user?.role === 'host' && <Link to="/host">Host dashboard</Link>}
        {(user?.role === 'customer' || user?.role === 'host') && <Link to="/verify">Verify identity</Link>}
        {user?.role === 'admin' && <Link to="/admin">Verification queue</Link>}
        {user ? (
          <>
            <span>{user.fullName} ({user.role})</span>
            <button className="secondary" onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}