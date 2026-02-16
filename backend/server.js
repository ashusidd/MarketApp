const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MONGODB CONNECTION (Apna URL yahan dalo)
// --- DATABASE CONNECTION ---
// Kisi bhi purani URL string ko hata kar ye likh do
const mongoURI = process.env.MONGO_URL;

mongoose.connect(mongoURI)
    .then(() => console.log("Database Connected!"))
    .catch(err => {
        console.log("DB Error Details:", err.message); // Isse detail mein galti pata chalegi
    });

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({ name: String, mobile: { type: String, unique: true } });
const groupSchema = new mongoose.Schema({
    name: String,
    inviteCode: { type: String, unique: true },
    members: [String]
});
const expenseSchema = new mongoose.Schema({
    groupId: String,
    itemName: String,
    price: Number,
    boughtBy: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// --- ROUTES ---

// 1. Auth (Login/Signup)
app.post('/api/auth', async (req, res) => {
    const { name, mobile, isSignup } = req.body;
    if (isSignup) {
        const newUser = new User({ name, mobile });
        await newUser.save();
        return res.json(newUser);
    }
    const user = await User.findOne({ mobile });
    user ? res.json(user) : res.status(404).send("User not found");
});

// 2. Create Group
app.post('/api/create-group', async (req, res) => {
    const { name, mobile } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newGroup = new Group({ name, inviteCode, members: [mobile] });
    await newGroup.save();
    res.json(newGroup);
});

// 3. Join Group
app.post('/api/join-group', async (req, res) => {
    const { code, mobile } = req.body;
    const group = await Group.findOne({ inviteCode: code });
    if (group) {
        if (!group.members.includes(mobile)) {
            group.members.push(mobile);
            await group.save();
        }
        res.json(group);
    } else res.status(404).send("Invalid Code");
});

// 4. Expenses
app.post('/api/add-expense', async (req, res) => {
    const newExp = new Expense(req.body);
    await newExp.save();
    res.json(newExp);
});

app.get('/api/expenses/:groupId', async (req, res) => {
    const list = await Expense.find({ groupId: req.params.groupId }).sort({ date: -1 });
    res.json(list);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));