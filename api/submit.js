// Vercel serverless function: receives Back9 Trades portal form submissions
// and emails them to the dispatch/estimating inbox via the Resend REST API.
// Zero dependencies — uses fetch against https://api.resend.com.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  — Resend API key (re_...)
//   LEAD_INBOX      — where submissions are delivered (default info@back9trades.com)
//   LEAD_FROM       — verified sender, e.g. "Back9 Trades <portal@back9trades.com>"
//                     Until the domain is verified in Resend, use "onboarding@resend.dev"
//                     (Resend only delivers that sender to the account owner's email).

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function buildEmail(p) {
  let subject, rows;
  if (p.kind === 'workorder') {
    subject = `Work Order: ${p.property || 'unspecified'} [${p.priority || 'Routine'}]`;
    rows = [
      ['Name', p.name],
      ['Company / portfolio', p.company],
      ['Email', p.email],
      ['Phone', p.phone],
      ['Property / Unit', p.property],
      ['Priority', p.priority],
      ['Trade', p.trade],
      ['Issue', p.description],
    ];
  } else {
    subject = `Proposal Request: ${p.requestType || 'general'} (${p.company || p.name || 'unknown'})`;
    rows = [
      ['Name', p.name],
      ['Company / portfolio', p.company],
      ['Email', p.email],
      ['Phone', p.phone],
      ['Request type', p.requestType],
      ['Units / properties', p.units],
      ['Scope', p.description],
    ];
  }

  const text = rows
    .filter(([, val]) => val)
    .map(([label, val]) => `${label}: ${val}`)
    .join('\n');

  const html =
    `<h2 style="font-family:Arial,sans-serif;color:#0b2545;margin:0 0 12px;">${esc(subject)}</h2>` +
    `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;">` +
    rows
      .filter(([, val]) => val)
      .map(
        ([label, val]) =>
          `<tr>` +
          `<td style="padding:4px 12px 4px 0;color:#5a6473;vertical-align:top;white-space:nowrap;"><strong>${esc(
            label
          )}</strong></td>` +
          `<td style="padding:4px 0;color:#1a1a1a;white-space:pre-wrap;">${esc(val)}</td>` +
          `</tr>`
      )
      .join('') +
    `</table>`;

  return { subject, text, html };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_INBOX || 'info@back9trades.com';
  const from = process.env.LEAD_FROM || 'Back9 Trades Portal <onboarding@resend.dev>';

  if (!apiKey) {
    return res.status(500).json({ error: 'Email is not configured yet. Please email info@back9trades.com.' });
  }

  // Vercel parses JSON bodies automatically; fall back to manual parse just in case.
  let p = req.body;
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid request.' });
    }
  }
  if (!p || typeof p !== 'object') {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // Honeypot: real users leave this blank. Pretend success to bots.
  if (p.website) {
    return res.status(200).json({ ok: true });
  }

  const kind = p.kind === 'proposal' ? 'proposal' : 'workorder';
  p.kind = kind;

  // Minimal validation mirroring the form's required fields.
  if (!p.name || !p.email || !p.description) {
    return res.status(400).json({ error: 'Missing name, email, or description.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) {
    return res.status(400).json({ error: 'That email address looks invalid.' });
  }

  const { subject, text, html } = buildEmail(p);

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: p.email,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Resend error', resp.status, detail);
      return res.status(502).json({ error: 'Email service rejected the request.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Submit handler error', err);
    return res.status(500).json({ error: 'Could not reach the email service.' });
  }
};
