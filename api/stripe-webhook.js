const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Verify webhook signature
  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const clientId = event.data.object?.metadata?.client_id ||
                   event.data.object?.subscription_details?.metadata?.client_id;

  async function updateClientBilling(clientId, updates) {
    if (!clientId) return;
    await supabase.from('clients').update(updates).eq('id', clientId);
  }

  try {
    switch (event.type) {

      // Payment succeeded — activate client
      case 'checkout.session.completed': {
        const session = event.data.object;
        const cId = session.metadata?.client_id;
        if (cId) {
          await updateClientBilling(cId, {
            billing_status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            billing_started_at: new Date().toISOString(),
            billing_next_renewal: null, // will be set by subscription event
          });
        }
        break;
      }

      // Subscription renewed
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId && clientId) {
          const periodEnd = new Date(invoice.period_end * 1000).toISOString();
          await updateClientBilling(clientId, {
            billing_status: 'active',
            billing_next_renewal: periodEnd,
          });
        }
        break;
      }

      // Payment failed — grace period
      case 'invoice.payment_failed': {
        if (clientId) {
          await updateClientBilling(clientId, { billing_status: 'past_due' });
          // Email coach
          await fetch(`${process.env.APP_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment_failed',
              to: process.env.COACH_EMAIL,
              data: { clientId },
            }),
          }).catch(() => {});
        }
        break;
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        if (clientId) {
          await updateClientBilling(clientId, {
            billing_status: 'cancelled',
            billing_cancelled_at: new Date().toISOString(),
          });
        }
        break;
      }

      // Subscription paused (if using Stripe pause)
      case 'customer.subscription.paused': {
        if (clientId) {
          await updateClientBilling(clientId, { billing_status: 'paused' });
        }
        break;
      }

      case 'customer.subscription.resumed': {
        if (clientId) {
          await updateClientBilling(clientId, { billing_status: 'active' });
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Read raw body for Stripe signature verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
