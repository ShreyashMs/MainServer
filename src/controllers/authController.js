const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const LoginAttempt = require("../models/LoginAttempt");
const Session = require("../models/Session");
const emailService = require("../services/emailService");
const { errorHandler } = require("../utils/errorHandler");
const { validateEmail, validatePassword } = require("../utils/validators");
const PersonalizationSetting = require("../models/PersonalizationSetting");
const OTPService = require("../services/otpService");
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;
const OTP_EXPIRY = 5 * 60 * 1000;
exports.register = async (req, res) => {
  const { username, email, phoneNumber, password, isParent } = req.body;

  try {
    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Email or Phone Number is required." });
    }

    let existingUser;
    if (email) {
      existingUser = await User.findOne({ email });
    } else if (phoneNumber) {
      existingUser = await User.findOne({ phoneNumber });
    }

    if (existingUser) {
      if (!existingUser.isVerified) {
        const otp = OTPService.generateOTP();
        await OTPService.saveOTP(email || phoneNumber, otp);
        await OTPService.sendOTP(email || phoneNumber, otp);
        return res
          .status(200)
          .json({ message: "OTP sent again. Please verify your account." });
      } else {
        return res
          .status(400)
          .json({ message: "User already exists and is verified." });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const otp = OTPService.generateOTP();
    await OTPService.saveOTP(email || phoneNumber, otp);
    await OTPService.sendOTP(email || phoneNumber, otp);

    const newUser = new User({
      username,
      email,
      phoneNumber,
      password_hash,
      isVerified: false,
      isParent,
      currentOTP: otp,
    });

    await newUser.save();

    res.status(200).json({ message: "OTP sent. Please verify your account." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Find the user by email or phone number
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email/phone or password." });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first." });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      let loginAttempt = await LoginAttempt.findOne({ user_id: user._id });
      if (!loginAttempt) {
        loginAttempt = new LoginAttempt({
          user_id: user._id,
          attempt_count: 1,
        });
      } else {
        loginAttempt.attempt_count += 1;
        if (loginAttempt.attempt_count >= MAX_ATTEMPTS) {
          loginAttempt.lock_until = Date.now() + LOCK_TIME;
        }
      }
      await loginAttempt.save();
      return res.status(400).json({ message: "Invalid email/phone or password." });
    }

    // Generate and save OTP
    const otp = OTPService.generateOTP();
    await PasswordResetToken.deleteOne({ user_id: user._id }); // Ensure no old OTP is there
    const newResetToken = new PasswordResetToken({
      user_id: user._id,
      token: otp,
      expires_at: new Date(Date.now() + OTP_EXPIRY),
    });
    await newResetToken.save();

    // Send OTP
    await OTPService.sendOTP(user.email || user.phoneNumber, otp);

    res.status(200).json({ message: "OTP sent. Please verify the OTP to complete login." });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found with this email." });
    }
    const token = crypto.randomBytes(20).toString("hex");
    const resetToken = new PasswordResetToken({
      user_id: user._id,
      token,
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
    await resetToken.save();
    await emailService.sendPasswordResetEmail(user.email, token);
    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    errorHandler(res, error);
  }
};
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Find the password reset token
    const resetToken = await PasswordResetToken.findOne({
      user_id: user._id,
      token,
    });
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Check if the token has expired
    if (resetToken.expires_at < Date.now()) {
      return res.status(400).json({ message: "Token has expired." });
    }

    // Hash the new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    user.password_hash = password_hash;
    await user.save();

    // Remove the used token
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user_id: req.user.id });
    res.status(200).json(sessions);
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.getUserSettings = async (req, res) => {
  try {
    const settings = await PersonalizationSetting.findOne({
      user_id: req.user.id,
    });
    res.status(200).json(settings);
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.updateUserSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const personalizationSetting =
      await PersonalizationSetting.findOneAndUpdate(
        { user_id: req.user.id },
        { settings },
        { new: true, upsert: true }
      );

    res.status(200).json(personalizationSetting);
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Find the latest OTP for the user
    const resetToken = await PasswordResetToken.findOne({
      user_id: user._id,
      token: otp,
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Check if the OTP has expired
    if (resetToken.expires_at < Date.now()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    // Remove the used OTP
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    res.status(200).json({ message: "OTP verified successfully. User is now verified." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Invalidate the previous OTP
    await PasswordResetToken.deleteOne({ user_id: user._id });

    // Generate a new OTP
    const otp = OTPService.generateOTP();

    // Save the new OTP and its expiry
    const newResetToken = new PasswordResetToken({
      user_id: user._id,
      token: otp,
      expires_at: new Date(Date.now() + OTP_EXPIRY),
    });
    await newResetToken.save();

    // Send the new OTP
    await OTPService.sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent again. Please check your email or phone." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


