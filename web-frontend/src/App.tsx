import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Clients from "./pages/Clients";
import IntakeForm from "./pages/IntakeForm";
import ClientDetails from "./pages/ClientDetails";
import Appointments from "./pages/Appointments";

const App = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/intake" element={<PrivateRoute><IntakeForm /></PrivateRoute>} />
      <Route path="/clients/:id" element={<PrivateRoute><ClientDetails /></PrivateRoute>} />
      <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
    </Routes>
  </Router>
);

export default App;