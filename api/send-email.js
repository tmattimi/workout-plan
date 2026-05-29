const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'https://workout-plan-ivory-tau.vercel.app';
const FROM = process.env.EMAIL_FROM || 'Tara Mattimiro Fitness <noreply@tmffitness.com>';

// ── Email templates ───────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f5f5f3; font-family: Georgia, 'Times New Roman', serif; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #fff; border-radius: 10px; padding: 28px 30px; border: 1px solid #e8e8e8; }
    .logo { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #aaa; margin-bottom: 20px; }
    h2 { font-size: 20px; font-weight: normal; color: #111; margin: 0 0 16px; }
    p { font-size: 14px; color: #555; line-height: 1.8; margin: 0 0 14px; }
    .btn { display: inline-block; background: #1a1a1a; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 7px; font-size: 13px; margin-top: 8px; }
    .meta { font-size: 11px; color: #bbb; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0ede8; }
    .bubble { background: #f9f9f7; border-radius: 8px; padding: 14px 16px; margin: 14px 0; font-size: 14px; color: #333; line-height: 1.7; border-left: 3px solid #1a1a1a; }
    .stat { display: inline-block; text-align: center; margin: 0 16px 12px 0; }
    .stat-val { font-size: 28px; font-weight: bold; color: #111; display: block; line-height: 1; }
    .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #bbb; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="logo">Tara Mattimiro Fitness</div>
  <div class="card">
    ${content}
  </div>
  <div style="text-align:center; margin-top:16px; font-size:10px; color:#ccc;">
    You're receiving this because you're a client of Tara Mattimiro Fitness.
  </div>
</div>
</body>
</html>`;
}

const templates = {

  // Coach sends a message to client
  coach_message: ({ clientName, messageText, coachName }) => ({
    subject: `New message from ${coachName || 'Tara'}`,
    html: baseTemplate(`
      <h2>You have a new message</h2>
      <p>Hey ${clientName?.split(' ')[0] || 'there'}, ${coachName || 'Tara'} sent you a note:</p>
      <div class="bubble">${messageText}</div>
      <a href="${APP_URL}" class="btn">View & Reply</a>
      <p class="meta">Open the app and tap Messages to reply.</p>
    `)
  }),

  // Client sends a message — notify coach
  client_message: ({ clientName, messageText, coachEmail }) => ({
    subject: `${clientName} sent you a message`,
    html: baseTemplate(`
      <h2>New message from ${clientName}</h2>
      <div class="bubble">${messageText}</div>
      <a href="${APP_URL}/coach" class="btn">Reply in Dashboard</a>
    `)
  }),

  // Client completes a session — notify coach
  session_logged: ({ clientName, sessionFocus, setsLogged, prsHit, sessionDate }) => ({
    subject: `${clientName} logged a session`,
    html: baseTemplate(`
      <h2>${clientName} completed a workout</h2>
      <p><strong>${sessionFocus || 'Training session'}</strong> &middot; ${new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <div style="margin: 16px 0;">
        <span class="stat"><span class="stat-val">${setsLogged || 0}</span><span class="stat-label">Sets logged</span></span>
        ${prsHit > 0 ? `<span class="stat"><span class="stat-val">${prsHit}</span><span class="stat-label">PRs hit</span></span>` : ''}
      </div>
      <a href="${APP_URL}/coach" class="btn">View in Dashboard</a>
    `)
  }),

  // Weekly digest to coach — sent every Sunday
  weekly_digest: ({ clients }) => {
    const rows = clients.map(c => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f3; font-size: 13px; color: #111;">${c.name}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f3; font-size: 13px; text-align: center; color: ${c.sessionsThisWeek > 0 ? '#111' : '#ccc'};">${c.sessionsThisWeek}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f3; font-size: 13px; text-align: center; color: #555;">${c.streak} day${c.streak !== 1 ? 's' : ''}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f3; font-size: 11px; color: ${c.flag ? '#a02020' : '#bbb'}; text-align: right;">${c.flag || ''}</td>
      </tr>
    `).join('');

    const totalSessions = clients.reduce((s, c) => s + c.sessionsThisWeek, 0);

    return {
      subject: `Weekly client summary — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      html: baseTemplate(`
        <h2>This week</h2>
        <p>${totalSessions} session${totalSessions !== 1 ? 's' : ''} logged across ${clients.length} client${clients.length !== 1 ? 's' : ''}.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
          <tr>
            <th style="text-align:left; font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:#bbb; padding-bottom:8px;">Client</th>
            <th style="font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:#bbb; padding-bottom:8px;">Sessions</th>
            <th style="font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:#bbb; padding-bottom:8px;">Streak</th>
            <th style="font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:#bbb; padding-bottom:8px; text-align:right;">Flag</th>
          </tr>
          ${rows}
        </table>
        <a href="${APP_URL}/coach" class="btn" style="margin-top:20px;">Open Dashboard</a>
      `)
    };
  },

  // New client welcome email
  welcome_client: ({ clientName, setupLink, coachName }) => ({
    subject: `You're invited to ${coachName || 'Tara'}'s coaching app`,
    html: baseTemplate(`
      <h2>Welcome, ${clientName?.split(' ')[0] || 'there'}</h2>
      <p>
        ${coachName || 'Tara'} has set up your personal training program. 
        Tap the button below to create your account and access your plan.
      </p>
      <p>Your program, progress tracking, and direct messaging with ${coachName || 'Tara'} are all in one place.</p>
      <a href="${setupLink}" class="btn">Set Up Your Account</a>
      <p class="meta">This link expires in 24 hours. If you have any issues, reply to this email.</p>
    `)
  }),
};

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, data } = req.body;

  if (!type || !to) return res.status(400).json({ error: 'Missing type or to' });
  if (!templates[type]) return res.status(400).json({ error: `Unknown email type: ${type}` });

  const template = templates[type](data || {});

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject: template.subject,
      html: template.html,
    });
    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: err.message });
  }
};
