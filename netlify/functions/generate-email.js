const { Groq } = require('groq-sdk');

// Initialize Groq client
let groq;
try {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is missing');
    }
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
} catch (error) {
    console.error('Failed to initialize Groq client:', error.message);
}

exports.handler = async (event, context) => {
    // Set function timeout to 10 seconds (Netlify limit)
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

    // Start timer for timeout handling
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 9000; // 9 seconds to leave buffer

    try {
        const { prompt, recipients } = JSON.parse(event.body);

        if (!prompt || !recipients || recipients.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing required fields: prompt and recipients' 
                }),
            };
        }

        // Check execution time
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
            throw new Error('Function execution time limit exceeded');
        }

        console.log('Starting email generation with prompt:', prompt.substring(0, 100) + '...');
        console.log('Recipients count:', recipients.length);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert email writer. Generate professional, engaging emails based on the user's prompt. Return ONLY the email content without any email headers like 'Subject:', 'To:', 'From:', etc. The response should start with the subject line on the first line, followed by a blank line, then the email body content. Make it personalized and appropriate for the context."
                },
                {
                    role: "user",
                    content: `Write an email based on this prompt: ${prompt}. The email should be sent to ${recipients.length} recipient(s). Return only the email content starting with the subject on the first line, then a blank line, then the email body.`
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 800, // Reduced from 1000 to prevent timeout
        });

        const generatedEmail = completion.choices[0]?.message?.content || "Unable to generate email";
        
        console.log('Email generated successfully, length:', generatedEmail.length);

        // Parse subject and body
        let subject = "Generated Email";
        let body = generatedEmail;

        const lines = generatedEmail.split('\n');
        
        // Extract subject from first line
        if (lines[0] && lines[0].trim()) {
            subject = lines[0].trim();
            // Remove "Subject:" prefix if present
            subject = subject.replace(/^subject:\s*/i, '');
        }

        // Find body content (skip empty lines and headers)
        let bodyStartIndex = 1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                bodyStartIndex = i;
                break;
            }
        }

        body = lines.slice(bodyStartIndex).join('\n').trim();
        
        // Clean up body formatting
        body = body
            .replace(/^\s*\n+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        console.log('Email parsed successfully, subject:', subject);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                email: {
                    subject,
                    body,
                    fullText: generatedEmail
                }
            }),
        };

    } catch (error) {
        console.error('Error in generate-email function:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Handle specific error types
        let errorMessage = 'Failed to generate email';
        let statusCode = 500;
        
        if (error.message.includes('API key')) {
            errorMessage = 'Invalid or missing GROQ API key';
            statusCode = 401;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout - please try again';
            statusCode = 504;
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded - please try again later';
            statusCode = 429;
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
