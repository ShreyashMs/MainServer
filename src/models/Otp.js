const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, default: Date.now, index: { expires: '5m' } } // expires after 5 minutes
  });
  

module.exports = mongoose.model('Otp', OtpSchema);
