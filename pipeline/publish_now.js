#!/usr/bin/env node

/**
 * publish_now.js — Generic campaign publisher
 *
 * Reads platforms/*.json and media_urls.json from a campaign output directory,
 * detects which platforms have API credentials in .env, and publishes.
 *
 * Usage:
 *   node pipeline/publish_now.js <output_dir> [--dry-run]
 *
 * Example:
 *   node pipeline/publish_now.js prj/inema/outputs/pascoa_2026-04-20
 *   node pipeline/publish_now.js prj/inema/outputs/pascoa_2026-04-20 --dry-run
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── Read .env ────────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env');
const envData = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const getEnv = (key) => {
  const match = envData.match(new RegExp(`^${key}=(.*)`, 'm'));
  return match ? match[1].trim() : null;
};

// ── Platform credentials ─────────────────────────────────────────────────────
const CREDENTIALS = {
  instagram: {
    accountId: getEnv('INSTAGRAM_ACCOUNT_ID'),
    accessToken: getEnv('INSTAGRAM_ACCESS_TOKEN'),
    get configured() { return !!(this.accountId && this.accessToken); },
  },
  youtube: {
    clientId: getEnv('YOUTUBE_CLIENT_ID'),
    clientSecret: getEnv('YOUTUBE_CLIENT_SECRET'),
    refreshToken: getEnv('YOUTUBE_REFRESH_TOKEN'),
    get configured() { return !!(this.clientId && this.clientSecret && this.refreshToken); },
  },
  threads: {
    userId: getEnv('THREADS_USER_ID'),
    accessToken: getEnv('THREADS_ACCESS_TOKEN'),
    get configured() { return !!(this.userId && this.accessToken); },
  },
  facebook: {
    pageId: getEnv('FACEBOOK_PAGE_ID'),
    accessToken: getEnv('FACEBOOK_ACCESS_TOKEN'),
    get configured() { return !!(this.pageId && this.accessToken); },
  },
  tiktok: {
    accessToken: getEnv('TIKTOK_ACCESS_TOKEN'),
    get configured() { return !!this.accessToken; },
  },
  linkedin: {
    accessToken: getEnv('LINKEDIN_ACCESS_TOKEN'),
    organizationId: getEnv('LINKEDIN_ORGANIZATION_ID'),
    get configured() { return !!(this.accessToken); },
  },
};

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function postJson(url, payload, headers = {}) {
  const body = JSON.stringify(payload);
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    body,
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Instagram publisher ──────────────────────────────────────────────────────
async function publishInstagram(platformData, mediaUrls) {
  const creds = CREDENTIALS.instagram;
  const results = [];

  // Carousel post
  if (platformData.carousel) {
    const caption = platformData.carousel.caption || '';
    // Find first image URL from media_urls
    const imageUrl = Object.values(mediaUrls).find(url => /\.(png|jpg|jpeg)$/i.test(url));
    if (!imageUrl) { console.log('  No image URL found for Instagram'); return results; }

    console.log('  Creating Instagram container...');
    const containerRes = await postJson(
      `https://graph.facebook.com/v25.0/${creds.accountId}/media`,
      { image_url: imageUrl, caption },
      { Authorization: `Bearer ${creds.accessToken}` }
    );

    if (!containerRes.body.id) {
      console.error('  Container failed:', JSON.stringify(containerRes.body));
      results.push({ type: 'carousel', status: 'failed', error: containerRes.body });
      return results;
    }

    const containerId = containerRes.body.id;
    console.log(`  Container: ${containerId}`);

    // Poll for FINISHED
    for (let i = 1; i <= 5; i++) {
      const statusRes = await fetchJson(
        `https://graph.facebook.com/v25.0/${containerId}?fields=status_code&access_token=${creds.accessToken}`
      );
      if (statusRes.body.status_code === 'FINISHED') break;
      if (statusRes.body.status_code === 'ERROR' || i === 5) {
        results.push({ type: 'carousel', status: 'failed', error: 'Container never reached FINISHED' });
        return results;
      }
      await sleep(60000);
    }

    // Publish
    const publishRes = await postJson(
      `https://graph.facebook.com/v25.0/${creds.accountId}/media_publish`,
      { creation_id: containerId },
      { Authorization: `Bearer ${creds.accessToken}` }
    );

    if (publishRes.body.id) {
      console.log(`  Published! Media ID: ${publishRes.body.id}`);
      results.push({ type: 'carousel', status: 'published', mediaId: publishRes.body.id });
    } else {
      results.push({ type: 'carousel', status: 'failed', error: publishRes.body });
    }
  }

  return results;
}

// ── Threads publisher ────────────────────────────────────────────────────────
async function publishThreads(platformData, mediaUrls) {
  const creds = CREDENTIALS.threads;
  const results = [];

  const posts = platformData.posts || [];
  const mainPost = posts.find(p => p.type === 'main');
  if (!mainPost) { console.log('  No main post found'); return results; }

  // Create container
  const containerPayload = { media_type: 'TEXT', text: mainPost.text, access_token: creds.accessToken };

  // If post has image, attach it
  if (mainPost.image && mainPost.has_image !== false) {
    const imageUrl = Object.values(mediaUrls).find(url => url.includes(mainPost.image));
    if (imageUrl) {
      containerPayload.media_type = 'IMAGE';
      containerPayload.image_url = imageUrl;
    }
  }

  console.log('  Creating Threads container...');
  const containerRes = await postJson(
    `https://graph.threads.net/v1.0/${creds.userId}/threads`,
    containerPayload
  );

  if (!containerRes.body.id) {
    results.push({ type: 'main', status: 'failed', error: containerRes.body });
    return results;
  }

  // Publish
  const publishRes = await postJson(
    `https://graph.threads.net/v1.0/${creds.userId}/threads_publish`,
    { creation_id: containerRes.body.id, access_token: creds.accessToken }
  );

  if (publishRes.body.id) {
    console.log(`  Published! Post ID: ${publishRes.body.id}`);
    results.push({ type: 'main', status: 'published', postId: publishRes.body.id });
  } else {
    results.push({ type: 'main', status: 'failed', error: publishRes.body });
  }

  return results;
}

// ── YouTube publisher ────────────────────────────────────────────────────────
async function publishYouTube(platformData, mediaUrls, outputDir) {
  const creds = CREDENTIALS.youtube;
  const results = [];

  const videos = platformData.videos || [];
  if (videos.length === 0) { console.log('  No videos in youtube.json'); return results; }

  // Refresh access token
  console.log('  Refreshing YouTube token...');
  const tokenRes = await postJson('https://oauth2.googleapis.com/token', {
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
    grant_type: 'refresh_token',
  });

  if (!tokenRes.body.access_token) {
    results.push({ type: 'video', status: 'failed', error: 'Token refresh failed' });
    return results;
  }
  const accessToken = tokenRes.body.access_token;

  for (const video of videos) {
    // Find video file
    const videoFile = video.file || '';
    const videoDir = path.resolve(PROJECT_ROOT, outputDir, 'video');
    let videoPath = null;

    if (fs.existsSync(videoDir)) {
      const candidates = fs.readdirSync(videoDir).filter(f => f.includes(videoFile) && f.endsWith('.mp4'));
      if (candidates.length > 0) videoPath = path.join(videoDir, candidates[0]);
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      console.log(`  Video file not found: ${videoFile}`);
      results.push({ type: 'video', file: videoFile, status: 'failed', error: 'File not found' });
      continue;
    }

    console.log(`  Uploading ${path.basename(videoPath)} (${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(1)} MB)...`);

    const metadata = JSON.stringify({
      snippet: {
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || [],
        categoryId: '22',
      },
      status: { privacyStatus: 'public' },
    });

    const BOUNDARY = '----FormBoundary' + Date.now();
    const videoBuffer = fs.readFileSync(videoPath);
    const metaPart = Buffer.from(`--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`, 'utf-8');
    const videoPart = Buffer.from(`--${BOUNDARY}\r\nContent-Type: video/mp4\r\n\r\n`, 'utf-8');
    const closing = Buffer.from(`\r\n--${BOUNDARY}--\r\n`, 'utf-8');
    const body = Buffer.concat([metaPart, videoPart, videoBuffer, closing]);

    const uploadRes = await new Promise((resolve, reject) => {
      const req = https.request({
        method: 'POST',
        hostname: 'www.googleapis.com',
        path: '/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
          'Content-Length': body.length,
        },
      }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (uploadRes.status === 200 && uploadRes.body.id) {
      console.log(`  Published! https://youtube.com/watch?v=${uploadRes.body.id}`);
      results.push({ type: 'video', file: videoFile, status: 'published', videoId: uploadRes.body.id });
    } else {
      results.push({ type: 'video', file: videoFile, status: 'failed', error: uploadRes.body });
    }
  }

  return results;
}

// ── Facebook publisher (placeholder) ─────────────────────────────────────────
async function publishFacebook(platformData, mediaUrls) {
  // Facebook Graph API uses same SDK as Instagram
  // TODO: implement when FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN are available
  return [{ type: 'feed', status: 'manual', note: 'Facebook publishing not yet implemented' }];
}

// ── TikTok publisher (placeholder) ───────────────────────────────────────────
async function publishTikTok(platformData, mediaUrls) {
  // TikTok Content Posting API requires approved app
  // TODO: implement when TIKTOK_ACCESS_TOKEN is available
  return [{ type: 'video', status: 'manual', note: 'TikTok publishing not yet implemented' }];
}

// ── LinkedIn publisher (placeholder) ─────────────────────────────────────────
async function publishLinkedIn(platformData, mediaUrls) {
  // LinkedIn Marketing API requires approved app
  // TODO: implement when LINKEDIN_ACCESS_TOKEN is available
  return [{ type: 'post', status: 'manual', note: 'LinkedIn publishing not yet implemented' }];
}

// ── Publisher registry ───────────────────────────────────────────────────────
const PUBLISHERS = {
  instagram: publishInstagram,
  youtube: publishYouTube,
  threads: publishThreads,
  facebook: publishFacebook,
  tiktok: publishTikTok,
  linkedin: publishLinkedIn,
};

// ── Publish MD updater ───────────────────────────────────────────────────────
function updatePublishMd(publishMdPath, platform, results) {
  if (!fs.existsSync(publishMdPath)) return;
  let md = fs.readFileSync(publishMdPath, 'utf-8');

  for (const r of results) {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    if (r.status === 'published') {
      const id = r.mediaId || r.postId || r.videoId || '';
      md = md.replace(
        new RegExp(`- \\[ \\] ${label}.*`),
        `- [x] ${label} — Published (ID: ${id})`
      );
    } else if (r.status === 'manual') {
      md = md.replace(
        new RegExp(`- \\[ \\] ${label}.*`),
        `- [~] ${label} — Manual (${r.note || 'no API configured'})`
      );
    } else if (r.status === 'failed') {
      md = md.replace(
        new RegExp(`- \\[ \\] ${label}.*`),
        `- [!] ${label} — Failed (${typeof r.error === 'string' ? r.error : JSON.stringify(r.error).slice(0, 100)})`
      );
    }
  }

  fs.writeFileSync(publishMdPath, md);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function publish(outputDir, dryRun = false) {
  const absOutputDir = path.resolve(PROJECT_ROOT, outputDir);

  // 1. Load media_urls.json
  const mediaUrlsPath = path.join(absOutputDir, 'media_urls.json');
  const mediaUrls = fs.existsSync(mediaUrlsPath)
    ? JSON.parse(fs.readFileSync(mediaUrlsPath, 'utf-8'))
    : {};

  // 2. Discover platform JSONs
  const platformsDir = path.join(absOutputDir, 'platforms');
  if (!fs.existsSync(platformsDir)) {
    console.error('No platforms/ directory found in', outputDir);
    process.exit(1);
  }

  const platformFiles = fs.readdirSync(platformsDir).filter(f => f.endsWith('.json'));
  console.log(`\nFound ${platformFiles.length} platform(s): ${platformFiles.map(f => f.replace('.json', '')).join(', ')}`);

  // 3. Detect configured APIs
  console.log('\nAPI Status:');
  for (const [name, creds] of Object.entries(CREDENTIALS)) {
    console.log(`  ${creds.configured ? '✓' : '✗'} ${name}`);
  }

  // 4. Find Publish MD
  const publishMdFiles = fs.readdirSync(absOutputDir).filter(f => f.startsWith('Publish') && f.endsWith('.md'));
  const publishMdPath = publishMdFiles.length > 0 ? path.join(absOutputDir, publishMdFiles[0]) : null;

  // 5. Publish each platform
  const summary = {};

  for (const file of platformFiles) {
    const platform = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(platformsDir, file), 'utf-8'));
    const publisher = PUBLISHERS[platform];
    const creds = CREDENTIALS[platform];

    console.log(`\n── ${platform.toUpperCase()} ──`);

    if (!publisher) {
      console.log(`  No publisher for ${platform} — skipping`);
      summary[platform] = [{ status: 'manual', note: 'No publisher available' }];
      continue;
    }

    if (!creds || !creds.configured) {
      console.log(`  No API credentials — content available for manual posting`);
      summary[platform] = [{ status: 'manual', note: 'No API credentials in .env' }];
      if (publishMdPath) updatePublishMd(publishMdPath, platform, summary[platform]);
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would publish to ${platform}`);
      summary[platform] = [{ status: 'dry-run' }];
      continue;
    }

    try {
      const results = await publisher(data, mediaUrls, outputDir);
      summary[platform] = results;
      if (publishMdPath) updatePublishMd(publishMdPath, platform, results);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      summary[platform] = [{ status: 'failed', error: err.message }];
      if (publishMdPath) updatePublishMd(publishMdPath, platform, summary[platform]);
    }
  }

  // 6. Summary
  console.log('\n── SUMMARY ──');
  for (const [platform, results] of Object.entries(summary)) {
    const status = results.map(r => r.status).join(', ');
    const ids = results.filter(r => r.mediaId || r.postId || r.videoId)
      .map(r => r.mediaId || r.postId || r.videoId).join(', ');
    console.log(`  ${platform}: ${status}${ids ? ` (${ids})` : ''}`);
  }

  return summary;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const outputDir = args.find(a => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');

  if (!outputDir) {
    console.error('Usage: node pipeline/publish_now.js <output_dir> [--dry-run]');
    process.exit(1);
  }

  publish(outputDir, dryRun).catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
} else {
  // Module mode — used by bot.js or Distribution Agent
  module.exports = { publish, CREDENTIALS };
}
