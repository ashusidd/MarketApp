require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🚀 Database Connected!"))
    .catch(err => console.error("❌ MongoDB Error:", err));

app.get('/', (req, res) => res.send("Backend is Live!"));

// Login Route
const User = mongoose.model('User', new mongoose.Schema({ mobile: String, name: String }));
app.post('/api/login', async (req, res) => {
    const { mobile, name } = req.body;
    let user = await User.findOneAndUpdate({ mobile }, { name }, { upsert: true, new: true });
    res.json(user);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));