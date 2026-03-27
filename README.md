# 🛡️ Sancikatech LinkedIn Automation

AI-powered LinkedIn post automation that generates **cybersecurity-focused** content and publishes it to the Sancikatech company page.

## Features

- 🤖 **AI Content Generation** — Uses Google Gemini to create professional, lead-generating LinkedIn captions
- 🎨 **Automated Image Creation** — Generates stunning dark-themed post images with 6 unique templates
- 📤 **LinkedIn Auto-Posting** — Publishes directly to your company page via the LinkedIn API
- ⏰ **Scheduling** — Run on a cron schedule (default: 9 AM Mon–Fri)
- 🧪 **Dry Run Mode** — Preview content locally before going live

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your **Gemini API key**:

```
GEMINI_API_KEY=your_key_here
```

### 3. Generate Your First Post

```bash
node src/index.js generate
```

This creates a post image + caption in the `output/` folder without posting to LinkedIn.

## Commands

| Command | Description |
|---------|-------------|
| `node src/index.js generate` | Generate post content & image (dry run) |
| `node src/index.js generate -t cyber_tip` | Generate a specific topic |
| `node src/index.js post --dry-run` | Full pipeline, saves locally |
| `node src/index.js post` | Generate AND publish to LinkedIn |
| `node src/index.js auth` | Run LinkedIn OAuth to get access token |
| `node src/index.js schedule` | Run on cron schedule (9 AM Mon–Fri) |

### Topic Categories

| Topic ID | Focus |
|----------|-------|
| `cyber_tip` | Actionable security tips (30% weight) |
| `threat_alert` | Latest threats & vulnerabilities (25%) |
| `industry_stat` | Eye-catching statistics (15%) |
| `service_spotlight` | Sancikatech services (10%) |
| `training_promo` | Courses & training (10%) |
| `did_you_know` | Surprising cyber facts (10%) |

## LinkedIn API Setup

To enable auto-posting, you need a LinkedIn Developer App:

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app linked to the **Sancikatech** company page
3. Request access to **"Share on LinkedIn"** product
4. Note your **Client ID** and **Client Secret**
5. Add `http://localhost:3939/callback` as a redirect URI
6. Find your Organization ID from your company page URL
7. Add all credentials to `.env`
8. Run `node src/index.js auth` to get your access token

## Project Structure

```
automa/
├── src/
│   ├── index.js                 # CLI orchestrator
│   ├── config.js                # Brand config & settings
│   ├── auth/
│   │   └── linkedin-auth.js     # OAuth 2.0 flow
│   ├── content/
│   │   └── generate-content.js  # Gemini AI content generation
│   ├── image/
│   │   └── create-image.js      # HTML template → PNG image
│   └── publisher/
│       └── linkedin-post.js     # LinkedIn API publishing
├── output/                      # Generated posts (gitignored)
├── .env.example
├── package.json
└── README.md
```
