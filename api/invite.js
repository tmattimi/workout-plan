const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, clientId, clientName, redirectTo } = req.body;
  if (!email || !clientId) {
    return res.status(400).json({ error: 'Missing email or clientId' });
  }

  const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const tempPassword = Math.random().toString(36).slice(2,10) +
                         Math.random().toString(36).slice(2,6).toUpperCase() + "1!";

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: false,
      user_metadata: { name: clientName, role: 'client', client_id: clientId }
    });

    if (createError && !createError.message.includes('already')) {
      return res.status(400).json({ error: createError.message });
    }

    if (!createError) {
      await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: userData.user.id, email: email.trim() })
        .eq('id', clientId);
    }

    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: { redirectTo: redirectTo || 'https://workout-plan-ivory-tau.vercel.app/' }
    });

    const setupLink = linkData?.properties?.action_link;
    await sendInviteEmail(email, clientName, redirectTo, process.env.RESEND_API_KEY, setupLink);

    return res.status(200).json({ success: true, emailSent: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};

async function sendInviteEmail(email, clientName, redirectTo, resendApiKey, setupLink) {
  const appUrl = redirectTo || 'https://workout-plan-ivory-tau.vercel.app/';
  const buttonUrl = setupLink || appUrl;
  const firstName = (clientName || 'there').split(' ')[0];

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #f7f6f3;">
      <div style="background: #111; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #555; margin-bottom: 8px;">You are invited</div>
        <h1 style="color: #f7f6f3; font-size: 24px; font-weight: normal; margin: 0 0 8px;">Your Workout Plan</h1>
        <p style="color: #666; font-size: 13px; margin: 0;">Personalized coaching by Tara Mattimiro</p>
      </div>
      <div style="background: #fff; border-radius: 10px; padding: 28px; margin-bottom: 20px;">
        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 16px;">Hi ${firstName},</p>
        <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0 0 20px;">Your personalized workout plan is ready. Click below to set up your account and access your plan.</p>
        <a href="${buttonUrl}" style="display: block; background: #111; color: #fff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-size: 14px; margin-bottom: 16px;">Set Up Your Account</a>
        <p style="font-size: 11px; color: #aaa; text-align: center; margin: 0;">This link expires in 24 hours.</p>
      </div>
      <p style="font-size: 11px; color: #aaa; text-align: center; margin: 0;">Sent by Tara Mattimiro Fitness</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
    body: JSON.stringify({ from: 'onboarding@resend.dev', to: 'tara.mattimiro@gmail.com', subject: 'Your workout plan is ready', html })
  });

  const result = await response.json();
  console.log('Resend result:', result);
  return result;
}
