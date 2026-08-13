const { GH_ROOT, REPO_BRANCH, ghHeaders, requireUser } = require('./_github');

// Repo path (used to talk to GitHub) vs public path (stored in products.json
// and used as a URL by the live site, which is served from the "site" folder
// as its root — so no "site/" prefix belongs in the stored path).
const IMAGES_REPO_PATH = 'site/images/uploads';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const user = requireUser(context);
    const { filename, base64 } = JSON.parse(event.body || '{}');
    if (!filename || !base64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing filename or image data.' }) };
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueName = `${Date.now()}-${safeName}`;
    const repoPath = `${IMAGES_REPO_PATH}/${uniqueName}`;

    const res = await fetch(`${GH_ROOT}/contents/${repoPath}`, {
      method: 'PUT',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Upload image ${repoPath} (${user.email})`,
        content: base64, // client sends raw base64, no "data:image/..." prefix
        branch: REPO_BRANCH,
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to upload image (${res.status})`);
    }

    return { statusCode: 200, body: JSON.stringify({ path: `images/uploads/${uniqueName}` }) };
  } catch (err) {
    console.error('upload-image error:', err);
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
