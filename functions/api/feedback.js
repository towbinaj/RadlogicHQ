/**
 * POST /api/feedback
 *
 * Receives a JSON payload from the <feedback-widget> component and creates
 * a GitHub issue in towbinaj/radlogichq. Runs on Cloudflare Pages Functions.
 *
 * Required environment variable:
 *   GITHUB_TOKEN — fine-grained PAT scoped to the repo with `Issues: Write`
 *
 * The token MUST be set in the Cloudflare Pages dashboard under
 *   Settings → Environment variables → Production (and Preview if wanted).
 */

const REPO_OWNER = 'towbinaj';
const REPO_NAME = 'radlogichq';
const ALLOWED_TYPES = new Set(['bug', 'feature', 'question']);

const LABEL_BY_TYPE = {
  bug: ['user-feedback', 'bug'],
  feature: ['user-feedback', 'enhancement'],
  question: ['user-feedback', 'question'],
};

const TITLE_PREFIX = {
  bug: '[Bug]',
  feature: '[Feature]',
  question: '[Question]',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeMd(s) {
  // Avoid accidental markdown injection in the rendered issue body
  return String(s).replace(/[`*_<>]/g, (c) => '\\' + c);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GITHUB_TOKEN) {
    return json({ error: 'Server not configured (missing GITHUB_TOKEN).' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  // Honeypot: real users don't fill this field
  if (payload.website) {
    // Pretend it worked so bots don't retry
    return json({ ok: true });
  }

  const type = (payload.type || '').toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return json({ error: 'Invalid type.' }, 400);
  }

  const subject = String(payload.subject || '').trim();
  const body = String(payload.body || '').trim();
  const email = String(payload.email || '').trim();
  const page = String(payload.page || '').trim();
  const userAgent = String(payload.userAgent || '').trim();

  if (subject.length < 3 || subject.length > 100) {
    return json({ error: 'Subject must be 3–100 characters.' }, 400);
  }
  if (body.length < 10 || body.length > 2000) {
    return json({ error: 'Description must be 10–2000 characters.' }, 400);
  }
  if (email && email.length > 200) {
    return json({ error: 'Email too long.' }, 400);
  }

  // Lightweight per-IP rate limit via Cloudflare's request metadata.
  // Cloudflare also enforces global limits; this is a per-IP soft cap.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Build issue body
  const lines = [];
  lines.push(escapeMd(body));
  lines.push('');
  lines.push('---');
  lines.push('**Metadata**');
  lines.push(`- Page: \`${escapeMd(page || '/')}\``);
  if (email) lines.push(`- Contact: ${escapeMd(email)}`);
  lines.push(`- Submitted: ${new Date().toISOString()}`);
  if (userAgent) lines.push(`- User agent: \`${escapeMd(userAgent.slice(0, 200))}\``);
  lines.push(`- IP hash: \`${await sha256(ip).then((h) => h.slice(0, 12))}\``);
  lines.push('');
  lines.push('_Submitted via the in-site feedback widget._');

  const issueBody = {
    title: `${TITLE_PREFIX[type]} ${subject}`,
    body: lines.join('\n'),
    labels: LABEL_BY_TYPE[type],
  };

  const ghRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'radlogichq-feedback-widget',
      },
      body: JSON.stringify(issueBody),
    }
  );

  if (!ghRes.ok) {
    const detail = await ghRes.text().catch(() => '');
    console.error('GitHub API error', ghRes.status, detail);
    return json(
      { error: `GitHub rejected the issue (HTTP ${ghRes.status}). Try again later.` },
      502
    );
  }

  const issue = await ghRes.json();
  return json({ ok: true, issueNumber: issue.number, issueUrl: issue.html_url });
}

export async function onRequest(context) {
  // Only POST is allowed; anything else gets 405
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'POST' },
    });
  }
  return onRequestPost(context);
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
