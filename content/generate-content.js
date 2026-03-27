import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FESTIVAL_CACHE = path.resolve(__dirname, '..', 'output', 'festival-cache.json');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Return a user-friendly message when ALL models are quota-exhausted.
 */
function quotaExhaustedMessage(err) {
    // Parse retryDelay from the error JSON if present
    const match = err.message?.match(/"retryDelay":"(\d+)s"/);
    const delaySec = match ? parseInt(match[1], 10) : null;

    // Calculate IST reset time (midnight UTC = 05:30 IST)
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntilReset = midnight - now;
    const h = Math.floor(msUntilReset / 3_600_000);
    const m = Math.floor((msUntilReset % 3_600_000) / 60_000);

    let msg = '\n  ┌─────────────────────────────────────────────────┐\n';
    msg += '  │  ⏳ Daily free-tier quota exhausted              │\n';
    msg += '  │                                                  │\n';
    if (delaySec && delaySec < 120) {
        msg += `  │  This is a per-minute limit. Wait ${delaySec}s and retry.    │\n`;
    } else {
        msg += `  │  Daily limit resets at midnight UTC              │\n`;
        msg += `  │  That is ~${h}h ${m}m from now (05:30 IST tomorrow)   │\n`;
        msg += '  │                                                  │\n';
        msg += '  │  Options:                                        │\n';
        msg += '  │  1. Wait until tomorrow and run again            │\n';
        msg += '  │  2. Add billing to your Google AI account        │\n';
        msg += '  │     https://aistudio.google.com/                 │\n';
        msg += '  │  3. Use a second GEMINI_API_KEY in .env          │\n';
    }
    msg += '  └─────────────────────────────────────────────────┘\n';
    return msg;
}

/**
 * Call Gemini with automatic fallback to cheaper models on 429 quota errors.
 * @param {function(string): Promise<*>} callFn - Receives a model name, returns the result.
 */
async function generateWithFallback(callFn) {
    const models = [config.gemini.model, ...config.gemini.fallbackModels];
    let lastError;
    for (const model of models) {
        try {
            return await callFn(model);
        } catch (err) {
            const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests');
            const isNotFound = err.message?.includes('404') || err.message?.includes('not found');
            if (isQuota || isNotFound) {
                console.warn(`  ⚠️  Model ${model} unavailable (${isQuota ? 'quota' : 'not found'}), trying next...`);
                lastError = err;
            } else {
                throw err; // Non-quota, non-404 error — surface immediately
            }
        }
    }
    throw lastError; // All models exhausted
}

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

    // Ask Gemini if today is a festival (cached per calendar day)
    let festivalData = null;
    if (!topicOverride) {
        // Try to load today's cached result first
        const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
        let cacheHit = false;
        try {
            const raw = await fs.readFile(FESTIVAL_CACHE, 'utf8');
            const cache = JSON.parse(raw);
            if (cache.date === todayStr) {
                festivalData = cache.isFestival ? cache : null;
                cacheHit = true;
                if (festivalData) console.log(`🎉 Festival (cached): ${festivalData.name} (${festivalData.region})`);
                else console.log('  📅 Festival check: no festival today (cached).');
            }
        } catch { /* cache miss or missing file */ }

        if (!cacheHit) {
            try {
                const festivalPrompt = `Is today (${dateStr}) a major public holiday or festival in India or the USA? 
            Return ONLY a JSON object: {"isFestival": true/false, "name": "Festival Name", "region": "India/USA/Both"}. 
            Ignore minor observances.`;

                const festivalResult = await generateWithFallback(async (modelName) => {
                    const festivalModel = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json" },
                    });
                    return festivalModel.generateContent(festivalPrompt);
                });
                const festivalJson = JSON.parse(festivalResult.response.text().replace(/```json|```/g, '').trim());

                // Cache the result for today
                await fs.mkdir(path.dirname(FESTIVAL_CACHE), { recursive: true });
                await fs.writeFile(FESTIVAL_CACHE, JSON.stringify({ ...festivalJson, date: todayStr }));

                if (festivalJson.isFestival) {
                    console.log(`🎉 Festival detected: ${festivalJson.name} (${festivalJson.region})`);
                    festivalData = festivalJson;
                }
            } catch (e) {
                console.warn('  ℹ️  Festival check skipped (API unavailable).');
            }
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

IMPORTANT: Return ONLY the JSON object, no markdown backticks or other text. Ensure all newlines inside string values are properly escaped as '\\n'. DO NOT include literal line breaks within the string values.
SEO REMINDER: The caption, headline, subheadline, and keyPoints MUST all contain high-value, searchable keywords relevant to the topic. Think like an SEO content writer — every word should contribute to discoverability.`;

    const result = await generateWithFallback(async (modelName) => {
        console.log(`  🤖 Using model: ${modelName}`);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
        });
        return model.generateContent(systemPrompt + '\n\n' + userPrompt);
    });

    console.log("Finish Reason:", result.response.candidates?.[0]?.finishReason);

    const responseText = result.response.text().trim();

    // Parse JSON — handle potential markdown code blocks from Gemini
    let cleaned = responseText;
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
        return {
            ...parsed,
            topicMeta: topic,
            generatedAt: new Date().toISOString(),
        };
    } catch (parseError) {
        console.error("Failed to parse JSON. Raw content:");
        console.error(cleaned);
        throw parseError;
    }
}
