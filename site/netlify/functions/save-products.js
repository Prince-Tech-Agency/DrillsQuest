const { ghGetFile, ghPutFile, requireUser } = require('./_github');

const PRODUCTS_PATH = 'site/content/products.json';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const user = requireUser(context);
    const { products } = JSON.parse(event.body || '{}');
    if (!Array.isArray(products)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing products array.' }) };
    }

    // Always fetch the latest sha right before writing, so the dashboard never
    // has to track it itself and stale-sha conflicts are avoided.
    const { sha } = await ghGetFile(PRODUCTS_PATH);
    const newContent = JSON.stringify({ products }, null, 2);
    await ghPutFile(PRODUCTS_PATH, newContent, sha, `Update products via dashboard (${user.email})`);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('save-products error:', err);
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
