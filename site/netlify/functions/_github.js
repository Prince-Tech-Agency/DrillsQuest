// Shared helper for talking to the GitHub Contents API, and for checking
// that a request came from a logged-in Netlify Identity user.
//
// GITHUB_TOKEN lives ONLY as a Netlify environment variable (Site configuration
// -> Environment variables) — it is never sent to the browser. This is the fix
// for the old dashboard, which had the token hardcoded in client-side JS.

const REPO_OWNER = 'Prince-Tech-Agency';
const REPO_NAME = 'DrillsQuest';
const REPO_BRANCH = 'main';
const GH_ROOT = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };
}

async function ghGetFile(path) {
  const res = await fetch(`${GH_ROOT}/contents/${path}?ref=${REPO_BRANCH}`, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content, sha: data.sha };
}

async function ghPutFile(path, contentString, sha, message) {
  const res = await fetch(`${GH_ROOT}/contents/${path}`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `Update ${path}`,
      content: Buffer.from(contentString, 'utf8').toString('base64'),
      sha,
      branch: REPO_BRANCH,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to save ${path} (${res.status})`);
  }
  return res.json();
}

// Netlify automatically verifies the Identity JWT sent in the Authorization
// header and, if valid, populates context.clientContext.user for us — we
// don't need to verify anything ourselves, just check it's present.
function requireUser(context) {
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    const err = new Error('You must be logged in.');
    err.statusCode = 401;
    throw err;
  }
  return user;
}

module.exports = { GH_ROOT, REPO_BRANCH, ghHeaders, ghGetFile, ghPutFile, requireUser };
