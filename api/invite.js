const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, clientId, clientName, redirectTo } = req.body;
  if (!email || !clientId) {
    return res.status(400).json({ error: 'Missing email or clientId' });
  }

  const appUrl = redirectTo || 'https://workout-plan-ivory-tau.vercel.app/';

  const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Check if user already exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    let authUserId = existingUser?.id;

    // Create user if doesn't exist (without sending email)
    if (!existingUser) {
      const tempPassword = Math.random().toString(36).slice(2,10) +
                           Math.random().toString(36).slice(2,6).toUpperCase() + '1!';
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: clientName, role: 'client', client_id: clientId }
      });
      if (createError) {
        console.error('Create user error:', createError.message);
        return res.status(400).json({ error: createError.message });
      }
      authUserId = newUser?.user?.id;
      console.log('Created user:', authUserId);
    }

    // Link to client record
    if (authUserId) {
      await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: authUserId, email: email.trim() })
        .eq('id', clientId);
    }

    // Generate a magic link — this is what the client uses to log in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim(),
      options: { redirectTo: appUrl }
    });

    const setupLink = linkData?.properties?.action_link;
    console.log('Magic link generated:', setupLink ? 'yes' : 'no', linkError?.message);

    // Try to send via Supabase invite (may fail due to rate limits — that's ok)
    let emailSent = false;
    try {
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email.trim(),
        { redirectTo: appUrl, data: { name: clientName, role: 'client', client_id: clientId } }
      );
      emailSent = !inviteError;
      if (inviteError) console.log('Invite email failed (ok):', inviteError.message);
      else console.log('Invite email sent successfully');
    } catch (e) {
      console.log('Invite email exception (ok):', e.message);
    }

    return res.status(200).json({
      success: true,
      emailSent,
      setupLink: setupLink || null,
    });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
