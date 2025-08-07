const nodemailer = require('nodemailer');

// Email transporter configuration
let transporter;
const initializeTransporter = async () => {
    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log('Using custom email configuration');
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT, 10),
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        } else {
            // For testing without email credentials, use ethereal email account
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Ethereal test account created. User:', testAccount.user);
        }
    } catch (error) {
        console.error('Error initializing transporter:', error);
        throw error;
    }
};

let transporterReady = false;

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        if (!transporterReady) {
            await initializeTransporter();
            transporterReady = true;
        }

        const { recipients, subject, body } = JSON.parse(event.body);

        if (!recipients || recipients.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'No recipients provided'
                }),
            };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@example.com',
            to: recipients.join(', '),
            subject: subject,
            text: body,
        };

        console.log('Sending email to:', recipients.join(', '));
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent, messageId:', info.messageId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Email sent successfully',
                messageId: info.messageId,
                recipients: recipients.length
            }),
        };

    } catch (error) {
        console.error('Error sending email:', error);
        let errorMessage = 'Failed to send email';
        let statusCode = 500;

        if (error.message.includes('Invalid login')) {
            errorMessage = 'Invalid email credentials';
            statusCode = 401;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Email sending timeout - please try again';
            statusCode = 504;
        }

        return {
            statusCode,
            headers,
            body: JSON.stringify({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }),
        };
    }
};
