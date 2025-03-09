// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Parser } = require('json2csv');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Models
const User = require('./models/User');
const Event = require('./models/Event');
const Guest = require('./models/Guest');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---------------------
// Authentication Routes
// ---------------------

// Login endpoint for employees
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Middleware to protect routes and (optionally) enforce role requirements
const protect = (requiredRole) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || (requiredRole && decoded.role !== requiredRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
};

// ---------------------
// Event Management Routes
// ---------------------

// Create a new event (requires authentication)
app.post('/api/events', protect(), async (req, res) => {
  try {
    const eventData = { ...req.body, createdBy: req.user.id };
    const event = new Event(eventData);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get event details by ID (public endpoint so registration form can load event settings)
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// (Optional) List all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ---------------------
// Guest Registration & Management Routes
// ---------------------

// Public endpoint: Register a guest for a specific event
app.post('/api/events/:eventId/guests', async (req, res) => {
  try {
    const guestData = { ...req.body, eventId: req.params.eventId };
    const guest = new Guest(guestData);
    const savedGuest = await guest.save();
    res.status(201).json(savedGuest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get list of guests for an event (requires authentication)
app.get('/api/events/:eventId/guests', protect(), async (req, res) => {
  try {
    const guests = await Guest.find({ eventId: req.params.eventId });
    res.json(guests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update guest details (e.g., editing registration data) – protected route
app.put('/api/guests/:id', protect(), async (req, res) => {
  try {
    const updatedGuest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedGuest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a guest – protected route
app.delete('/api/guests/:id', protect(), async (req, res) => {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guest removed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Digital Check-In: Mark guest as checked in – protected route
app.post('/api/guests/:id/checkin', protect(), async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { checkInStatus: true, checkInTime: new Date() },
      { new: true }
    );
    res.json(guest);
    io.emit('updateCheckIn', guest); // Emit event via Socket.IO for real‑time updates
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export guests as CSV (for a given event) – protected route
app.get('/api/events/:eventId/export', protect(), async (req, res) => {
  try {
    let guests = await Guest.find({ eventId: req.params.eventId });
    guests = guests.map(guest => guest.toObject());

    // Optionally, you can allow filtering fields via query parameters
    const fields = req.query.fields ? req.query.fields.split(',') : (guests[0] ? Object.keys(guests[0]) : []);
    if (req.query.fields) {
      guests = guests.map(guest => {
        let filtered = {};
        fields.forEach(field => filtered[field] = guest[field]);
        return filtered;
      });
    }
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(guests);
    res.header('Content-Type', 'text/csv');
    res.attachment('guests.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email Communication to guests (for all events or a specific event) – protected route
app.post('/api/send-email', protect(), async (req, res) => {
  const { emails, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Event Team" <${process.env.EMAIL_USER}>`,
      to: emails.join(','),
      subject,
      text: message
    });
    res.json({ message: 'Emails sent', info });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------
// Serve React App in Production
// ---------------------

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all: send index.html if route not recognized (to support client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------
// Socket.IO Setup
// ---------------------

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for events from clients if needed (already emitting updates in check-in endpoint)
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server (using the HTTP server)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
