const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { clientId, clientEmail, clientName, priceId } = req.body;

  if (!clientId || !clientEmail) {
    return res.status(400).json({ error: 'Missing clientId or clientEmail' });
  }

  const APP_URL = process.env.APP_URL || 'https://workout-plan-ivory-tau.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: clientEmail,
      line_items: [{
        price: priceId || process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      metadata: {
        client_id: clientId,
        client_name: clientName || '',
      },
      success_url: `${APP_URL}?payment=success`,
      cancel_url: `${APP_URL}?payment=cancelled`,
      subscription_data: {
        metadata: { client_id: clientId },
        trial_period_days: process.env.TRIAL_DAYS ? parseInt(process.env.TRIAL_DAYS) : 0,
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
