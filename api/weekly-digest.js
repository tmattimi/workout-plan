// Vercel Cron Job — runs every Sunday at 8am ET
// Schedule set in vercel.json: "0 13 * * 0" (1pm UTC = 8am ET)

const { createClient } = require('@supabase/supabase-js');

const COACH_EMAIL = process.env.COACH_EMAIL || 'tara.mattimiro@gmail.com';
const APP_URL = process.env.APP_URL || 'https://workout-plan-ivory-tau.vercel.app';

module.exports = async function handler(req, res) {
  // Allow GET for cron, POST for manual trigger
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.authorization;
  if (req.method === 'GET' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Get all clients
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .order('name');

    if (!clients?.length) return res.status(200).json({ message: 'No clients found' });

    // Get session counts for the past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);

    const clientData = await Promise.all(clients.map(async (client) => {
      // Sessions this week
      const { data: logs } = await supabaseAdmin
        .from('workout_logs')
        .select('session_date')
        .eq('client_id', client.id)
        .gte('session_date', weekAgoStr)
        .eq('completed', true);

      const sessionDates = [...new Set((logs || []).map(l => l.session_date))];
      const sessionsThisWeek = sessionDates.length;

      // Current streak
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const { count } = await supabaseAdmin
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('session_date', key)
          .eq('completed', true);
        if (count > 0) streak++;
        else if (i > 0) break;
      }

      // Flags
      let flag = null;
      if (sessionsThisWeek === 0) flag = 'No sessions this week';
      else if (streak > 0 && (streak + 1) % 4 === 0) flag = 'Deload due';

      return { name: client.name, sessionsThisWeek, streak, flag };
    }));

    // Send digest email
    const emailRes = await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_digest',
        to: COACH_EMAIL,
        data: { clients: clientData },
      }),
    });

    const result = await emailRes.json();
    return res.status(200).json({ success: true, emailResult: result, clientCount: clientData.length });

  } catch (err) {
    console.error('Weekly digest error:', err);
    return res.status(500).json({ error: err.message });
  }
};
