// DOM elements
const recipientsInput = document.getElementById('recipients');
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const loadingDiv = document.getElementById('loading');
const emailSection = document.getElementById('emailSection');
const subjectInput = document.getElementById('subject');
const emailBodyInput = document.getElementById('emailBody');
const sendBtn = document.getElementById('sendBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const resultDiv = document.getElementById('result');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Event listeners
generateBtn.addEventListener('click', generateEmail);
sendBtn.addEventListener('click', sendEmail);
regenerateBtn.addEventListener('click', generateEmail);

// Generate email function
async function generateEmail() {
    const recipients = recipientsInput.value.trim();
    const prompt = promptInput.value.trim();

    if (!recipients || !prompt) {
        showError('Please fill in all fields');
        return;
    }

    // Validate email format
    const emailList = recipients.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of emailList) {
        if (!emailRegex.test(email)) {
            showError(`Invalid email format: ${email}`);
            return;
        }
    }

    // Show loading
    loadingDiv.style.display = 'block';
    emailSection.style.display = 'none';
    resultDiv.style.display = 'none';

    try {
        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                recipients: emailList
            })
        });

        const data = await response.json();

        if (data.success) {
            subjectInput.value = data.email.subject;
            emailBodyInput.value = data.email.body;
            emailSection.style.display = 'block';
        } else {
            showError(data.error || 'Failed to generate email');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate email. Please try again.');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Send email function
async function sendEmail() {
    const recipients = recipientsInput.value.trim().split(',').map(email => email.trim());
    const subject = subjectInput.value.trim();
    const body = emailBodyInput.value.trim();

    if (!subject || !body) {
        showError('Please fill in subject and body');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Email sent successfully to ${data.recipients} recipient(s)!`);
            // Reset form
            recipientsInput.value = '';
            promptInput.value = '';
            subjectInput.value = '';
            emailBodyInput.value = '';
            emailSection.style.display = 'none';
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

// Utility functions
function showSuccess(message) {
    successMessage.textContent = message;
    errorMessage.textContent = '';
    resultDiv.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    successMessage.textContent = '';
    resultDiv.style.display = 'block';
}

// Clear messages when user starts typing
recipientsInput.addEventListener('input', () => {
    resultDiv.style.display = 'none';
});

promptInput.addEventListener('input', () => {
    resultDiv.style.display = 'none';
});

subjectInput.addEventListener('input', () => {
    resultDiv.style.display = 'none';
});

emailBodyInput.addEventListener('input', () => {
    resultDiv.style.display = 'none';
});
