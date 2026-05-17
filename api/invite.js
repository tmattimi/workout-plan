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

    // Use Supabase's built-in invite email — works for any address, no domain needed
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        redirectTo: redirectTo || 'https://workout-plan-ivory-tau.vercel.app/',
        data: { name: clientName, role: 'client', client_id: clientId }
      }
    );

    console.error('inviteUserByEmail error:', JSON.stringify(inviteError));

    // Get the auth user ID — from invite or existing user lookup
    let authUserId = inviteData?.user?.id;

    if (!authUserId) {
      // User already exists — look them up by email
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users?.find(u => u.email === email.trim());
      if (existing) authUserId = existing.id;
    }

    // Always link the auth user to the client record
    if (authUserId) {
      await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: authUserId, email: email.trim() })
        .eq('id', clientId);
    }

    // Generate a magic link regardless — useful if invite email wasn't sent
    // or if user already exists
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim(),
      options: { redirectTo: redirectTo || 'https://workout-plan-ivory-tau.vercel.app/' }
    });

    const setupLink = linkData?.properties?.action_link;
    console.log('Setup link generated:', setupLink ? 'yes' : 'no');

    return res.status(200).json({ 
      success: true, 
      emailSent: !inviteError,
      setupLink: setupLink || null
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};

