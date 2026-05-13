// Vercel serverless function — runs on the server, not in the browser
// This keeps the service role key secret
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, clientId, clientName, redirectTo } = req.body;

  if (!email || !clientId) {
    return res.status(400).json({ error: 'Missing email or clientId' });
  }

  // Use service role key (secret — only available server-side)
  const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Use admin inviteUserByEmail — sends a proper invite email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || process.env.REACT_APP_PUBLIC_URL || 'https://workout-plan-ivory-tau.vercel.app/',
      data: { name: clientName, role: 'client', client_id: clientId }
    });

    if (error) {
      console.error('Invite error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Link auth user to client record
    const { error: linkError } = await supabaseAdmin
      .from('clients')
      .update({ auth_user_id: data.user.id, email })
      .eq('id', clientId);

    if (linkError) {
      console.warn('Link error:', linkError.message);
    }

    return res.status(200).json({ 
      success: true, 
      userId: data.user.id,
      emailSent: true 
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};
