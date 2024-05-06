// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Create an Express application
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

// MongoDB connection
mongoose.connect('mongodb+srv://Prateek:QQpFHHYa03KOq8sJ@ems.seoc5u5.mongodb.net/?retryWrites=true&w=majority&appName=EMS/Employees', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose schema and model for User
const User = mongoose.model('User', {
  firstname: String,
  lastname: String,
  email: String,
  passwordHash: String,
  phonenumber: String
});

// Generate JWT access token
function generateAccessToken(user) {
  return jwt.sign(user, 'secret');
}

// Hashing function using Node.js crypto module
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// CORS handling middleware
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

// Register endpoint
app.post('/register', allowCors(async (req, res) => {
  try {
    const { firstname, lastname, email, password, phonenumber } = req.body;
    const passwordHash = hashPassword(password);
    const user = new User({ firstname, lastname, email, passwordHash, phonenumber });
    await user.save();
    const token = generateAccessToken({ firstname, email });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering new user.');
  }
}));

// Login endpoint
app.post('/login', allowCors(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found.');
    }
    // Compare hashed password
    if (user.passwordHash !== hashPassword(password)) {
      return res.status(401).send('Invalid password.');
    }
    const token = generateAccessToken({ firstname: user.firstname, email });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in.');
  }
}));

// Define Mongoose schema and model for Feedback
const Feedback = mongoose.model('Feedback', {
  fullname: String,
  email: String,
  message: String
});

// Feedback endpoint
app.post('/feedback', allowCors(async (req, res) => {
  try {
    const { fullname, email, message } = req.body;
    const feedback = new Feedback({ fullname, email, message });
    await feedback.save();
    res.status(201).send('Feedback submitted successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting feedback.');
  }
}));

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
