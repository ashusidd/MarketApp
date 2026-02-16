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

  const addExpense = async () => {
    if (!formData.item || !formData.price) return alert("Item aur Price dono dalo!");
    setLoading(true);
    await axios.post(`${API}/add-expense`, { groupId: group._id, itemName: formData.item, price: Number(formData.price), boughtBy: user.name });
    fetchExpenses(group._id);
    setFormData({ ...formData, item: '', price: '' });
    setLoading(false);
  };

  // HISAB-KITAAB LOGIC
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.price, 0);
  const perHead = group ? (totalSpent / (group.members.length || 1)).toFixed(2) : 0;

  if (!user) return (
    <div style={cardStyle}>
      <h1 style={{ color: '#007bff' }}>🛒 MarketApp</h1>
      <p>{formData.isSignup ? "Naya account banayein" : "Wapas swagat hai!"}</p>
      {formData.isSignup && <input style={inputStyle} placeholder="Apna Naam" onChange={e => setFormData({ ...formData, name: e.target.value })} />}
      <input style={inputStyle} placeholder="Mobile Number" onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
      <button style={btnStyle} onClick={handleAuth}>{formData.isSignup ? "Sign Up" : "Login"}</button>
      <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setFormData({ ...formData, isSignup: !formData.isSignup })}>
        {formData.isSignup ? "Pehle se account hai? Login" : "Naya account? Signup"}
      </p>
    </div>
  );

  if (!group) return (
    <div style={cardStyle}>
      <h2>Hello, {user.name} 👋</h2>
      <div style={boxStyle}>
        <h4>Naya Group Banayein</h4>
        <input style={inputStyle} placeholder="Group ka naam (e.g. Room 302)" onChange={e => setFormData({ ...formData, gName: e.target.value })} />
        <button style={btnStyle} onClick={createGroup}>Create Group</button>
      </div>
      <p>--- YA ---</p>
      <div style={boxStyle}>
        <h4>Purane Group mein Judein</h4>
        <input style={inputStyle} placeholder="Invite Code (e.g. AB123)" onChange={e => setFormData({ ...formData, code: e.target.value })} />
        <button style={{ ...btnStyle, background: '#28a745' }} onClick={() => { /* join logic */ }}>Join Group</button>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>{group.name}</h2>
        <small>Code: <b>{group.inviteCode}</b></small>
      </div>

      {/* Summary Card */}
      <div style={summaryGrid}>
        <div style={statCard}>
          <span>Total Kharcha</span>
          <h3>₹{totalSpent}</h3>
        </div>
        <div style={{ ...statCard, borderLeft: '1px solid #ddd' }}>
          <span>Per Person</span>
          <h3 style={{ color: '#28a745' }}>₹{perHead}</h3>
        </div>
      </div>

      {/* Add Expense Section */}
      <div style={boxStyle}>
        <input style={inputStyle} value={formData.item} placeholder="Kya kharida?" onChange={e => setFormData({ ...formData, item: e.target.value })} />
        <input style={inputStyle} type="number" value={formData.price} placeholder="Price (₹)" onChange={e => setFormData({ ...formData, price: e.target.value })} />
        <button style={btnStyle} onClick={addExpense} disabled={loading}>{loading ? "Adding..." : "Add Bill"}</button>
      </div>

      <h4>Recent Bills</h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {expenses.map((exp, i) => (
          <div key={i} style={itemStyle}>
            <div>
              <strong>{exp.itemName}</strong><br />
              <small style={{ color: '#666' }}>{exp.boughtBy} • {new Date(exp.date).toLocaleDateString()}</small>
            </div>
            <div style={{ fontWeight: 'bold' }}>₹{exp.price}</div>
          </div>
        ))}
      </div>

      <button style={logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
    </div>
  );
}

// STYLES
const containerStyle = { padding: '20px', maxWidth: '450px', margin: 'auto', fontFamily: 'Arial' };
const headerStyle = { textAlign: 'center', marginBottom: '20px', background: '#f8f9fa', padding: '10px', borderRadius: '10px' };
const cardStyle = { textAlign: 'center', padding: '40px 20px', maxWidth: '350px', margin: '100px auto', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '15px' };
const boxStyle = { background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '8px' };
const btnStyle = { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const summaryGrid = { display: 'flex', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px', padding: '15px' };
const statCard = { flex: 1, textAlign: 'center' };
const itemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee', alignItems: 'center' };
const logoutBtn = { marginTop: '30px', width: '100%', padding: '10px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '8px', cursor: 'pointer' };

export default App;