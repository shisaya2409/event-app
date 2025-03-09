// frontend/src/RegistrationForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RegistrationForm = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [guest, setGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // customFields will collect any additional responses
    customFields: {}
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`/api/events/${eventId}`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err));
  }, [eventId]);

  const handleChange = e => {
    setGuest({ ...guest, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`/api/events/${eventId}/guests`, guest);
      setMessage('Registration successful!');
      setGuest({ firstName: '', lastName: '', email: '', phone: '', customFields: {} });
    } catch(err) {
      setMessage('Error: ' + err.response.data.error);
    }
  };

  if (!event) return <div>Loading event details...</div>;

  return (
    <div>
      <h2>Register for {event.name}</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>First Name:</label><br/>
        <input type="text" name="firstName" value={guest.firstName} onChange={handleChange} required /><br/>
        <label>Last Name:</label><br/>
        <input type="text" name="lastName" value={guest.lastName} onChange={handleChange} required /><br/>
        <label>Email:</label><br/>
        <input type="email" name="email" value={guest.email} onChange={handleChange} required /><br/>
        <label>Phone:</label><br/>
        <input type="tel" name="phone" value={guest.phone} onChange={handleChange} /><br/>

        {/* Render any additional (custom) registration fields defined for this event */}
        {event.registrationFields.filter(field => !["firstName", "lastName", "email", "phone"].includes(field))
          .map((field, index) => (
            <div key={index}>
              <label>{field}:</label><br/>
              <input type="text" name={field} onChange={handleChange} />
            </div>
        ))}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegistrationForm;
