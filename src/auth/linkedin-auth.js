import express from 'express';
import axios from 'axios';
import open from 'open';
import config from '../../config.js';

/**
 * Generate the LinkedIn OAuth 2.0 authorization URL.
 */
export function getAuthorizationUrl() {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.linkedin.clientId,
        redirect_uri: config.linkedin.redirectUri,
        scope: 'w_organization_social r_organization_social rw_organization_admin',
        state: 'sancikatech_' + Date.now(),
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access token.
 */
export async function exchangeCodeForToken(code) {
    const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.linkedin.redirectUri,
            client_id: config.linkedin.clientId,
            client_secret: config.linkedin.clientSecret,
        }).toString(),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
    );
    return response.data;
}

/**
 * Start a local Express server, open the browser for OAuth,
 * and return the access token once the callback is received.
 */
export function runOAuthFlow() {
    return new Promise((resolve, reject) => {
        const app = express();
        const port = 3939;
        let server;

        app.get('/callback', async (req, res) => {
            const { code, error } = req.query;

            if (error) {
                res.send(`<h1>❌ Authorization Failed</h1><p>${error}</p>`);
                server.close();
                return reject(new Error(error));
            }

            try {
                const tokenData = await exchangeCodeForToken(code);
                res.send(`
          <html>
          <body style="font-family:Inter,sans-serif;background:#0A0E27;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <h1 style="color:#00D4FF">✅ Authorized Successfully!</h1>
              <p>Add this to your <code>.env</code> file:</p>
              <pre style="background:#111640;padding:16px;border-radius:8px;color:#00FF88;word-break:break-all;max-width:600px">LINKEDIN_ACCESS_TOKEN=${tokenData.access_token}</pre>
              <p style="color:#8892B0">Token expires in ${Math.round(tokenData.expires_in / 86400)} days. You can close this window.</p>
            </div>
          </body>
          </html>
        `);
                server.close();
                resolve(tokenData);
            } catch (err) {
                res.send(`<h1>❌ Token Exchange Failed</h1><p>${err.message}</p>`);
                server.close();
                reject(err);
            }
        });

        server = app.listen(port, '0.0.0.0', () => {
            const authUrl = getAuthorizationUrl();
            console.log('\n🔐 Opening LinkedIn authorization in your browser...');
            console.log(`   If it doesn't open, visit: ${authUrl}\n`);
            open(authUrl);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            server.close();
            reject(new Error('OAuth flow timed out after 5 minutes'));
        }, 5 * 60 * 1000);
    });
}
