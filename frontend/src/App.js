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

  // UPDATE: Login/Signup with Group Recovery
  const handleAuth = async () => {
    if (!formData.mobile) return alert("Mobile number dalo!");
    if (formData.isSignup && !formData.name) return alert("Signup ke liye naam zaroori hai!");

    try {
      const res = await axios.post(`${API}/auth`, { ...formData });

      // 1. User save karo
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // 2. Agar purana group mila hai, toh usey bhi save aur set karo
      if (res.data.group) {
        setGroup(res.data.group);
        localStorage.setItem('group', JSON.stringify(res.data.group));
        alert("Wapas swagat hai! Aapka purana group mil gaya.");
      } else {
        setGroup(null);
        localStorage.removeItem('group');
        alert(formData.isSignup ? "Signup Successful!" : "Login Successful! Ab group join karein.");
      }
    } catch (err) {
      alert(err.response?.data || "Login fail ho gaya!");
    }
  };
  // Create/Join/Add Expense functions wahi rahenge jo pehle the...
  const createGroup = async () => {
    if (!formData.gName) return alert("Group name dalo!");
    try {
      const res = await axios.post(`${API}/create-group`, { name: formData.gName, mobile: user.mobile });
      setGroup(res.data);
      localStorage.setItem('group', JSON.stringify(res.data));
    } catch (err) { alert("Group create nahi hua!"); }
  };

  const joinGroup = async () => {
    if (!formData.code) return alert("Invite Code dalo!");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/join-group`, {
        code: formData.code.toUpperCase().trim(),
        mobile: user.mobile
      });
      setGroup(res.data);
      localStorage.setItem('group', JSON.stringify(res.data));
    } catch (err) { alert("Code galat hai!"); }
    setLoading(false);
  };

  const addExpense = async () => {
    if (!formData.item || !formData.price) return alert("Sab details dalo!");
    setLoading(true);
    try {
      await axios.post(`${API}/add-expense`, {
        groupId: group._id, itemName: formData.item, price: Number(formData.price), boughtBy: user.name
      });
      fetchExpenses(group._id);
      setFormData({ ...formData, item: '', price: '' });
    } catch (err) { alert("Add fail!"); }
    setLoading(false);
  };

  const deleteExpense = async (id, boughtBy) => {
    if (boughtBy !== user.name) return alert("Aap sirf apna kharcha delete kar sakte hain!");
    if (!window.confirm("Kya aap is bill ko hatana chahte hain?")) return;
    try {
      await axios.delete(`${API}/expenses/${id}`, { headers: { user_name: user.name } });
      fetchExpenses(group._id);
    } catch (err) { alert("Delete fail!"); }
  };

  // HISAB-KITAAB LOGIC
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.price, 0);
  const perHead = totalSpent / (group?.members?.length || 1);
  const personalTotals = {};
  group?.members?.forEach(m => personalTotals[m.name] = 0);
  expenses.forEach(exp => {
    personalTotals[exp.boughtBy] = (personalTotals[exp.boughtBy] || 0) + exp.price;
  });

  // UI (Login, Dashboard, Tracker)
  if (!user) return (
    <div style={cardStyle}>
      <h1 style={{ color: '#007bff' }}>🛒 MarketApp</h1>
      <p>{formData.isSignup ? "Naya account banayein" : "Login karein"}</p>
      {formData.isSignup && <input style={inputStyle} placeholder="Unique Naam" onChange={e => setFormData({ ...formData, name: e.target.value })} />}
      <input style={inputStyle} placeholder="Mobile Number" onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
      <button style={btnStyle} onClick={handleAuth}>{formData.isSignup ? "Sign Up" : "Login"}</button>
      <p style={{ cursor: 'pointer', color: 'blue', marginTop: '15px' }} onClick={() => setFormData({ ...formData, isSignup: !formData.isSignup })}>
        {formData.isSignup ? "Pehle se account hai? Login" : "Naya account? Signup"}
      </p>
    </div>
  );

  if (!group) return (
    <div style={cardStyle}>
      <h2>Namaste, {user.name} 👋</h2>
      <div style={boxStyle}>
        <input style={inputStyle} placeholder="Naya Group Name" onChange={e => setFormData({ ...formData, gName: e.target.value })} />
        <button style={btnStyle} onClick={createGroup}>Create Group</button>
      </div>
      <p>OR</p>
      <div style={boxStyle}>
        <input style={inputStyle} placeholder="Invite Code" onChange={e => setFormData({ ...formData, code: e.target.value })} />
        <button style={{ ...btnStyle, background: '#28a745' }} onClick={joinGroup}>Join Group</button>
      </div>
      <button style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>{group.name}</h2>
        <small>Invite Code: <b>{group.inviteCode}</b></small>
      </div>

      <div style={summaryGrid}>
        <div style={statCard}><span>Total Market</span><h3>₹{totalSpent}</h3></div>
        <div style={{ ...statCard, borderLeft: '1px solid #ddd' }}><span>Per Head</span><h3>₹{perHead.toFixed(2)}</h3></div>
      </div>

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
                  {balance >= 0 ? `Lene: ₹${balance.toFixed(2)}` : `Dene: ₹${Math.abs(balance).toFixed(2)}`}
                </b>
              </div>
            </div>
          );
        })}
      </div>

      <div style={boxStyle}>
        <input style={inputStyle} value={formData.item} placeholder="Kya kharida?" onChange={e => setFormData({ ...formData, item: e.target.value })} />
        <input style={inputStyle} type="number" value={formData.price} placeholder="Price (₹)" onChange={e => setFormData({ ...formData, price: e.target.value })} />
        <button style={btnStyle} onClick={addExpense} disabled={loading}>Add Bill</button>
      </div>

      <h4>Recent Bills</h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {expenses.map((exp, i) => (
          <div key={i} style={itemStyle}>
            <div>
              <strong>{exp.itemName}</strong><br />
              <small style={{ color: '#666' }}>{exp.boughtBy} • ₹{exp.price}</small>
            </div>
            {exp.boughtBy === user.name && <button onClick={() => deleteExpense(exp._id, exp.boughtBy)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>}
          </div>
        ))}
      </div>

      <button style={logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );
}

// STYLES (Wahi hain jo pehle the...)
const containerStyle = { padding: '15px', maxWidth: '450px', margin: 'auto', fontFamily: 'Arial', backgroundColor: '#f0f2f5', minHeight: '100vh' };
const headerStyle = { textAlign: 'center', background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px' };
const boxStyle = { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const summaryGrid = { display: 'flex', background: '#007bff', color: '#fff', borderRadius: '12px', padding: '15px', marginBottom: '15px' };
const statCard = { flex: 1, textAlign: 'center' };
const memberRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' };
const btnStyle = { width: '100%', padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const itemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', marginBottom: '8px', borderRadius: '8px' };
const cardStyle = { textAlign: 'center', padding: '40px 20px', maxWidth: '350px', margin: '60px auto', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' };
const logoutBtn = { marginTop: '20px', width: '100%', padding: '10px', color: 'red', border: '1px solid red', background: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default App;