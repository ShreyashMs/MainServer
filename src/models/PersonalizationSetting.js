const mongoose = require('mongoose');

const personalizationSettingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    settings: { type: Map, of: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PersonalizationSetting', personalizationSettingSchema);
