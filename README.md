# 🤖 AI Email Generator

A full-stack AI-powered email generator and sender application built in under one hour.

## Features

- ✨ **AI Email Generation**: Generate professional emails using Groq AI
- 📧 **Email Sending**: Send emails directly to multiple recipients
- ✏️ **Editable Content**: Modify generated emails before sending
- 🎯 **Multiple Recipients**: Support for sending to multiple email addresses
- 🎨 **Clean UI**: Modern, responsive interface

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Groq API (Mixtral-8x7b model)
- **Email**: Nodemailer

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Get API Keys

#### Groq API Key
1. Go to [Groq Console](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys
4. Create a new API key

#### Email Configuration (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this password in EMAIL_PASS

### 4. Run the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Enter Recipients**: Add email addresses separated by commas
2. **Write Prompt**: Describe what you want the email to be about
3. **Generate**: Click "Generate Email" to create the email with AI
4. **Edit**: Modify the subject and body as needed
5. **Send**: Click "Send Email" to deliver to all recipients

## Example Prompts

- "Write a professional follow-up email after a job interview"
- "Create a meeting invitation for next Monday at 2 PM"
- "Write a thank you email to a client for their business"
- "Draft a project update email to stakeholders"

## Development

### Run in Development Mode
```bash
npm run dev
```

### Project Structure
```
ai-email-generator/
├── server.js          # Express server
├── public/            # Frontend files
│   ├── index.html     # Main HTML
│   ├── styles.css     # CSS styles
│   └── script.js      # JavaScript functionality
├── .env               # Environment variables
├── package.json       # Dependencies
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **Email not sending**: Check your email credentials in .env file
2. **AI not working**: Verify your Groq API key is correct
3. **Port already in use**: Change the port in server.js or .env

### Environment Variables Not Loading
Make sure you have:
- Created a `.env` file
- Restarted the server after adding variables
- Installed dotenv package

## API Endpoints

- `POST /api/generate-email` - Generate email with AI
- `POST /api/send-email` - Send email to recipients
- `GET /api/health` - Health check

## License

This project is open source and available under the MIT License.
