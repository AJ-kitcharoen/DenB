const nodeMailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    // 2. Define the email options
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 3. Actually send the email
    await transporter.sendMail(message);
};

module.exports = sendEmail;