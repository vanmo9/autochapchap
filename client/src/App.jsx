import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetails from './pages/CarDetails';
import MyBookings from './pages/MyBookings';
import HostDashboard from './pages/HostDashboard';
import AddCar from './pages/AddCar';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cars/:id" element={<CarDetails />} />
        <Route path="/my-bookings" element={<ProtectedRoute role="customer"><MyBookings /></ProtectedRoute>} />
        <Route path="/host" element={<ProtectedRoute role="host"><HostDashboard /></ProtectedRoute>} />
        <Route path="/host/add-car" element={<ProtectedRoute role="host"><AddCar /></ProtectedRoute>} />
      </Routes>
    </>
  );
}