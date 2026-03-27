import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // ── Brand ──────────────────────────────────────────────
  brand: {
    name: 'Sancikatech',
    tagline: 'Your Digital Bridge',
    website: 'https://sancikatech.com',
    colors: {
      primary: '#00D4FF',     // Cyber blue
      secondary: '#7B2FFF',   // Purple accent
      dark: '#0A0E27',        // Deep navy
      darkAlt: '#111640',     // Slightly lighter navy
      accent: '#00FF88',      // Green accent
      warning: '#FF6B35',     // Alert orange
      text: '#FFFFFF',
      textMuted: '#8892B0',
    },
    services: [
      'Cybersecurity Solutions',
      'Penetration Testing & VAPT',
      'Web Development (WordPress & Shopify)',
      'Software Development',
      'Ethical Hacking Training',
      'AI & ML Training',
      'Software Development Training',
    ],
    priorityService: 'Cybersecurity',
  },

  // ── Content Topics ─────────────────────────────────────
  topics: [
    {
      id: 'cyber_tip',
      label: 'Cybersecurity Tip',
      description: 'Actionable security tips for businesses and professionals',
      weight: 30,
    },
    {
      id: 'threat_alert',
      label: 'Threat Intelligence',
      description: 'Latest cyber threats, vulnerabilities, and attack trends',
      weight: 25,
    },
    {
      id: 'industry_stat',
      label: 'Industry Statistics',
      description: 'Eye-catching cybersecurity statistics and facts',
      weight: 15,
    },
    {
      id: 'service_spotlight',
      label: 'Service Spotlight',
      description: 'Showcase Sancikatech services and capabilities',
      weight: 10,
    },
    {
      id: 'training_promo',
      label: 'Training & Courses',
      description: 'Promote ethical hacking, AI, and software development training',
      weight: 10,
    },
    {
      id: 'did_you_know',
      label: 'Did You Know?',
      description: 'Surprising facts or hidden features about technology and security.',
      weight: 0.15,
    },
    {
      id: 'festival',
      label: 'Festival / Occasion',
      description: 'Greeting for a major festival or public holiday in India or USA.',
      weight: 0,
    },
  ],

  // ── AI ────────────────────────────────────────────────
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    // gemini-2.5-flash-lite: 1000 req/day free | gemini-2.5-flash: 250 req/day | gemini-2.5-pro: 50 req/day
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-preview-06-17',
    fallbackModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  },

  // ── LinkedIn ──────────────────────────────────────────
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'https://uncreeping-felipe-unitively.ngrok-free.dev/callback',
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    organizationId: process.env.LINKEDIN_ORGANIZATION_ID,
    apiVersion: '202601',
    baseUrl: 'https://api.linkedin.com',
  },

  // ── Scheduling ────────────────────────────────────────
  schedule: {
    cron: process.env.CRON_SCHEDULE || '0 9 * * 1-5', // 9 AM Mon-Fri
  },

  // ── Paths ─────────────────────────────────────────────
  paths: {
    root: path.resolve(__dirname, '..'),
    output: path.resolve(__dirname, '..', 'output'),
    templates: path.resolve(__dirname, 'image', 'templates'),
  },
};

export default config;
