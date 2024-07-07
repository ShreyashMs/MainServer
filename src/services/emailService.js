const nodemailer = require('nodemailer');
const { emailConfig } = require('../config/email');

const transporter = nodemailer.createTransport(emailConfig);

exports.sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested a password reset for your account. Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n${resetLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
};
