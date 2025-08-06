const fs = require('fs');
const path = require('path');

// console.log('🤖 AI Email Generator - Quick Setup');
// console.log('====================================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('Creating .env file...');
    const envContent = `GROQ_API_KEY=your_groq_api_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully!');
} else {
    console.log('✅ .env file already exists');
}

// console.log('\n📋 Next Steps:');
// console.log('1. Get your Groq API key from https://console.groq.com');
// console.log('2. Set up email credentials (Gmail recommended)');
// console.log('3. Update the .env file with your credentials');
// console.log('4. Run: npm install');
// console.log('5. Run: npm start');
// console.log('\n🚀 Your AI Email Generator will be ready!');
