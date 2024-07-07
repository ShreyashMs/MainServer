const twilio = require('twilio');
const { smsConfig } = require('../config/sms');

const client = twilio(smsConfig.accountSid, smsConfig.authToken);

exports.sendSms = async (phoneNumber, message) => {
    await client.messages.create({
        body: message,
        from: smsConfig.from,
        to: phoneNumber
    });
};
