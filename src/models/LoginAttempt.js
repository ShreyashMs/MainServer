const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attempt_count: { type: Number, default: 0 },
    lock_until: { type: Date }
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
