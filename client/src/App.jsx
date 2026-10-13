import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireRole from './components/RequireRole';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetails from './pages/CarDetails';
import MyBookings from './pages/MyBookings';
import HostDashboard from './pages/HostDashboard';
import AddCar from './pages/AddCar';
import Verify from './pages/Verify';
import AdminReview from './pages/AdminReview';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cars/:id" element={<CarDetails />} />
        <Route path="/my-bookings" element={<RequireRole roles={['customer']}><MyBookings /></RequireRole>} />
        <Route path="/host" element={<RequireRole roles={['host']}><HostDashboard /></RequireRole>} />
        <Route path="/host/add" element={<RequireRole roles={['host']}><AddCar /></RequireRole>} />
        <Route path="/verify" element={<RequireRole roles={['customer', 'host']}><Verify /></RequireRole>} />
        <Route path="/admin" element={<RequireRole roles={['admin']}><AdminReview /></RequireRole>} />
      </Routes>
    </>
  );
}