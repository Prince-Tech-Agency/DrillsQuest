const { ghGetFile, requireUser } = require('./_github');

const PRODUCTS_PATH = 'site/content/products.json';

exports.handler = async (event, context) => {
  try {
    requireUser(context);
    const { content } = await ghGetFile(PRODUCTS_PATH);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: content };
  } catch (err) {
    console.error('get-products error:', err);
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
