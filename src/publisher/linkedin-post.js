import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import config from '../config.js';

const API_BASE = config.linkedin.baseUrl;
const API_VERSION = config.linkedin.apiVersion;

/**
 * Get common headers for LinkedIn API calls.
 */
function getHeaders() {
    return {
        Authorization: `Bearer ${config.linkedin.accessToken}`,
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
    };
}

/**
 * Initialize an image upload to LinkedIn and return the upload URL + image URN.
 */
async function initializeImageUpload() {
    const response = await axios.post(
        `${API_BASE}/rest/images?action=initializeUpload`,
        {
            initializeUploadRequest: {
                owner: `urn:li:organization:${config.linkedin.organizationId}`,
            },
        },
        { headers: { ...getHeaders(), 'Content-Type': 'application/json' } }
    );

    return {
        uploadUrl: response.data.value.uploadUrl,
        imageUrn: response.data.value.image,
    };
}

/**
 * Upload image binary data to LinkedIn's upload URL.
 */
async function uploadImageBinary(uploadUrl, imagePath) {
    const imageData = await fs.readFile(imagePath);

    await axios.put(uploadUrl, imageData, {
        headers: {
            ...getHeaders(),
            'Content-Type': 'application/octet-stream',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
}

/**
 * Create a LinkedIn post for the organization page.
 */
async function createPost(caption, imageUrn = null) {
    const postBody = {
        author: `urn:li:organization:${config.linkedin.organizationId}`,
        commentary: caption,
        visibility: 'PUBLIC',
        distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
    };

    if (imageUrn) {
        postBody.content = {
            media: {
                altText: 'Sancikatech cybersecurity post',
                id: imageUrn,
            },
        };
    }

    const response = await axios.post(`${API_BASE}/rest/posts`, postBody, {
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    });

    return response.headers['x-restli-id'] || response.data;
}

/**
 * Publish a post with an image to the Sancikatech LinkedIn page.
 *
 * @param {string} caption - Post caption text
 * @param {string} imagePath - Path to the image file
 * @param {boolean} dryRun - If true, skip actual posting
 * @returns {object} Result with post ID or dry-run info
 */
export async function publishToLinkedIn(caption, imagePath, dryRun = false) {
    if (dryRun) {
        const outputDir = config.paths.output;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const captionPath = path.join(outputDir, `caption_${timestamp}.txt`);

        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(captionPath, caption, 'utf-8');

        console.log('\n  🏷️  DRY RUN — Post NOT published to LinkedIn');
        console.log(`  📝 Caption saved: ${captionPath}`);
        if (imagePath) {
            console.log(`  📸 Image saved:   ${imagePath}`);
        }

        return {
            dryRun: true,
            captionPath,
            imagePath,
            caption,
        };
    }

    // Validate credentials
    if (!config.linkedin.accessToken) {
        throw new Error(
            'Missing LINKEDIN_ACCESS_TOKEN. Run `node src/index.js auth` to authenticate.'
        );
    }
    if (!config.linkedin.organizationId) {
        throw new Error(
            'Missing LINKEDIN_ORGANIZATION_ID. Set it in your .env file.'
        );
    }

    console.log('\n  🔄 Uploading image to LinkedIn...');

    let imageUrn = null;
    if (imagePath) {
        const { uploadUrl, imageUrn: urn } = await initializeImageUpload();
        await uploadImageBinary(uploadUrl, imagePath);
        imageUrn = urn;
        console.log('  ✅ Image uploaded successfully');
    }

    console.log('  🔄 Creating post...');
    const postId = await createPost(caption, imageUrn);
    console.log(`  ✅ Post published! ID: ${postId}`);

    return {
        dryRun: false,
        postId,
        imageUrn,
    };
}
