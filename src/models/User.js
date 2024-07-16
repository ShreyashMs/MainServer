const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  username: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isParent: { type: Boolean, default: false },
  responses: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      answer: { type: String, required: true },
    },
  ],
  role: { type: String, enum: ["user", "superuser", "admin"], default: "user" },
});

module.exports = mongoose.model("User", userSchema);
