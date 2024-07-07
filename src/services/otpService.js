const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

const OTPService = {
    generateOTP: () => {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        return otp.toString(); 
    },

    saveOTP: async (email, otp) => {
        // Delete any existing OTPs for the same email
        await Otp.deleteMany({ email });

        // Save the new OTP
        const newOtp = new Otp({ email, otp });
        await newOtp.save();
    },

    sendOTP: async (email, otp) => {
        const mailOptions = {
            from: process.env.EMAIL, // Sender address
            to: email, // Recipient address
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`
        };

        await transporter.sendMail(mailOptions);
    },

    verifyOTP: async (email, otp) => {
        const existingOtp = await Otp.findOne({ email, otp });
        if (existingOtp) {
            // If OTP is found, delete it to prevent reuse
            await existingOtp.deleteOne();
            return true;
        }
        return false;
    }
};

module.exports = OTPService;
