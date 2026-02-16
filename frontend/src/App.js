import React, { useState, useEffect } from 'react';
import axios from 'axios';

// APNA RENDER URL YAHAN DALO
const API = "https://marketapp-y0cq.onrender.com/";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [group, setGroup] = useState(JSON.parse(localStorage.getItem('group')) || null);
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ name: '', mobile: '', isSignup: false, gName: '', code: '', item: '', price: '' });

  // Fetch Expenses
  const fetchExpenses = async (gid) => {
    const res = await axios.get(`${API}/expenses/${gid}`);
    setExpenses(res.data);
  };

  useEffect(() => { if (group) fetchExpenses(group._id); }, [group]);

  // Handlers
  const handleAuth = async () => {
    const res = await axios.post(`${API}/auth`, { ...formData });
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
  };

  const createGroup = async () => {
    const res = await axios.post(`${API}/create-group`, { name: formData.gName, mobile: user.mobile });
    setGroup(res.data);
    localStorage.setItem('group', JSON.stringify(res.data));
  };

  const joinGroup = async () => {
    const res = await axios.post(`${API}/join-group`, { code: formData.code, mobile: user.mobile });
    setGroup(res.data);
    localStorage.setItem('group', JSON.stringify(res.data));
  };

  const addExpense = async () => {
    await axios.post(`${API}/add-expense`, { groupId: group._id, itemName: formData.item, price: formData.price, boughtBy: user.name });
    fetchExpenses(group._id);
    setFormData({ ...formData, item: '', price: '' });
  };

  // UI Logic
  if (!user) return (
    <div style={cardStyle}>
      <h2>{formData.isSignup ? "Signup" : "Login"}</h2>
      {formData.isSignup && <input style={inputStyle} placeholder="Name" onChange={e => setFormData({ ...formData, name: e.target.value })} />}
      <input style={inputStyle} placeholder="Mobile" onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
      <button style={btnStyle} onClick={handleAuth}>{formData.isSignup ? "Create" : "Enter"}</button>
      <p onClick={() => setFormData({ ...formData, isSignup: !formData.isSignup })}>Switch to {formData.isSignup ? "Login" : "Signup"}</p>
    </div>
  );

  if (!group) return (
    <div style={cardStyle}>
      <h2>Welcome, {user.name}</h2>
      <input style={inputStyle} placeholder="New Group Name" onChange={e => setFormData({ ...formData, gName: e.target.value })} />
      <button style={btnStyle} onClick={createGroup}>Create Group</button>
      <hr />
      <input style={inputStyle} placeholder="Invite Code" onChange={e => setFormData({ ...formData, code: e.target.value })} />
      <button style={{ ...btnStyle, background: 'green' }} onClick={joinGroup}>Join Group</button>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <div style={{ background: '#eee', padding: '10px', borderRadius: '10px' }}>
        <h3>Group: {group.name} | Code: <b style={{ color: 'blue' }}>{group.inviteCode}</b></h3>
      </div>

      <div style={{ margin: '20px 0' }}>
        <input style={inputStyle} value={formData.item} placeholder="Item Name" onChange={e => setFormData({ ...formData, item: e.target.value })} />
        <input style={inputStyle} value={formData.price} placeholder="Price" type="number" onChange={e => setFormData({ ...formData, price: e.target.value })} />
        <button style={btnStyle} onClick={addExpense}>Add Bill</button>
      </div>

      <h4>Recent Bills:</h4>
      {expenses.map((exp, i) => (
        <div key={i} style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>
          <b>{exp.itemName}</b> - ₹{exp.price} <small>(By: {exp.boughtBy})</small>
        </div>
      ))}
      <button style={{ marginTop: '20px', background: 'red', color: 'white' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );
}

// Styles
const cardStyle = { textAlign: 'center', padding: '50px', maxWidth: '400px', margin: 'auto', boxShadow: '0 0 10px #ccc', marginTop: '50px', borderRadius: '15px' };
const inputStyle = { width: '90%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' };
const btnStyle = { width: '95%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default App;