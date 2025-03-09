import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const history = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/login', { email, password });
      localStorage.setItem('token', data.token);
      history.push('/checkin');
    } catch(err) {
      setMessage('Invalid credentials');
    }
  };

  return (
    <div>
      <h2>Employee Login</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Email:</label><br/>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /><br/>
        <label>Password:</label><br/>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /><br/>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
