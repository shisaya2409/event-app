// backend/models/Guest.js
const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String },
  // Any additional dynamic fields filled out during registration
  customFields: { type: mongoose.Schema.Types.Mixed },
  checkInStatus: { type: Boolean, default: false },
  checkInTime:   { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Guest', GuestSchema);
