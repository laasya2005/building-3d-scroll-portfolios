import { Resend } from 'resend';
import { z } from 'zod';

/* Resume request → email to the site owner only. The requester is set as reply-to, so the
   form can never be used to send mail to arbitrary addresses. */

// Set OWNER_EMAIL in your Vercel project env vars; never hardcode it in the repo.
const OWNER = process.env.OWNER_EMAIL ?? '';

const Body = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  email: z.email('Please enter a valid email.').max(200),
  company: z.string().trim().min(1, 'Company is required.').max(150),
  message: z.string().trim().max(1500).optional().default(''),
  /** Honeypot: real users never fill this. */
  website: z.string().optional().default(''),
});

// Best-effort per-instance rate limit (Fluid Compute reuses instances).
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!apiKey || !domain) return json({ error: 'Email is not configured yet.' }, 503);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, 400);
  const { name, email, company, message, website } = parsed.data;

  // Pretend success for bots so they don't retry.
  if (website) return json({ ok: true });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return json({ error: 'Too many requests. Please try again later.' }, 429);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `Portfolio <resume@${domain}>`,
    to: [OWNER],
    replyTo: email,
    subject: `Resume request: ${name} (${company})`,
    text: [`Name: ${name}`, `Email: ${email}`, `Company / role: ${company}`, '', message || '(no message)', '', 'Reply to this email to send your resume.'].join('\n'),
    html: `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0a1020">
        <h2 style="margin:0 0 12px">New resume request</h2>
        <p style="margin:0"><b>Name:</b> ${esc(name)}</p>
        <p style="margin:0"><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
        <p style="margin:0 0 12px"><b>Company / role:</b> ${esc(company)}</p>
        <p style="white-space:pre-wrap;border-left:3px solid #3ee6c9;padding-left:12px">${esc(message || '(no message)')}</p>
        <p style="color:#5f6f92;font-size:13px">Reply to this email to send your resume.</p>
      </div>`,
  });

  if (error) {
    console.error('resend error', error);
    return json({ error: 'Could not send right now.' }, 502);
  }
  return json({ ok: true });
}
