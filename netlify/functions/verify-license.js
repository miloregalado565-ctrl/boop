// Server-side proxy for Gumroad's License Verification API.
//
// Flashly Pro is unlocked by checking a Gumroad license key against Gumroad's
// servers. This runs server-side (instead of calling Gumroad directly from
// the browser) so the request isn't blocked by CORS and the product
// permalink isn't just sitting in client-readable code.
//
// IMPORTANT: This is written from Gumroad's documented license-verification
// endpoint (POST https://api.gumroad.com/v2/licenses/verify with
// product_permalink + license_key — no secret/access token required for this
// specific endpoint). Confirm this against Gumroad's current API docs
// (https://app.gumroad.com/api or https://help.gumroad.com) before relying on
// it in production, since API surfaces can change and this could not be
// re-verified live while writing it.
//
// Configure the real product permalink via the GUMROAD_PRODUCT_PERMALINK
// environment variable in your Netlify site settings — do not just edit the
// fallback below and forget to set it, or every buyer's key check will fail.

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';
const PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK || 'flashly-pro';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  }

  let licenseKey;
  try {
    ({ license_key: licenseKey } = JSON.parse(event.body || '{}'));
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Invalid request body' }),
    };
  }

  if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'license_key is required' }),
    };
  }

  try {
    const params = new URLSearchParams({
      product_permalink: PRODUCT_PERMALINK,
      license_key: licenseKey.trim(),
      increment_uses_count: 'false',
    });

    const gumroadRes = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await gumroadRes.json();

    if (!gumroadRes.ok || !data.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: data.message || 'License key not found for this product.',
        }),
      };
    }

    const purchase = data.purchase || {};
    if (purchase.refunded || purchase.chargebacked) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: 'This purchase was refunded or reversed.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        uses: data.uses,
        purchaser_email: purchase.email || null,
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, message: 'Could not reach the license server. Try again.' }),
    };
  }
};
