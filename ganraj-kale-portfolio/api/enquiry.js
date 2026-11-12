// Vercel Serverless Function: POST /api/enquiry
// Sends the project enquiry to the owner's inbox via Resend. Secrets stay in Vercel env vars.
const TYPES = ['Website Development', 'AI Chatbot', 'AI Agent', 'WhatsApp Automation', 'Email Automation', 'Python Software', 'Business Automation', 'Custom Project'];
const hits = new Map(); // best-effort per-instance rate limit

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, emailConfigured: Boolean(process.env.RESEND_API_KEY) }); // health check: open /api/enquiry in the browser
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'Email service is not configured.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Invalid request.' });
  if (body.website) return res.status(200).json({ ok: true }); // honeypot: silently drop bots

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ ok: false, error: 'Too many enquiries. Please try again in a few minutes.' });

  const f = (k, max) => String(body[k] ?? '').trim().slice(0, max);
  const d = { name: f('name', 100), email: f('email', 200), phone: f('phone', 30), company: f('company', 150), type: f('type', 60), budget: f('budget', 100), deadline: f('deadline', 20), message: f('message', 4000) };

  const errors = [];
  if (d.name.length < 2) errors.push('name');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errors.push('a valid email');
  if (d.phone.replace(/\D/g, '').length < 10) errors.push('a phone/WhatsApp number');
  if (!TYPES.includes(d.type)) errors.push('a project type');
  if (d.message.length < 10) errors.push('a project description');
  if (errors.length) return res.status(400).json({ ok: false, error: 'Please add: ' + errors.join(', ') + '.' });

  recent.push(now);
  hits.set(ip, recent);

  const rows = [['Name', d.name], ['Email', d.email], ['Phone / WhatsApp', d.phone], ['Company', d.company || '-'], ['Project type', d.type], ['Budget', d.budget || '-'], ['Deadline', d.deadline || '-']];
  const html = '<h2>New project enquiry</h2><table cellpadding="6">' + rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('') + `</table><h3>Description</h3><p style="white-space:pre-wrap">${esc(d.message)}</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nDescription:\n' + d.message;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'GK Portfolio <onboarding@resend.dev>',
        to: [process.env.TO_EMAIL || 'ddkale73@gmail.com'],
        reply_to: d.email,
        subject: `New enquiry: ${d.type} - ${d.name}`.replace(/[\r\n]+/g, ' '),
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Could not send the email right now. Please use WhatsApp or try again.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Enquiry error', err);
    return res.status(502).json({ ok: false, error: 'Could not send the email right now. Please use WhatsApp or try again.' });
  }
};
