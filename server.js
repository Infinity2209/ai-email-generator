const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Email transporter configuration
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    // For testing without email credentials, use ethereal email account
    const nodemailer = require('nodemailer');
    (async () => {
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
    })();
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Generate email endpoint
app.post('/api/generate-email', async (req, res) => {
    try {
        const { prompt, recipients } = req.body;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert email writer. Generate professional, engaging emails based on the user's prompt. The email should be well-structured with a clear subject line, greeting, body, and closing. Make it personalized and appropriate for the context."
                },
                {
                    role: "user",
                    content: `Write an email based on this prompt: ${prompt}. The email should be sent to ${recipients.length} recipient(s).`
                }
            ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 1000,
        });

        const generatedEmail = completion.choices[0]?.message?.content || "Unable to generate email";

        // Parse subject and body
        const lines = generatedEmail.split('\n');
        let subject = "Generated Email";
        let body = generatedEmail;

        // Extract subject if it starts with "Subject:"
        if (lines[0].toLowerCase().startsWith('subject:')) {
            subject = lines[0].replace(/^subject:\s*/i, '');
            body = lines.slice(1).join('\n').trim();
        }

        res.json({
            success: true,
            email: {
                subject,
                body,
                fullText: generatedEmail
            }
        });
    } catch (error) {
        console.error('Error generating email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate email'
        });
    }
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { recipients, subject, body } = req.body;

        if (!recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No recipients provided'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipients.join(', '),
            subject: subject,
            text: body,
        };

        const info = await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId,
            recipients: recipients.length
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
