#!/usr/bin/env node

import { Command } from 'commander';
import cron from 'node-cron';
import fs from 'fs/promises';
import { generateContent, pickTopic } from './content/generate-content.js';
import { createPostImage } from './image/create-image.js';
import { publishToLinkedIn } from './publisher/linkedin-post.js';
import { runOAuthFlow } from './auth/linkedin-auth.js';
import config from './config.js';

const program = new Command();

program
    .name('sancikatech-linkedin')
    .description('🛡️  Sancikatech LinkedIn Post Automation — AI-powered cybersecurity content')
    .version('1.0.0');

// ── Helper: full pipeline ───────────────────────────────
async function runPipeline(options = {}) {
    const { dryRun = true, topic = null, skipImage = false } = options;

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║   🛡️  Sancikatech LinkedIn Post Automation              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Step 1: Generate content
    console.log('━━━ Step 1/3: Generating Content with AI ━━━');
    const selectedTopic = pickTopic(topic);
    console.log(`  📋 Topic: ${selectedTopic.label}`);
    console.log('  🤖 Calling Gemini AI...\n');

    let content;
    try {
        content = await generateContent(topic);
    } catch (err) {
        console.error('  ❌ Content generation failed:', err.message);
        if (err.message.includes('API_KEY')) {
            console.error('\n  💡 Set your Gemini API key in .env:');
            console.error('     GEMINI_API_KEY=your_key_here\n');
        }
        process.exit(1);
    }

    console.log('  ✅ Content generated!');
    console.log(`  📌 Headline: ${content.headline}`);
    console.log(`  🏷️  Hashtags: ${content.hashtags?.map(h => '#' + h).join(' ')}\n`);

    // Step 2: Create image
    let imagePath = null;
    if (!skipImage) {
        console.log('━━━ Step 2/3: Creating Post Image ━━━');
        try {
            imagePath = await createPostImage(content);
            console.log('  ✅ Image created!\n');
        } catch (err) {
            console.error('  ⚠️  Image creation failed:', err.message);
            console.log('  Continuing with text-only post...\n');
        }
    } else {
        console.log('━━━ Step 2/3: Skipping Image (--no-image) ━━━\n');
    }

    // Step 3: Publish
    console.log('━━━ Step 3/3: Publishing to LinkedIn ━━━');
    try {
        const result = await publishToLinkedIn(content.caption, imagePath, dryRun);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        if (result.dryRun) {
            console.log('║   ✅ DRY RUN COMPLETE                                   ║');
        } else {
            console.log('║   ✅ POST PUBLISHED SUCCESSFULLY                         ║');
        }
        console.log('╚══════════════════════════════════════════════════════════╝');

        console.log('\n  📝 Caption Preview:');
        console.log('  ──────────────────');
        const previewLines = content.caption.split('\n').slice(0, 6);
        previewLines.forEach(line => console.log(`  ${line}`));
        if (content.caption.split('\n').length > 6) {
            console.log('  ...(truncated)');
        }
        console.log('');

        // ── Cleanup: delete output files after successful live publish ──
        if (!result.dryRun) {
            console.log('━━━ Cleanup: Removing output files ━━━');
            const filesToDelete = [];

            // Delete the generated image
            if (imagePath) filesToDelete.push(imagePath);

            // Delete the caption .txt file (saved by publisher)
            if (result.captionPath) filesToDelete.push(result.captionPath);

            for (const filePath of filesToDelete) {
                try {
                    await fs.unlink(filePath);
                    console.log(`  🗑️  Deleted: ${filePath}`);
                } catch (err) {
                    console.warn(`  ⚠️  Could not delete ${filePath}: ${err.message}`);
                }
            }
            console.log('  ✅ Cleanup complete!\n');
        }

        return result;
    } catch (err) {
        console.error('  ❌ Publishing failed:', err.message);
        if (err.response?.data) {
            console.error('  LinkedIn API error:', JSON.stringify(err.response.data, null, 2));
        }
        process.exit(1);
    }
}

// ── Command: generate ───────────────────────────────────
program
    .command('generate')
    .description('Generate a LinkedIn post (caption + image) and save locally')
    .option('-t, --topic <id>', 'Force a specific topic: cyber_tip, threat_alert, industry_stat, service_spotlight, training_promo, did_you_know')
    .option('--no-image', 'Skip image generation')
    .action(async (opts) => {
        await runPipeline({
            dryRun: true,
            topic: opts.topic,
            skipImage: !opts.image,
        });
    });

// ── Command: post ───────────────────────────────────────
program
    .command('post')
    .description('Generate and publish a post to the Sancikatech LinkedIn page')
    .option('-t, --topic <id>', 'Force a specific topic')
    .option('--no-image', 'Skip image generation')
    .option('--dry-run', 'Generate content without posting', false)
    .action(async (opts) => {
        await runPipeline({
            dryRun: opts.dryRun,
            topic: opts.topic,
            skipImage: !opts.image,
        });
    });

// ── Command: auth ───────────────────────────────────────
program
    .command('auth')
    .description('Run the LinkedIn OAuth 2.0 flow to get an access token')
    .action(async () => {
        console.log('\n🔐 Starting LinkedIn OAuth flow...');
        console.log('   Make sure you have set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env\n');

        if (!config.linkedin.clientId || !config.linkedin.clientSecret) {
            console.error('❌ Missing LinkedIn app credentials in .env');
            console.error('   Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET first.\n');
            process.exit(1);
        }

        try {
            const tokenData = await runOAuthFlow();
            console.log('\n✅ Authentication successful!');
            console.log(`   Token type: ${tokenData.token_type}`);
            console.log(`   Expires in: ${Math.round(tokenData.expires_in / 86400)} days`);
            console.log('\n   Add this to your .env file:');
            console.log(`   LINKEDIN_ACCESS_TOKEN=${tokenData.access_token}\n`);
        } catch (err) {
            console.error('\n❌ Authentication failed:', err.message);
            process.exit(1);
        }
    });

// ── Command: schedule ───────────────────────────────────
program
    .command('schedule')
    .description('Run the automation on a cron schedule')
    .option('-c, --cron <expression>', 'Cron expression', config.schedule.cron)
    .option('-t, --topic <id>', 'Force a specific topic for all scheduled posts')
    .option('--dry-run', 'Generate content without posting', false)
    .action(async (opts) => {
        const cronExpr = opts.cron;

        if (!cron.validate(cronExpr)) {
            console.error(`❌ Invalid cron expression: ${cronExpr}`);
            process.exit(1);
        }

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║   🛡️  Sancikatech LinkedIn Scheduler                    ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log(`\n  ⏰ Schedule: ${cronExpr}`);
        console.log(`  📌 Mode: ${opts.dryRun ? 'Dry Run' : 'Live Posting'}`);
        console.log('  🔄 Waiting for next scheduled run...\n');

        cron.schedule(cronExpr, async () => {
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`\n⏰ Triggered at ${now}`);

            try {
                await runPipeline({
                    dryRun: opts.dryRun,
                    topic: opts.topic,
                });
            } catch (err) {
                console.error('Pipeline error:', err.message);
            }
        });

        // Keep process alive
        process.on('SIGINT', () => {
            console.log('\n👋 Scheduler stopped. Goodbye!');
            process.exit(0);
        });
    });

// ── Default action (no command) ─────────────────────────
program.action(async () => {
    console.log('\n🛡️  Sancikatech LinkedIn Automation');
    console.log('   Use --help to see available commands\n');
    console.log('   Quick start:');
    console.log('   1. Copy .env.example to .env and add your GEMINI_API_KEY');
    console.log('   2. Run: node src/index.js generate');
    console.log('   3. Check the output/ folder for your post!\n');
});

program.parse();
