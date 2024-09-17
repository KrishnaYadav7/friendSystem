const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const authenticateToken = require('../Middleware/User'); // Adjust path as needed
const router = express.Router();
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Sign Up route
router.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    user = new User({ username, password });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ token });
  } catch (err) {
    console.error('Error during sign up:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Get User by Username
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send Friend Request
router.post('/send-request', authenticateToken, async (req, res) => {
  const { username } = req.body; // Username of the person to send the friend request to
  const requesterId = req.user._id; // Authenticated user's ID

  try {
    const user = await User.findOne({ username }); // Find by username
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    user.friendRequests.push(requesterId);
    await user.save();

    res.status(200).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept Friend Request using username
router.post('/accept-request', authenticateToken, async (req, res) => {
  const { username } = req.body; // The friend's username to accept the request from
  const requesterId = req.user._id; // Authenticated user's ID

  try {
    const user = await User.findById(requesterId); // Find the authenticated user
    const friend = await User.findOne({ username }); // Find the friend by their username

    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.friendRequests.includes(friend._id)) {
      return res.status(400).json({ message: 'No request found' });
    }

    // Add each other to friends list
    user.friends.push(friend._id);
    friend.friends.push(user._id);

    // Remove the friend request from the list
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friend._id.toString());

    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error during accepting friend request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject Friend Request using username
router.post('/reject-request', authenticateToken, async (req, res) => {
  const { username } = req.body; // The friend's username to reject the request from
  const requesterId = req.user._id; // Authenticated user's ID

  try {
    const user = await User.findById(requesterId); // Find the authenticated user
    const friend = await User.findOne({ username }); // Find the friend by their username

    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove the friend request from the list
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friend._id.toString());

    await user.save();

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Error during rejecting friend request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/friends', authenticateToken, async (req, res) => {
  try {
    // Find the authenticated user by their ID and populate friends list with usernames
    const user = await User.findById(req.user._id).populate('friends', 'username');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return the list of friends with their usernames
    res.status(200).json({ friends: user.friends.map(friend => friend.username) });
  } catch (err) {
    console.error('Error fetching friends list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfriend a User using username
router.post('/unfriend', authenticateToken, async (req, res) => {
  const { username } = req.body; // The friend's username to unfriend
  const userId = req.user._id; // The authenticated user's ID

  try {
    const user = await User.findById(userId);
    const friend = await User.findOne({ username }); // Find the friend by their username

    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they are actually friends
    if (!user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'This user is not in your friends list' });
    }

    // Remove the friend from the authenticated user's friends list
    user.friends = user.friends.filter(id => id.toString() !== friend._id.toString());

    // Remove the authenticated user from the friend's friends list
    friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Unfriended successfully' });
  } catch (err) {
    console.error('Error during unfriend:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Total Number of Users
router.get('/total-users', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users); // Send the list of users as a response
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const users = await User.find({}); // Fetch all users
    if (users.length > 0) {
      res.json(users); // Send the list of users
    } else {
      res.status(404).json({ error: 'No users found' });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
