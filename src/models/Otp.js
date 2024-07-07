const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OtpSchema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '5m' } // OTP expires after 5 minutes
});

module.exports = mongoose.model('Otp', OtpSchema);
