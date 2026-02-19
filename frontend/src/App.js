/* eslint-disable */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "https://marketapp-y0cq.onrender.com/api";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [group, setGroup] = useState(JSON.parse(localStorage.getItem('group')) || null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', isSignup: false, gName: '', code: '', item: '', price: '' });

  const fetchExpenses = async (gid) => {
    try {
      const res = await axios.get(`${API}/expenses/${gid}`);
      setExpenses(res.data);
    } catch (e) { console.error("Fetch error", e); }
  };

  useEffect(() => { if (group) fetchExpenses(group._id); }, [group]);

  const handleAuth = async () => {
    if (!formData.mobile) return alert("Mobile number dalo!");
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
    const res = await axios.post(`${API}/join-group`, { code: formData.code.toUpperCase(), mobile: user.mobile });
    setGroup(res.data);
    localStorage.setItem('group', JSON.stringify(res.data));
  };

  const addExpense = async () => {
    if (!formData.item || !formData.price) return alert("Details dalo!");
    setLoading(true);
    await axios.post(`${API}/add-expense`, { groupId: group._id, itemName: formData.item, price: Number(formData.price), boughtBy: user.name });
    fetchExpenses(group._id);
    setFormData({ ...formData, item: '', price: '' });
    setLoading(false);
  };

  const deleteExpense = async (id, boughtBy) => {
    if (boughtBy !== user.name) return alert("Aap sirf apna kharcha delete kar sakte hain!");
    if (!window.confirm("Delete karein?")) return;
    await axios.delete(`${API}/expenses/${id}`, { headers: { user_name: user.name } });
    fetchExpenses(group._id);
  };

  // --- HISAB KITAAB LOGIC ---
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.price, 0);
  const perHead = totalSpent / (group?.members?.length || 1);

  // Sabka alag-alag total nikalna
  const personalTotals = {};
  group?.members?.forEach(m => personalTotals[m.name] = 0);
  expenses.forEach(exp => {
    personalTotals[exp.boughtBy] = (personalTotals[exp.boughtBy] || 0) + exp.price;
  });

  if (!user) return <div style={cardStyle}><h1>🛒 MarketApp</h1><input style={inputStyle} placeholder="Mobile" onChange={e => setFormData({ ...formData, mobile: e.target.value })} /><button style={btnStyle} onClick={handleAuth}>Login/Signup</button></div>;

  if (!group) return <div style={cardStyle}><h2>Hi, {user.name}</h2><input style={inputStyle} placeholder="Group Name" onChange={e => setFormData({ ...formData, gName: e.target.value })} /><button style={btnStyle} onClick={createGroup}>Create</button><p>OR</p><input style={inputStyle} placeholder="Code" onChange={e => setFormData({ ...formData, code: e.target.value })} /><button onClick={joinGroup} style={{ ...btnStyle, background: '#28a745' }}>Join</button></div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}><h2>{group.name}</h2><small>Invite Code: {group.inviteCode}</small></div>

      {/* OVERALL TOTAL CARD */}
      <div style={summaryGrid}>
        <div style={statCard}><span>Total Market</span><h3>₹{totalSpent}</h3></div>
        <div style={{ ...statCard, borderLeft: '1px solid #ddd' }}><span>Per Head</span><h3>₹{perHead.toFixed(2)}</h3></div>
      </div>

      {/* PERSONAL SETTLEMENT CARD */}
      <div style={boxStyle}>
        <h4>Member-wise Hisaab</h4>
        {Object.keys(personalTotals).map(name => {
          const balance = personalTotals[name] - perHead;
          return (
            <div key={name} style={memberRow}>
              <span>{name} {name === user.name && "(Aap)"}</span>
              <div style={{ textAlign: 'right' }}>
                <small>Kharch: ₹{personalTotals[name]}</small><br />
                <b style={{ color: balance >= 0 ? 'green' : 'red' }}>
                  {balance >= 0 ? `Lene hain: ₹${balance.toFixed(2)}` : `Dene hain: ₹${Math.abs(balance).toFixed(2)}`}
                </b>
              </div>
            </div>
          );
        })}
      </div>

      <div style={boxStyle}>
        <input style={inputStyle} value={formData.item} placeholder="Item Name" onChange={e => setFormData({ ...formData, item: e.target.value })} />
        <input style={inputStyle} type="number" value={formData.price} placeholder="Amount" onChange={e => setFormData({ ...formData, price: e.target.value })} />
        <button style={btnStyle} onClick={addExpense} disabled={loading}>Add Bill</button>
      </div>

      <h4>Recent Bills</h4>
      {expenses.map((exp, i) => (
        <div key={i} style={itemStyle}>
          <div><strong>{exp.itemName}</strong><br /><small>{exp.boughtBy} • ₹{exp.price}</small></div>
          {exp.boughtBy === user.name && <button onClick={() => deleteExpense(exp._id, exp.boughtBy)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>}
        </div>
      ))}
      <button style={logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );
}

// STYLES
const containerStyle = { padding: '15px', maxWidth: '450px', margin: 'auto', fontFamily: 'Arial', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const headerStyle = { textAlign: 'center', background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px' };
const boxStyle = { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const summaryGrid = { display: 'flex', background: '#007bff', color: '#fff', borderRadius: '12px', padding: '15px', marginBottom: '15px' };
const statCard = { flex: 1, textAlign: 'center' };
const memberRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' };
const btnStyle = { width: '100%', padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const itemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', marginBottom: '8px', borderRadius: '8px' };
const cardStyle = { textAlign: 'center', padding: '40px 20px', maxWidth: '350px', margin: '100px auto', background: '#fff', borderRadius: '15px' };
const logoutBtn = { marginTop: '20px', width: '100%', padding: '10px', color: 'red', border: '1px solid red', background: 'none', borderRadius: '8px' };

export default App;