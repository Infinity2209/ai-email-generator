// Dynamic API base URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '/api' 
    : '/.netlify/functions';

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const sendBtn = document.getElementById('sendBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loading = document.getElementById('loading');
const emailSection = document.getElementById('emailSection');
const result = document.getElementById('result');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Form Elements
const recipientsInput = document.getElementById('recipients');
const promptTextarea = document.getElementById('prompt');
const subjectInput = document.getElementById('subject');
const emailBodyTextarea = document.getElementById('emailBody');

// Event Listeners
generateBtn.addEventListener('click', generateEmail);
sendBtn.addEventListener('click', sendEmail);
regenerateBtn.addEventListener('click', regenerateEmail);

async function generateEmail() {
    const recipients = recipientsInput.value.trim();
    const prompt = promptTextarea.value.trim();

    if (!recipients || !prompt) {
        showError('Please fill in all required fields');
        return;
    }

    // Show loading
    loading.style.display = 'block';
    emailSection.style.display = 'none';
    result.style.display = 'none';
    clearMessages();

    try {
        const response = await fetch(`${API_BASE_URL}/generate-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                recipients: recipients.split(',').map(email => email.trim())
            })
        });

        const data = await response.json();

        if (data.success) {
            subjectInput.value = data.email.subject;
            emailBodyTextarea.value = data.email.body;
            emailSection.style.display = 'block';
            showSuccess('Email generated successfully!');
        } else {
            showError(data.error || 'Failed to generate email');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate email. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
}

async function sendEmail() {
    const recipients = recipientsInput.value.trim();
    const subject = subjectInput.value.trim();
    const body = emailBodyTextarea.value.trim();

    if (!recipients || !subject || !body) {
        showError('Please fill in all required fields');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    clearMessages();

    try {
        const response = await fetch(`${API_BASE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients: recipients.split(',').map(email => email.trim()),
                subject,
                body
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Email sent successfully to ${data.recipients} recipient(s)!`);
            emailSection.style.display = 'none';
            // Clear form
            promptTextarea.value = '';
            subjectInput.value = '';
            emailBodyTextarea.value = '';
        } else {
            showError(data.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to send email. Please try again.');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Email';
    }
}

function regenerateEmail() {
    emailSection.style.display = 'none';
    clearMessages();
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    result.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    result.style.display = 'block';
}

function clearMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    result.style.display = 'none';
}

// Health check on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            console.warn('API health check failed');
        }
    } catch (error) {
        console.warn('Could not connect to API:', error);
    }
});
