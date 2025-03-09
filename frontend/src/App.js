// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import RegistrationForm from "./RegistrationForm";
import CheckInPanel from "./CheckInPanel";
import ConfigureEvent from "./ConfigureEvent";

function App() {
  return (
    <Router>
      <nav style={{ margin: "20px" }}>
        <Link to="/register/your_event_id" style={{ marginRight:'10px' }}>Register</Link>
        <Link to="/login" style={{ marginRight:'10px' }}>Employee Login</Link>
        <Link to="/configure" style={{ marginRight:'10px' }}>Configure Event</Link>
        <Link to="/checkin">Check-In Panel</Link>
      </nav>
      <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/configure" element={<ConfigureEvent />} />
         <Route path="/checkin" element={<CheckInPanel />} />
         <Route path="/register/:eventId" element={<RegistrationForm />} />
         <Route path="/" element={<div>Welcome! Please use the navigation links above.</div>} />
      </Routes>
    </Router>
  );
}

export default App;
