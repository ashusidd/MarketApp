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
    try {
      const res = await axios.post(`${API}/auth`, { ...formData });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) { alert("Login fail!"); }
  };

  const createGroup = async () => {
    if (!formData.gName) return alert("Group name dalo!");
    try {
      const res = await axios.post(`${API}/create-group`, { name: formData.gName, mobile: user.mobile });
      setGroup(res.data);
      localStorage.setItem('group', JSON.stringify(res.data));
    } catch (err) { alert("Group nahi bana!"); }
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

  // --- NAYA DELETE FEATURE ---
  const deleteExpense = async (id) => {
    if (!window.confirm("Kya aap is bill ko hatana chahte hain?")) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      fetchExpenses(group._id); // List refresh karo
    } catch (err) { alert("Delete nahi ho paya!"); }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.price, 0);
  const perHead = group ? (totalSpent / (group.members.length || 1)).toFixed(2) : 0;

  if (!user) return (
    <div style={cardStyle}>
      <h1 style={{ color: '#007bff' }}>🛒 MarketApp</h1>
      <p>{formData.isSignup ? "Naya account banayein" : "Login karein"}</p>
      {formData.isSignup && <input style={inputStyle} placeholder="Naam" onChange={e => setFormData({ ...formData, name: e.target.value })} />}
      <input style={inputStyle} placeholder="Mobile" onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
      <button style={btnStyle} onClick={handleAuth}>{formData.isSignup ? "Sign Up" : "Login"}</button>
      <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setFormData({ ...formData, isSignup: !formData.isSignup })}>
        {formData.isSignup ? "Login karein" : "Signup karein"}
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
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>{group.name}</h2>
        <small>Invite Code: <b>{group.inviteCode}</b></small>
      </div>

      <div style={summaryGrid}>
        <div style={statCard}><span>Total</span><h3>₹{totalSpent}</h3></div>
        <div style={{ ...statCard, borderLeft: '1px solid #ddd' }}>
          <span>Per Person ({group.members.length})</span><h3 style={{ color: '#28a745' }}>₹{perHead}</h3>
        </div>
      </div>

      <div style={boxStyle}>
        <input style={inputStyle} value={formData.item} placeholder="Kya kharida?" onChange={e => setFormData({ ...formData, item: e.target.value })} />
        <input style={inputStyle} type="number" value={formData.price} placeholder="Price (₹)" onChange={e => setFormData({ ...formData, price: e.target.value })} />
        <button style={btnStyle} onClick={addExpense} disabled={loading}>Add Bill</button>
      </div>

      <h4>Recent Bills</h4>
      <div style={{ background: '#fff', borderRadius: '10px' }}>
        {expenses.map((exp, i) => (
          <div key={i} style={itemStyle}>
            <div>
              <strong>{exp.itemName}</strong><br />
              <small style={{ color: '#666' }}>{exp.boughtBy} • ₹{exp.price}</small>
            </div>
            {/* Delete Icon Button */}
            <button onClick={() => deleteExpense(exp._id)} style={deleteBtnStyle}>🗑️</button>
          </div>
        ))}
      </div>

      <button style={logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );
}

// STYLES
const containerStyle = { padding: '20px', maxWidth: '450px', margin: 'auto', fontFamily: 'Arial', backgroundColor: '#f4f7f6', minHeight: '100vh' };
const headerStyle = { textAlign: 'center', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px' };
const cardStyle = { textAlign: 'center', padding: '40px 20px', maxWidth: '350px', margin: '60px auto', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '15px', backgroundColor: '#fff' };
const boxStyle = { background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' };
const btnStyle = { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const summaryGrid = { display: 'flex', background: '#fff', borderRadius: '12px', marginBottom: '20px', padding: '15px' };
const statCard = { flex: 1, textAlign: 'center' };
const itemStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' };
const deleteBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' };
const logoutBtn = { marginTop: '30px', width: '100%', padding: '10px', color: '#ff4d4d', border: '1px solid #ff4d4d', background: 'none', borderRadius: '8px', cursor: 'pointer' };

export default App;