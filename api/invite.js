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
    // Step 1: Check if user already exists in auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

    let authUserId = existingUser?.id;

    if (!existingUser) {
      // New user — send proper invite email via Supabase
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email.trim(),
        {
          redirectTo: appUrl,
          data: { name: clientName, role: 'client', client_id: clientId }
        }
      );
      console.log('Invite result:', JSON.stringify({ data: inviteData?.user?.id, error: inviteError }));
      if (inviteError) {
        return res.status(400).json({ error: inviteError.message });
      }
      authUserId = inviteData?.user?.id;
    } else {
      // Existing user — send a password reset email (this DOES send an email)
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email.trim(),
        options: { redirectTo: appUrl }
      });
      console.log('Recovery link for existing user:', resetError ? resetError.message : 'generated');

      // Actually send it via Supabase's resetPasswordForEmail
      const { error: resetSendError } = await supabaseAdmin.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: appUrl }
      );
      console.log('Reset email send result:', resetSendError ? resetSendError.message : 'sent');
    }

    // Step 2: Always generate a magic link as backup (shown in dashboard)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: existingUser ? 'recovery' : 'invite',
      email: email.trim(),
      options: { redirectTo: appUrl }
    });
    const setupLink = linkData?.properties?.action_link;
    console.log('Setup link:', setupLink ? setupLink.substring(0, 80) + '...' : 'none', linkError?.message);

    // Step 3: Link auth_user_id to client record
    if (authUserId) {
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: authUserId, email: email.trim() })
        .eq('id', clientId);
      console.log('Client link result:', updateError ? updateError.message : 'linked');
    }

    return res.status(200).json({
      success: true,
      isNewUser: !existingUser,
      setupLink: setupLink || null,
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};
