import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the HTML template for a given topic category.
 * Now accepts logoData (base64 string) to embed the logo safely.
 */
function getTemplate(content, logoData) {
  const { colors } = config.brand;
  const category = content.topicCategory || 'cyber_tip';

  // Premium base styles shared across templates
  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 1200px;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      background: #020617; /* Deep slate */
      color: #F8FAFC;
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .text-gradient-primary {
      background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `;

  const brandFooter = `
    <div style="
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 32px 56px;
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(255,255,255,0.05);
      z-index: 100;
    ">
      <div style="display: flex; align-items: center; gap: 24px;">
        <!-- Premium Logo Embedded -->
        <img src="${logoData}" style="height: 60px; width: auto; max-width: 250px; object-fit: contain;" alt="${config.brand.name}" />
        
        <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 24px;">
          <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 20px; color: #fff; letter-spacing: 0.5px;">${config.brand.name}</div>
          <div style="font-size: 13px; color: #94A3B8; margin-top: 4px; font-weight: 500;">${config.brand.tagline}</div>
        </div>
      </div>
      <div style="font-size: 14px; color: #94A3B8; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        ${config.brand.website}
      </div>
    </div>
  `;

  const templates = {
    // ──────────────── Cybersecurity Tip ────────────────
    cyber_tip: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; gap: 60px;
          background: #020617;
        }
        .bg-glow-1 { position: absolute; top: -100px; left: -100px; width: 600px; height: 600px; background: ${colors.primary}; filter: blur(150px); opacity: 0.15; border-radius: 50%; }
        .bg-glow-2 { position: absolute; bottom: 100px; right: -100px; width: 800px; height: 800px; background: ${colors.secondary}; filter: blur(180px); opacity: 0.1; border-radius: 50%; }
        .left-col { flex: 1; display: flex; flex-direction: column; justify-content: center; z-index: 10; padding-bottom: 80px; }
        .right-col { flex: 1.2; display: flex; flex-direction: column; justify-content: center; gap: 24px; z-index: 10; padding-bottom: 80px; }
        
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 100px; padding: 12px 24px; width: fit-content;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 14px; color: ${colors.primary}; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 32px;
        }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: ${colors.primary}; box-shadow: 0 0 10px ${colors.primary}; }
        .headline { font-family: 'Outfit', sans-serif; font-size: 64px; font-weight: 800; line-height: 1.1; margin-bottom: 24px; color: #fff; }
        .headline span { background: linear-gradient(135deg, ${colors.primary}, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subheadline { font-size: 22px; color: #94A3B8; line-height: 1.6; font-weight: 400; }
        
        .point-card {
          padding: 32px; border-radius: 24px;
          display: flex; gap: 24px; align-items: flex-start;
          transition: transform 0.3s ease;
        }
        .point-num {
          font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.4);
          line-height: 1; flex-shrink: 0;
        }
        .point-content { display: flex; flex-direction: column; gap: 8px; }
        .point-text { font-size: 20px; font-weight: 600; color: #E2E8F0; line-height: 1.4; }
      </style>
      <div class="container">
        <div class="bg-glow-1"></div><div class="bg-glow-2"></div>
        <div class="left-col">
          <div class="badge"><div class="badge-dot"></div> CYBERSECURITY TIP</div>
          <div class="headline">${escapeHtml(content.headline)}</div>
          <div class="subheadline">${escapeHtml(content.subheadline)}</div>
        </div>
        <div class="right-col">
          ${(content.keyPoints || []).map((p, i) => `
            <div class="glass-panel point-card">
              <div class="point-num">0${i + 1}</div>
              <div class="point-content">
                <div class="point-text">${escapeHtml(p)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        ${brandFooter}
      </div>
    `,

    // ──────────────── Threat Intelligence ─────────────
    threat_alert: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column;
          background: #020617;
          background-image: radial-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glow-red { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: ${colors.warning}; filter: blur(200px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        .header { display: flex; justify-content: space-between; align-items: center; z-index: 10; margin-bottom: 60px; }
        .badge {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255, 107, 53, 0.15); border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 12px; padding: 12px 24px;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; color: ${colors.warning}; letter-spacing: 2px; text-transform: uppercase;
        }
        .alert-icon { font-size: 20px; animation: pulse 2s infinite; }
        .date { font-family: 'Outfit', sans-serif; font-size: 18px; color: #94A3B8; font-weight: 600; padding: 12px 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
        
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; z-index: 10; flex: 1; padding-bottom: 80px; }
        
        .main-alert { display: flex; flex-direction: column; gap: 24px; }
        .headline { font-family: 'Outfit', sans-serif; font-size: 72px; font-weight: 900; line-height: 1.05; color: #fff; }
        .stat-box {
          margin-top: auto; padding: 40px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(255,107,53,0.1), rgba(0,0,0,0));
          border-left: 4px solid ${colors.warning};
        }
        .stat-val { font-family: 'Outfit', sans-serif; font-size: 80px; font-weight: 900; color: ${colors.warning}; line-height: 1; }
        .stat-label { font-size: 20px; color: #F8FAFC; margin-top: 12px; font-weight: 500; }
        
        .points-list { display: flex; flex-direction: column; gap: 20px; justify-content: center; }
        .point {
          display: flex; align-items: center; gap: 20px;
          padding: 24px 32px; border-radius: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        }
        .point svg { color: ${colors.warning}; flex-shrink: 0; }
        .point-text { font-size: 20px; color: #CBD5E1; font-weight: 500; }
      </style>
      <div class="container">
        <div class="glow-red"></div>
        <div class="header">
          <div class="badge"><span class="alert-icon">⚠️</span> THREAT ALERT</div>
          <div class="date">CRITICAL PRIORITY</div>
        </div>
        <div class="content-grid">
          <div class="main-alert">
            <div class="headline">${escapeHtml(content.headline)}</div>
            <div class="stat-box">
              <div class="stat-val">${escapeHtml((content.stat || '').split(' ').find(w => /\d/.test(w)) || 'N/A')}</div>
              <div class="stat-label">${escapeHtml(content.stat || content.subheadline)}</div>
            </div>
          </div>
          <div class="points-list">
            ${(content.keyPoints || []).map((p) => `
              <div class="glass-panel point">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div class="point-text">${escapeHtml(p)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ${brandFooter}
      </div>
    `,

    // ──────────────── Industry Statistics ──────────────
    industry_stat: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          background: #020617;
          background-image: radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 70%);
        }
        .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; height: 800px; background: ${colors.accent}; filter: blur(250px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.25);
          border-radius: 100px; padding: 12px 28px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; color: ${colors.accent}; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 40px; z-index: 10;
        }
        
        .stat-ring {
          position: relative; width: 400px; height: 400px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 40px; z-index: 10;
        }
        .stat-ring::before {
          content: ''; position: absolute; inset: 0;
          border-radius: 50%; border: 2px dashed rgba(0, 255, 136, 0.3);
          animation: spin 30s linear infinite;
        }
        .stat-ring::after {
          content: ''; position: absolute; inset: 20px;
          border-radius: 50%; background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,0,0,0));
          border: 1px solid rgba(0, 255, 136, 0.2);
        }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .big-stat {
          font-family: 'Outfit', sans-serif; font-size: 140px; font-weight: 900;
          background: linear-gradient(135deg, #fff, ${colors.accent});
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          line-height: 1; z-index: 20; text-shadow: 0 10px 30px rgba(0,255,136,0.3);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px;
          padding: 40px; width: 85%; z-index: 10; margin-bottom: 60px;
        }
        .stat-desc { font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 800; color: #fff; line-height: 1.3; margin-bottom: 16px; }
        .subtext { font-size: 20px; color: #94A3B8; line-height: 1.6; }
      </style>
      <div class="container">
        <div class="bg-glow"></div>
        <div class="badge">📊 INDUSTRY INSIGHT</div>
        
        <div class="stat-ring">
          <div class="big-stat">${escapeHtml((content.stat || '').split(' ').find(w => /\d/.test(w)) || '?')}</div>
        </div>
        
        <div class="glass-card">
          <div class="stat-desc">${escapeHtml(content.headline)}</div>
          <div class="subtext">${escapeHtml(content.subheadline)}</div>
        </div>
        
        ${brandFooter}
      </div>
    `,

    // ──────────────── Service Spotlight ────────────────
    service_spotlight: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column; align-items: center;
          background: #020617;
          background-image: linear-gradient(rgba(123, 47, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 47, 255, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .bg-glow { position: absolute; top: -200px; right: -200px; width: 800px; height: 800px; background: ${colors.secondary}; filter: blur(200px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        
        .header { text-align: center; margin-bottom: 60px; z-index: 10; display: flex; flex-direction: column; align-items: center; }
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 47, 255, 0.1));
          border: 1px solid rgba(123, 47, 255, 0.3);
          border-radius: 100px; padding: 12px 28px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; color: #C084FC; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 30px;
        }
        .headline { font-family: 'Outfit', sans-serif; font-size: 60px; font-weight: 900; color: #fff; line-height: 1.2; max-width: 90%; margin-bottom: 20px;}
        .headline span { background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subheadline { font-size: 22px; color: #94A3B8; max-width: 80%; line-height: 1.6; }
        
        .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; width: 100%; z-index: 10; flex: 1; padding-bottom: 80px; }
        
        .service-card {
          background: rgba(255,255,255,0.02); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 24px;
          padding: 32px; display: flex; flex-direction: column; gap: 20px;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .service-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, ${colors.primary}, transparent); opacity: 0.5; }
        
        .icon-box {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(123,47,255,0.1));
          border: 1px solid rgba(123,47,255,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .service-title { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #F8FAFC; line-height: 1.3; }
      </style>
      <div class="container">
        <div class="bg-glow"></div>
        <div class="header">
          <div class="badge">🚀 OUR SERVICES</div>
          <div class="headline">${escapeHtml(content.headline)}</div>
          <div class="subheadline">${escapeHtml(content.subheadline)}</div>
        </div>
        <div class="services-grid">
          ${(content.keyPoints || config.brand.services || []).slice(0, 4).map((s) => `
            <div class="service-card">
              <div class="icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div class="service-title">${escapeHtml(s)}</div>
            </div>
          `).join('')}
        </div>
        ${brandFooter}
      </div>
    `,

    // ──────────────── Training Promo ───────────────────
    training_promo: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column;
          background: #020617;
          background-image: radial-gradient(circle at 80% 80%, rgba(0, 255, 136, 0.05) 0%, transparent 50%);
        }
        .bg-glow-1 { position: absolute; top: -100px; right: -100px; width: 600px; height: 600px; background: ${colors.accent}; filter: blur(150px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        .bg-glow-2 { position: absolute; bottom: 100px; left: -100px; width: 600px; height: 600px; background: ${colors.primary}; filter: blur(180px); opacity: 0.1; border-radius: 50%; pointer-events: none;}
        
        .header { display: flex; flex-direction: column; z-index: 10; margin-bottom: 50px; }
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 100px; padding: 12px 24px; width: fit-content;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 15px; color: ${colors.accent}; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 24px;
        }
        .headline { font-family: 'Outfit', sans-serif; font-size: 64px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; color: #fff; max-width: 90%; }
        .headline span { color: ${colors.accent}; }
        .subheadline { font-size: 24px; color: #94A3B8; max-width: 85%; font-weight: 400; line-height: 1.5; }
        
        .content-area { display: flex; gap: 40px; z-index: 10; flex: 1; padding-bottom: 80px;}
        
        .features-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px; }
        .feature-item {
          display: flex; align-items: center; gap: 20px;
          background: rgba(0,255,136,0.03); border: 1px solid rgba(0,255,136,0.1);
          border-radius: 20px; padding: 24px 32px; backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, ${colors.accent}, #00b368);
          display: flex; align-items: center; justify-content: center; color: #020617; flex-shrink: 0; box-shadow: 0 5px 15px rgba(0,255,136,0.3);
        }
        .feature-text { font-size: 22px; color: #F8FAFC; font-weight: 600; line-height: 1.3;}
        
        .enroll-card {
          width: 380px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 48px 40px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .enroll-title { font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 16px; line-height: 1.2;}
        .enroll-sub { font-size: 18px; color: #94A3B8; margin-bottom: 40px; line-height: 1.5; }
        .enroll-btn { background: ${colors.accent}; border-radius: 100px; padding: 20px 0; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #020617; box-shadow: 0 10px 25px rgba(0,255,136,0.4); width: 100%; text-transform: uppercase; letter-spacing: 1px;}
      </style>
      <div class="container">
        <div class="bg-glow-1"></div><div class="bg-glow-2"></div>
        <div class="header">
          <div class="badge">🎓 PREMIUM TRAINING</div>
          <div class="headline">${escapeHtml(content.headline)}</div>
          <div class="subheadline">${escapeHtml(content.subheadline)}</div>
        </div>
        <div class="content-area">
          <div class="features-list">
            ${(content.keyPoints || []).slice(0, 3).map((p) => `
              <div class="feature-item">
                <div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                <div class="feature-text">${escapeHtml(p)}</div>
              </div>
            `).join('')}
          </div>
          <div class="enroll-card">
            <div class="enroll-title">Secure Your Spot</div>
            <div class="enroll-sub">Limited seats available for our exclusive upcoming batch.</div>
            <div class="enroll-btn">Enroll Now</div>
          </div>
        </div>
        ${brandFooter}
      </div>
    `,

    // ──────────────── Did You Know? ────────────────────
    did_you_know: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #020617; text-align: center;
        }
        .bg-rays {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-conic-gradient(from 0deg, rgba(0,212,255,0.02) 0deg 3deg, transparent 3deg 6deg);
          pointer-events: none; opacity: 0.6;
        }
        .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; height: 800px; background: ${colors.primary}; filter: blur(250px); opacity: 0.15; border-radius: 50%; }
        
        .huge-q {
          font-family: 'Outfit', sans-serif; font-size: 240px; font-weight: 900; line-height: 1;
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.1));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          z-index: 1; pointer-events: none;
        }
        
        .glass-panel {
          border: 1px solid rgba(0,212,255,0.2); border-radius: 32px;
          background: rgba(2,6,23,0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          padding: 60px 80px; display: flex; flex-direction: column; align-items: center; z-index: 10;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,212,255,0.05);
          max-width: 90%;
        }
        
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 100px; padding: 12px 28px;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; color: ${colors.primary}; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 40px; box-shadow: 0 0 20px rgba(0,212,255,0.2);
        }
        .headline { font-family: 'Outfit', sans-serif; font-size: 56px; font-weight: 800; line-height: 1.25; color: #fff; margin-bottom: 30px;}
        .headline span { color: ${colors.primary}; text-decoration: underline; text-decoration-color: rgba(0,212,255,0.3); }
        .divider { width: 100px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, transparent, ${colors.primary}, transparent); margin: 0 auto 30px; }
        .subtext { font-size: 24px; color: #94A3B8; max-width: 100%; line-height: 1.6; }
      </style>
      <div class="container">
        <div class="bg-glow"></div>
        <div class="bg-rays"></div>
        <div class="huge-q">?</div>
        
        <div class="glass-panel">
          <div class="badge">💡 DID YOU KNOW?</div>
          <div class="headline">${escapeHtml(content.headline)}</div>
          <div class="divider"></div>
          <div class="subtext">${escapeHtml(content.subheadline)}</div>
        </div>
        
        ${brandFooter}
      </div>
    `,

    // ──────────────── Festival / Occasion ────────────────
    festival: `
      <style>
        ${baseStyles}
        .container {
          width: 100%; height: 100%; position: relative;
          padding: 80px 60px; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; background: #020617;
        }
        .bg-glow-gold { position: absolute; top: 0; left: 0; width: 600px; height: 600px; background: #FFD700; filter: blur(250px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        .bg-glow-pink { position: absolute; bottom: 0; right: 0; width: 600px; height: 600px; background: #FF0080; filter: blur(250px); opacity: 0.15; border-radius: 50%; pointer-events: none;}
        
        .confetti {
          position: absolute; inset: 0;
          background-image: 
            radial-gradient(#ffd700 2px, transparent 2px),
            radial-gradient(#ff0080 3px, transparent 3px),
            radial-gradient(#00d4ff 1.5px, transparent 1.5px);
          background-size: 80px 80px, 60px 60px, 50px 50px;
          background-position: 0 0, 30px 30px, 15px 15px;
          opacity: 0.25; pointer-events: none;
        }
        
        .glass-panel {
          border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 40px;
          background: rgba(2,6,23,0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          padding: 60px 80px; display: flex; flex-direction: column; align-items: center; z-index: 10;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 0 60px rgba(255,215,0,0.05);
          width: 90%;
        }
        
        .badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 100px; padding: 12px 28px;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; color: #FFD700; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 40px;
        }
        .headline {
          font-family: 'Outfit', sans-serif; font-size: 80px; font-weight: 900; line-height: 1.1;
          background: linear-gradient(135deg, #FFD700, #FF0080);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 32px;
        }
        .subheadline { font-size: 26px; color: #E2E8F0; line-height: 1.6; font-weight: 500; margin-bottom: 48px; }
        
        .brand-wish {
          padding: 24px 48px; border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,0,128,0.1));
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #fff;
        }
      </style>
      <div class="container">
        <div class="bg-glow-gold"></div><div class="bg-glow-pink"></div>
        <div class="confetti"></div>
        
        <div class="glass-panel">
          <div class="badge">✨ WARM WISHES</div>
          <div class="headline">${escapeHtml(content.headline)}</div>
          <div class="subheadline">${escapeHtml(content.subheadline)}</div>
          <div class="brand-wish">Wishing you success & security from ${config.brand.name}</div>
        </div>
        
        ${brandFooter}
      </div>
    `,
  };

  return templates[category] || templates.cyber_tip;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Create a LinkedIn post image from AI-generated content.
 * Returns the path to the saved PNG file.
 */
export async function createPostImage(content) {
  // Ensure output directory exists
  const outputDir = config.paths.output;
  await fs.mkdir(outputDir, { recursive: true });

  // ─────────────────────────────────────────────────────────────
  // NEW: Read the logo file and convert to Base64 to prevent broken images
  // ─────────────────────────────────────────────────────────────
  const logoPath = path.join(__dirname, 'SancikaTech_Logo_White.png');
  let logoDataUrl = '';

  try {
    const logoBuffer = await fs.readFile(logoPath);
    // Convert buffer to base64 string
    const base64Image = logoBuffer.toString('base64');
    logoDataUrl = `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error(`⚠️ Error loading logo from ${logoPath}:`, error.message);
    // Fallback if logo is missing - simple colored box
    logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }

  // Pass the base64 logo string to the template function
  const html = getTemplate(content, logoDataUrl);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `post_${content.topicCategory}_${timestamp}.png`;
  const outputPath = path.join(outputDir, filename);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1200 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait a bit for fonts to load
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 1200 },
    });

    console.log(`  📸 Image saved: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}