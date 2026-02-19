const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MONGODB CONNECTION (Apna URL yahan dalo)
// --- DATABASE CONNECTION ---
// Kisi bhi purani URL string ko hata kar ye likh do
// server.js mein jahan mongoose.connect hai
const mongoURI = process.env.MONGO_URL || "mongodb+srv://ashu:ashubhai@ashraf.yrroemv.mongodb.net/MarketApp?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("Database Connected!"))
    .catch(err => console.log("DB Error Details:", err.message));

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

    try {
        if (isSignup) {
            // Check agar mobile ya name pehle se hai
            const existingUser = await User.findOne({ $or: [{ mobile }, { name }] });
            if (existingUser) {
                return res.status(400).send("Naam ya Mobile pehle se register hai!");
            }
            const newUser = new User({ name, mobile });
            await newUser.save();
            return res.json({ user: newUser, group: null });
        } else {
            // Login Logic
            const user = await User.findOne({ mobile });
            if (!user) return res.status(404).send("Mobile number nahi mila. Signup karein!");

            // Purana group dhundna jo user ne join kiya tha
            const group = await Group.findOne({ members: { $elemMatch: { mobile: user.mobile } } });
            res.json({ user, group });
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
});
// Kisi kharche (expense) ko delete karne ka route
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        // Frontend se hum name bhejenge check karne ke liye
        if (req.headers.user_name !== expense.boughtBy) {
            return res.status(403).send("Aap sirf apna kharcha delete kar sakte hain!");
        }
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted!" });
    } catch (err) { res.status(500).send("Error"); }
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