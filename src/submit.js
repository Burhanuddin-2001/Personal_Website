// Web3Forms.
//
// The one thing that cost a commit in v1 and must not be relearned:
// Web3Forms answers 200 OK with { success: false } on failure. Success is
// read from the JSON BODY, never from the HTTP status.
//
// The honeypot field is named `botcheck` and is display:none, so it is
// absent from the accessibility tree. It is never sent onward as content.

import { contactConfig } from './profile.js';

export async function sendMessage(formEl) {
  const data = new FormData(formEl);

  if (data.get('botcheck')) return { ok: true, message: 'Thanks.' }; // silent drop

  if (!contactConfig.endpoint || !contactConfig.accessKey) {
    // No keys configured: fall back to a client-side demo success so the
    // choreography can still be reviewed.
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, message: 'Message logged (demo mode - no endpoint set).' };
  }

  data.append('access_key', contactConfig.accessKey);

  try {
    const res = await fetch(contactConfig.endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    const json = await res.json().catch(() => ({}));
    return json && json.success
      ? { ok: true, message: 'Transmission received.' }
      : { ok: false, message: (json && json.message) || 'Transmission lost. Try again.' };
  } catch {
    return { ok: false, message: 'No signal. Check your connection.' };
  }
}
