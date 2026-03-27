
import 'dotenv/config';

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    console.log('Fetching models from:', url.replace(process.env.GEMINI_API_KEY, 'HIDDEN_KEY'));

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
        } else if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log('Unexpected response:', data);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

listModels();
