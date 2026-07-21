// ContactForm — the focus of the Contact section (no marketing copy).
// Fields: Name, Purpose, Your Contact Information, Message. Submit: "Ping Me".
// Submits to a third-party endpoint (Formspree/Web3Forms) via fetch; falls
// back to a client-side demo success when no endpoint is configured.

import { el } from '../../lib/dom.js';
import { announce } from '../../lib/announcer.js';

/**
 * @param {{ endpoint: string }} config
 * @returns {HTMLFormElement}
 */
export function createContactForm({ endpoint }) {
  const status = el('p', {
    class: 'form__status',
    role: 'status',
    'aria-live': 'polite',
  });

  const submitBtn = el('button', {
    class: 'btn btn--primary form__submit',
    type: 'submit',
    html: '<span class="btn__label">Ping Me</span>',
  });

  const form = el(
    'form',
    { class: 'form', novalidate: true },
    [
      field({ id: 'cf-name', name: 'name', label: 'Name', autocomplete: 'name' }),
      field({ id: 'cf-purpose', name: 'purpose', label: 'Purpose', autocomplete: 'off' }),
      field({
        id: 'cf-contact',
        name: 'contact',
        label: 'Your Contact Information',
        autocomplete: 'email',
        inputmode: 'email',
        hint: 'Email or phone so I can reach you back.',
      }),
      field({ id: 'cf-message', name: 'message', label: 'Message', multiline: true }),
      // Honeypot — Web3Forms' reserved spam field is specifically named
      // "botcheck" (a hidden boolean field, per their docs). It's hidden with
      // display:none (see .form__honeypot in Contact.css), not the
      // visually-hidden/clip utility, so it's also absent from the
      // accessibility tree — a screen-reader user should never be able to
      // focus or fill it.
      el('input', {
        type: 'checkbox',
        name: 'botcheck',
        class: 'form__honeypot',
        tabindex: '-1',
        autocomplete: 'off',
      }),
      submitBtn,
      status,
    ]
  );

  form.addEventListener('submit', (e) => handleSubmit(e, { form, endpoint, submitBtn, status }));
  return form;
}

/** Build a labelled field (input or textarea) with error slot. */
function field({ id, name, label, multiline = false, autocomplete, inputmode, hint }) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : null;
  const describedBy = [hintId].filter(Boolean).join(' ') || null;

  const control = multiline
    ? el('textarea', {
        id,
        name,
        class: 'form__control',
        rows: 5,
        required: true,
        'aria-required': 'true',
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })
    : el('input', {
        id,
        name,
        type: 'text',
        class: 'form__control',
        required: true,
        'aria-required': 'true',
        ...(autocomplete ? { autocomplete } : {}),
        ...(inputmode ? { inputmode } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      });

  return el('div', { class: 'form__field' }, [
    el('label', { class: 'form__label', for: id, html: label }),
    hint ? el('span', { id: hintId, class: 'form__hint', html: hint }) : null,
    control,
    el('span', { id: errorId, class: 'form__error', 'aria-live': 'polite' }),
  ]);
}

async function handleSubmit(e, { form, endpoint, submitBtn, status }) {
  e.preventDefault();
  clearErrors(form);
  status.textContent = '';
  status.className = 'form__status';

  if (!validate(form)) {
    status.textContent = 'Please fix the highlighted fields.';
    status.classList.add('form__status--error');
    announce('The form has errors. Please review the highlighted fields.');
    return;
  }

  setLoading(submitBtn, true);

  try {
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      // Web3Forms can answer 200 OK with { success: false, message } for
      // some rejections — HTTP status alone isn't a reliable success signal.
      // Guard the JSON parse in case of a network-level failure body.
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        /* non-JSON response — fall through to the ok/success check below */
      }

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || `Request failed: ${res.status}`);
      }
    } else {
      // No endpoint configured — demo mode.
      await new Promise((r) => setTimeout(r, 500));
    }

    form.reset();
    const msg = 'Thanks — your message has been sent.';
    status.textContent = msg;
    status.classList.add('form__status--success');
    announce(msg);
  } catch (err) {
    const msg = 'Something went wrong. Please try again or email me directly.';
    status.textContent = msg;
    status.classList.add('form__status--error');
    announce(msg);
  } finally {
    setLoading(submitBtn, false);
  }
}

function validate(form) {
  let ok = true;
  form.querySelectorAll('.form__control').forEach((control) => {
    const value = control.value.trim();
    if (!value) {
      showError(control, `${labelFor(control)} is required.`);
      ok = false;
    }
  });
  return ok;
}

function labelFor(control) {
  return control.closest('.form__field')?.querySelector('.form__label')?.textContent || 'This field';
}

function showError(control, message) {
  control.setAttribute('aria-invalid', 'true');
  const error = control.closest('.form__field')?.querySelector('.form__error');
  if (error) {
    error.textContent = message;
    control.setAttribute('aria-describedby', joinIds(control.getAttribute('aria-describedby'), error.id));
  }
}

function clearErrors(form) {
  form.querySelectorAll('.form__control').forEach((control) => {
    control.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('.form__error').forEach((e) => (e.textContent = ''));
}

function joinIds(existing, id) {
  const set = new Set((existing || '').split(/\s+/).filter(Boolean));
  set.add(id);
  return [...set].join(' ');
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.setAttribute('aria-busy', loading ? 'true' : 'false');
  btn.querySelector('.btn__label').textContent = loading ? 'Sending…' : 'Ping Me';
}
