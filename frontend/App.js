import React, { useState, useEffect } from 'react';
import axios from 'axios';

// YAHAN APNA RENDER URL DALO
const API = "https://marketapp-y0cq.onrender.com";

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
        const res = await axios.post(`${API}/login`, { mobile, name });
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
    };

    // 2. Join Group Logic
    const joinGroup = async () => {
        const res = await axios.post(`${API}/join-group`, { code: inviteCode, mobile: user.mobile });
        setGroup(res.data);
        fetchSummary(res.data._id);
    };

    // 3. Add Expense Logic
    const addExpense = async () => {
        await axios.post(`${API}/add-expense`, { groupId: group._id, itemName, price, boughtBy: user.name });
        fetchSummary(group._id);
        setItemName(''); setPrice('');
    };

    const fetchSummary = async (gid) => {
        const res = await axios.get(`${API}/summary/${gid}`);
        setExpenses(res.data.expenses);
    };

    if (!user) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Market Tracker Login</h2>
                <input placeholder="Mobile" onChange={e => setMobile(e.target.value)} /><br />
                <input placeholder="Name" onChange={e => setName(e.target.value)} /><br />
                <button onClick={handleLogin}>Enter</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Hi, {user.name}!</h1>
            {!group ? (
                <div>
                    <input placeholder="Invite Code" onChange={e => setInviteCode(e.target.value)} />
                    <button onClick={joinGroup}>Join Group</button>
                </div>
            ) : (
                <div>
                    <h3>Group: {group.name} (Code: {group.inviteCode})</h3>
                    <input placeholder="Item Name" value={itemName} onChange={e => setItemName(e.target.value)} />
                    <input placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
                    <button onClick={addExpense}>Add Bill</button>

                    <h4>Recent Expenses:</h4>
                    {expenses.map((exp, i) => (
                        <p key={i}>{exp.itemName} - ₹{exp.price} (by {exp.boughtBy})</p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;