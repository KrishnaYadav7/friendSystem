const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema with friendRequests and friends fields
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  // List of user IDs who have sent friend requests to this user
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // List of user IDs who are friends with this user
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Pre-save hook to hash password before saving to DB
UserSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare provided password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

module.exports = mongoose.model('User', UserSchema);
