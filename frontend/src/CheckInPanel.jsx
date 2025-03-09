// frontend/src/CheckInPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Adjust the URL as needed in production (or use window.location.origin)
const socket = io('http://localhost:5000');

const CheckInPanel = () => {
  const [eventId, setEventId] = useState('');
  const [guests, setGuests] = useState([]);
  const token = localStorage.getItem('token');

  // Fetch guests for a given event when eventId changes
  useEffect(() => {
    if (eventId) {
      axios.get(`/api/events/${eventId}/guests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setGuests(res.data))
      .catch(err => console.error(err));
    }
  }, [eventId, token]);

  // Listen for real-time check‑in updates
  useEffect(() => {
    socket.on('updateCheckIn', updatedGuest => {
      setGuests(prevGuests =>
        prevGuests.map(guest =>
          guest._id === updatedGuest._id ? updatedGuest : guest
        )
      );
    });

    return () => socket.off('updateCheckIn');
  }, []);

  const handleCheckIn = async (guestId) => {
    try {
      const { data } = await axios.post(`/api/guests/${guestId}/checkin`, null, { headers: { Authorization: `Bearer ${token}` }});
      // The backend emits the update via Socket.IO; additional client-side actions (if any) can be handled here.
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Guest Check-In Panel</h2>
      <div>
        <label>Event ID:</label>
        <input type="text" value={eventId} onChange={e => setEventId(e.target.value)} placeholder="Enter event ID" />
      </div>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Checked In</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {guests.map(guest => (
            <tr key={guest._id}>
              <td>{guest.firstName} {guest.lastName}</td>
              <td>{guest.email}</td>
              <td>{guest.checkInStatus ? "Yes" : "No"}</td>
              <td>
                {!guest.checkInStatus && 
                  <button onClick={() => handleCheckIn(guest._id)}>
                    Check-In
                  </button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CheckInPanel;
