const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.handler = async (event, context) => {
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
        const { prompt, recipients } = JSON.parse(event.body);

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
            max_tokens: 1000,
        });

        const generatedEmail = completion.choices[0]?.message?.content || "Unable to generate email";

        // Parse subject and body (same logic as server.js)
        let subject = "Generated Email";
        let body = generatedEmail;

        const lines = generatedEmail.split('\n');
        
        const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
        if (subjectLine) {
            subject = subjectLine.replace(/^subject:\s*/i, '').trim();
        } else {
            const firstContentLine = lines.find(line => line.trim() && !line.match(/^(To|From|CC|BCC|Date):\s*/i));
            if (firstContentLine) {
                subject = firstContentLine.trim();
            }
        }

        let contentStartIndex = 0;
        let foundContent = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' || line.match(/^(Subject|To|From|CC|BCC|Date):\s*/i)) {
                continue;
            }
            if (line.match(/^#{1,6}\s/) || line.match(/^\*\*.*\*\*$/)) {
                continue;
            }
            contentStartIndex = i;
            foundContent = true;
            break;
        }

        if (foundContent) {
            body = lines.slice(contentStartIndex).join('\n').trim();
        } else {
            body = lines.filter(line => {
                const trimmed = line.trim();
                return trimmed && !trimmed.match(/^(Subject|To|From|CC|BCC|Date):\s*/i);
            }).join('\n').trim();
        }

        body = body
            .replace(/^\s*\n+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

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
        console.error('Error generating email:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to generate email'
            }),
        };
    }
};
