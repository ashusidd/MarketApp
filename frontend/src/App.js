import React, { useState, useEffect } from 'react';
import axios from 'axios';

// APNA RENDER URL YAHAN DALO
const RENDER_URL = "https://marketapp-y0cq.onrender.com";
const API = `${RENDER_URL}/api`;

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');

  // 1. Login Logic
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/login`, { mobile, name });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      alert("Backend se connect nahi ho pa raha!");
    }
  };

  // 2. Join Group Logic
  const joinGroup = async () => {
    try {
      const res = await axios.post(`${API}/join-group`, { code: inviteCode, mobile: user.mobile });
      setGroup(res.data);
      fetchSummary(res.data._id);
    } catch (err) {
      alert("Galti: Group nahi mila!");
    }
  };

  // 3. Add Expense Logic
  const addExpense = async () => {
    try {
      await axios.post(`${API}/add-expense`, { groupId: group._id, itemName, price: Number(price), boughtBy: user.name });
      fetchSummary(group._id);
      setItemName('');
      setPrice('');
    } catch (err) {
      alert("Kharcha add nahi hua!");
    }
  };

  const fetchSummary = async (gid) => {
    try {
      const res = await axios.get(`${API}/summary/${gid}`);
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.log("Summary fetch failed");
    }
  };

  // Login Screen
  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>🛒 Market Tracker Login</h2>
        <input placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} style={inputStyle} /><br />
        <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} /><br />
        <button onClick={handleLogin} style={buttonStyle}>Enter App</button>
      </div>
    );
  }

  // Main App Screen
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Mubarak ho, {user.name}! 👋</h1>
      {!group ? (
        <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '10px' }}>
          <h3>Join a Group to Start</h3>
          <input placeholder="Enter Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={inputStyle} />
          <button onClick={joinGroup} style={buttonStyle}>Join Now</button>
        </div>
      ) : (
        <div>
          <div style={{ background: '#e1f5fe', padding: '15px', borderRadius: '10px' }}>
            <h3>Group: {group.name} 🏠</h3>
            <p>Invite Code: <b>{group.inviteCode}</b></p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>Add New Bill</h4>
            <input placeholder="Item (e.g. Milk)" value={itemName} onChange={e => setItemName(e.target.value)} style={inputStyle} />
            <input placeholder="Price (₹)" type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
            <button onClick={addExpense} style={{ ...buttonStyle, background: '#4caf50' }}>Add Expense</button>
          </div>

          <hr />
          <h4>Recent Expenses:</h4>
          {expenses.length === 0 ? <p>No expenses yet.</p> : expenses.map((exp, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ddd', padding: '5px 0' }}>
              <b>{exp.itemName}</b>: ₹{exp.price} <small>(By: {exp.boughtBy})</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Basic Styles
const inputStyle = { padding: '10px', margin: '5px', width: '80%', maxWidth: '300px', borderRadius: '5px', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px 20px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default App;