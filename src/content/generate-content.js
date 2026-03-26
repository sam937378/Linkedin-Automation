import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Pick a random topic based on weighted probabilities.
 */
export function pickTopic(forceTopic) {
    if (forceTopic) {
        return config.topics.find((t) => t.id === forceTopic) || config.topics[0];
    }

    const totalWeight = config.topics.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const topic of config.topics) {
        random -= topic.weight;
        if (random <= 0) return topic;
    }
    return config.topics[0];
}

/**
 * Generate LinkedIn post content using Gemini AI.
 */
export async function generateContent(topicOverride) {
    // ── Festival Check ────────────────────────────────────────────────
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Ask Gemini if today is a festival
    let festivalData = null;
    if (!topicOverride) {
        try {
            const festivalPrompt = `Is today (${dateStr}) a major public holiday or festival in India or the USA? 
            Return ONLY a JSON object: {"isFestival": true/false, "name": "Festival Name", "region": "India/USA/Both"}. 
            Ignore minor observances.`;

            const festivalModel = genAI.getGenerativeModel({ model: config.gemini.model });
            const festivalResult = await festivalModel.generateContent(festivalPrompt);
            const festivalJson = JSON.parse(festivalResult.response.text().replace(/```json|```/g, '').trim());

            if (festivalJson.isFestival) {
                console.log(`🎉 Festival detected: ${festivalJson.name} (${festivalJson.region})`);
                festivalData = festivalJson;
            }
        } catch (e) {
            console.error('Festival check failed:', e.message);
        }
    }

    const topic = festivalData ? {
        id: 'festival',
        label: festivalData.name,
        description: `Celebrate ${festivalData.name} (${festivalData.region}) professionally. Relate it to cybersecurity if possible (e.g. 'Safety this Diwali'), otherwise keep it general good wishes.`
    } : pickTopic(topicOverride);

    const systemPrompt = `You are a senior LinkedIn content strategist for ${config.brand.name}, a cybersecurity and IT company.
Your job is to create HIGHLY ENGAGING LinkedIn posts that generate leads and establish thought leadership.

COMPANY INFO:
- Company: ${config.brand.name}
- Tagline: "${config.brand.tagline}"
- Website: ${config.brand.website}
- Priority: Cybersecurity (penetration testing, VAPT, security audits, threat intelligence)
- Also offers: ${config.brand.services.join(', ')}

TARGET AUDIENCE:
- CISOs, IT Directors, CTOs, Security Engineers
- Business owners worried about cyber threats
- IT professionals looking for training
- Decision-makers evaluating security vendors

CONTENT RULES:
1. Write in a professional but approachable tone — not salesy
2. Start with a HOOK — a shocking stat, bold question, or provocative statement
3. Use short paragraphs (1-2 lines max) for mobile readability
4. Include a clear CTA (call-to-action) at the end — drive DMs, comments, or website visits
5. Add 2-3 line breaks between sections for visual spacing
6. Use relevant emojis sparingly (2-4 total) for visual appeal
7. End with 5-8 relevant hashtags on a separate line
8. Keep the post between 150-280 words
9. Make it feel like insight from an expert, not an advertisement
10. Reference current cybersecurity trends, threats, or real-world scenarios when appropriate

SEO OPTIMIZATION (CRITICAL — follow these strictly):
11. Place the PRIMARY keyword or topic phrase within the FIRST 2-3 lines of the post so it appears in preview snippets and search results
12. Naturally integrate 3-5 high-volume SEO keywords relevant to the topic throughout the post. Examples by category:
    - Cybersecurity: "penetration testing", "vulnerability assessment", "VAPT", "ethical hacking", "data breach prevention", "threat intelligence", "security audit", "zero trust", "ransomware protection", "SOC", "incident response"
    - Web Development: "WordPress development", "Shopify development", "ecommerce website", "responsive web design", "website security", "custom web solutions"
    - Software Development: "custom software development", "software consulting", "enterprise solutions", "cloud migration", "DevSecOps", "agile development"
    - Training: "cybersecurity training", "ethical hacking course", "AI ML training", "upskilling", "career in cybersecurity"
13. Use LSI (Latent Semantic Indexing) keywords — related terms that add context (e.g., for "penetration testing" also use "security assessment", "vulnerability scanning", "red team")
14. Write the headline/hook as if it were an SEO title — clear, keyword-rich, and answering a search query
15. Ensure the CTA includes a branded keyword (e.g., "Talk to Sancikatech's security experts" instead of just "Talk to us")
16. Structure content so each paragraph addresses a micro search-intent (what, why, how, next steps)
17. Hashtags MUST be SEO-focused: mix 3-4 broad industry hashtags (#CyberSecurity, #InfoSec, #PenetrationTesting) with 2-3 niche/branded hashtags (#Sancikatech, #EthicalHackingTraining, #VAPTServices)
18. Avoid generic filler phrases — every sentence should contain value and searchable terms`;

    const userPrompt = `Create a LinkedIn post for the topic category: "${topic.label}"
Topic description: ${topic.description}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Return your response as a valid JSON object with these exact keys:
{
  "caption": "The full LinkedIn post text including hashtags at the end. Must be SEO-optimized with primary keywords in the first 2 lines and LSI keywords throughout.",
  "hashtags": ["array", "of", "SEO-focused", "hashtags", "without", "the", "hash", "symbol"],
  "headline": "A short 5-8 word headline for the post image — keyword-rich, punchy, and answering a common search query",
  "subheadline": "A 10-15 word supporting line for the post image that reinforces the primary keyword",
  "keyPoints": ["Keyword-rich Point 1 (max 8 words)", "Keyword-rich Point 2 (max 8 words)", "Keyword-rich Point 3 (max 8 words)"],
  "stat": "A single impactful statistic with number (e.g., '95% of breaches are caused by human error')",
  "topicCategory": "${topic.id}",
  "category": "Cyber Tip" | "Threat Alert" | "Industry Stat" | "Service Spotlight" | "Training Promo" | "Did You Know?" | "Festival"
}

IMPORTANT: Return ONLY the JSON object, no markdown backticks or other text.
SEO REMINDER: The caption, headline, subheadline, and keyPoints MUST all contain high-value, searchable keywords relevant to the topic. Think like an SEO content writer — every word should contribute to discoverability.`;

    const model = genAI.getGenerativeModel({
        model: config.gemini.model,
        generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 2048,
        },
    });

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);

    const responseText = result.response.text().trim();

    // Parse JSON — handle potential markdown code blocks from Gemini
    let cleaned = responseText;
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    return {
        ...parsed,
        topicMeta: topic,
        generatedAt: new Date().toISOString(),
    };
}
