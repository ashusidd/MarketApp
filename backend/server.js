/* eslint-disable */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = process.env.MONGO_URL || "mongodb+srv://ashu:ashubhai@ashraf.yrroemv.mongodb.net/MarketApp?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("Database Connected!"))
    .catch(err => console.log("DB Error Details:", err.message));

// --- SCHEMAS (UPDATED) ---
const userSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    mobile: { type: String, unique: true }
});

const groupSchema = new mongoose.Schema({
    name: String,
    inviteCode: { type: String, unique: true },
    members: [{ name: String, mobile: String }] // Member object save karenge
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

// 1. Auth (Login/Signup) - FIXED PURANA GROUP LOGIC
app.post('/api/auth', async (req, res) => {
    const { name, mobile, isSignup } = req.body;

    try {
        if (isSignup) {
            const existingUser = await User.findOne({ $or: [{ mobile }, { name }] });
            if (existingUser) return res.status(400).send("Naam ya Mobile pehle se hai!");

            const newUser = new User({ name, mobile });
            await newUser.save();
            return res.json({ user: newUser, group: null });
        } else {
            const user = await User.findOne({ mobile });
            if (!user) return res.status(404).send("User nahi mila!");

            // FIX: Array of objects mein mobile dhoondne ka sahi tareeka
            const group = await Group.findOne({ "members.mobile": mobile });
            res.json({ user, group });
        }
    } catch (err) { res.status(500).send("Server Error"); }
});

// 2. Create Group - FIXED
app.post('/api/create-group', async (req, res) => {
    const { name, mobile } = req.body;
    try {
        const user = await User.findOne({ mobile });
        const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();

        // Group mein owner ka naam aur mobile dono jayenge
        const newGroup = new Group({
            name,
            inviteCode,
            members: [{ name: user.name, mobile: user.mobile }]
        });
        await newGroup.save();
        res.json(newGroup);
    } catch (err) { res.status(500).send("Create Group fail!"); }
});

// 3. Join Group - FIXED
app.post('/api/join-group', async (req, res) => {
    const { code, mobile } = req.body;
    try {
        const user = await User.findOne({ mobile });
        const group = await Group.findOne({ inviteCode: code });

        if (group) {
            const isAlreadyMember = group.members.some(m => m.mobile === mobile);
            if (!isAlreadyMember) {
                group.members.push({ name: user.name, mobile: user.mobile });
                await group.save();
            }
            res.json(group);
        } else res.status(404).send("Invalid Code");
    } catch (err) { res.status(500).send("Join fail!"); }
});

// 4. Expenses Routes
app.post('/api/add-expense', async (req, res) => {
    const newExp = new Expense(req.body);
    await newExp.save();
    res.json(newExp);
});

app.get('/api/expenses/:groupId', async (req, res) => {
    const list = await Expense.find({ groupId: req.params.groupId }).sort({ date: -1 });
    res.json(list);
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (req.headers.user_name !== expense.boughtBy) {
            return res.status(403).send("Aap sirf apna kharcha delete kar sakte hain!");
        }
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted!" });
    } catch (err) { res.status(500).send("Error"); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));