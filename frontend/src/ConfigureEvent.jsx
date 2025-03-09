// frontend/src/ConfigureEvent.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ConfigureEvent = () => {
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationFields: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setEventData({...eventData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...eventData,
        registrationFields: eventData.registrationFields.split(',').map(field => field.trim())
      };
      await axios.post('/api/events', payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Event created successfully!');
      setEventData({ name: '', description: '', startDate:'', endDate:'', registrationFields:'' });
    } catch(err) {
      setMessage('Error creating event: ' + err.response.data.message);
    }
  };

  return (
    <div>
      <h2>Configure New Event</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Event Name:</label><br/>
        <input type="text" name="name" value={eventData.name} onChange={handleChange} required /><br/>
        <label>Description:</label><br/>
        <textarea name="description" value={eventData.description} onChange={handleChange} /><br/>
        <label>Start Date:</label><br/>
        <input type="date" name="startDate" value={eventData.startDate} onChange={handleChange} required /><br/>
        <label>End Date:</label><br/>
        <input type="date" name="endDate" value={eventData.endDate} onChange={handleChange} required /><br/>
        <label>Registration Fields (comma separated):</label><br/>
        <input type="text" name="registrationFields" value={eventData.registrationFields} onChange={handleChange} /><br/>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default ConfigureEvent;
