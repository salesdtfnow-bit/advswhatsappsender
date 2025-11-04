const sendBtn = document.getElementById('sendBtn');
const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phoneError');
const messageInput = document.getElementById('message');
const presetSelect = document.getElementById('preset');
const newMessageInput = document.getElementById('newMessage');
const saveMessageBtn = document.getElementById('saveMessageBtn');
const profileBtn = document.getElementById('profileBtn');
const toastContainer = document.getElementById('toast-container');
const countrySelect = document.getElementById('countrySelect');

const username = localStorage.getItem('loggedInUser');
const USER_MSG_KEY = `messages_${username}`;
const DEFAULT_CODE = '44';

// Basic country codes list used for detection (no external library)
// Keep codes as strings; longer codes should be checked first to avoid prefix collisions
const KNOWN_COUNTRY_CODES = [
  '91','61','55','44','49','33','27','1'
];

if (!username) window.location.href = 'index.html';

let highlightedDiv = null;

// Load messages and display saved custom messages
function loadUserMessages() {
  const savedMessages = JSON.parse(localStorage.getItem(USER_MSG_KEY)) || [];
  const defaultMessages = [
    "Hi! We noticed you forgot to upload your design file. Could you please send it so we can proceed?",
    "Hello! The file you uploaded is low resolution and may affect print quality. Can you provide a higher quality version?",
    "Hi, your design exceeds the maximum print area. Could you adjust it?",
    "Hello! Your artwork contains unsupported colors. Please revise it for better print accuracy.",
    "Hi! Your design is missing layers. Please update the file."
  ];

  const allMessages = [...defaultMessages, ...savedMessages];

  // Populate preset select dropdown
  presetSelect.innerHTML = '<option value="">-- Select a message --</option>';
  allMessages.forEach(msg => {
    const option = document.createElement('option');
    option.value = msg;
    option.textContent = msg;
    presetSelect.appendChild(option);
  });

  // Remove old saved messages container if exists
  const oldContainer = document.querySelector('.saved-messages-list');
  if (oldContainer) oldContainer.remove();

  // Container for editable messages
  const container = document.createElement('div');
  container.className = 'saved-messages-list';
  container.style.marginTop = '1rem';

  savedMessages.forEach((msg, i) => {
    const div = document.createElement('div');
    div.className = 'saved-message';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '5px';
    div.style.background = '#f1f1f1';
    div.style.padding = '5px 10px';
    div.style.borderRadius = '6px';

    const span = document.createElement('span');
    span.textContent = msg;
    span.style.cursor = 'pointer';
    span.style.flex = '1';

    span.addEventListener('click', () => {
      messageInput.value = msg;
      messageInput.classList.add('filled');

      if (highlightedDiv) highlightedDiv.style.background = '#f1f1f1';
      div.style.background = '#d4f6e3';
      highlightedDiv = div;

      presetSelect.value = msg;
    });

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '5px';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.background = '#ffc107';
    editBtn.style.padding = '3px 6px';
    editBtn.style.borderRadius = '4px';
    editBtn.style.border = 'none';
    editBtn.style.cursor = 'pointer';
    editBtn.addEventListener('click', () => {
      newMessageInput.value = msg;
      newMessageInput.focus();
    });

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.background = '#dc3545';
    delBtn.style.padding = '3px 6px';
    delBtn.style.borderRadius = '4px';
    delBtn.style.border = 'none';
    delBtn.style.cursor = 'pointer';
    delBtn.style.color = 'white';
    delBtn.addEventListener('click', () => {
      savedMessages.splice(i, 1);
      localStorage.setItem(USER_MSG_KEY, JSON.stringify(savedMessages));
      loadUserMessages();
      if (highlightedDiv) highlightedDiv.style.background = '#f1f1f1';
      highlightedDiv = null;
      messageInput.value = '';
    });

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(delBtn);

    div.appendChild(span);
    div.appendChild(btnGroup);
    container.appendChild(div);
  });

  document.querySelector('.container').appendChild(container);
}

// Dropdown preset select
presetSelect.addEventListener('change', () => {
  messageInput.value = presetSelect.value;
  messageInput.classList.add('filled');
  const divs = document.querySelectorAll('.saved-message');
  divs.forEach(d => d.style.background = '#f1f1f1');
  divs.forEach(d => {
    if (d.querySelector('span').textContent === presetSelect.value) {
      d.style.background = '#d4f6e3';
      highlightedDiv = d;
    }
  });
});

// Save new custom message
saveMessageBtn.addEventListener('click', () => {
  const msg = newMessageInput.value.trim();
  if (!msg) {
    showToast('Enter a message to save', 'error');
    newMessageInput.focus();
    return;
  }
  let saved = JSON.parse(localStorage.getItem(USER_MSG_KEY)) || [];
  saved.unshift(msg);
  if (saved.length > 10) saved.pop();
  localStorage.setItem(USER_MSG_KEY, JSON.stringify(saved));
  newMessageInput.value = '';
  loadUserMessages();
  showToast('Message saved', 'success');
});

// Send WhatsApp
// small helper: show toast
function showToast(text, type = 'success', timeout = 3500) {
  if (!toastContainer) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = text;
  toastContainer.appendChild(t);
  const id = setTimeout(() => {
    t.style.animation = 'toast-out 160ms ease forwards';
    setTimeout(() => t.remove(), 180);
    clearTimeout(id);
  }, timeout);
}

// phone formatter / validator
function formatPhoneToE164(value) {
  if (!value) return null;
  // remove whitespace and keep leading + if present
  let raw = (value || '').trim();
  raw = raw.replace(/\s+/g, '');

  // If user included a leading + or 00, treat as full international number and try to use as-is
  if (raw.startsWith('+') || raw.startsWith('00')) {
    let digits = raw.replace(/^\+/, '').replace(/^00+/, '');
    digits = digits.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return null;
    return digits;
  }

  // otherwise assume local-ish number: strip non-digits and leading zeros then prepend selected country code
  let digits = raw.replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;
  // if digits already include a known country prefix, accept it
  for (const code of KNOWN_COUNTRY_CODES) {
    if (digits.startsWith(code) && digits.length > code.length) {
      if (digits.length >= 8 && digits.length <= 15) return digits;
    }
  }

  // fallback: use selected countrySelect value or DEFAULT_CODE
  const cc = (countrySelect && countrySelect.value) ? countrySelect.value : DEFAULT_CODE;
  const combined = `${cc}${digits}`;
  if (combined.length < 8 || combined.length > 15) return null;
  return combined;
}

// detect a country code from a digits-only string. Returns code or null.
function detectCountryFromDigits(digitsOnly) {
  if (!digitsOnly) return null;
  const digits = digitsOnly.replace(/\D/g, '');
  // check longer codes first
  const sorted = KNOWN_COUNTRY_CODES.slice().sort((a,b) => b.length - a.length);
  for (const code of sorted) {
    if (digits.startsWith(code)) return code;
  }
  return null;
}

// clear error
function setPhoneError(msg) {
  if (!phoneError) return;
  phoneError.textContent = msg || '';
}

sendBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setPhoneError('');
  const raw = (phoneInput.value || '').trim();
  const formatted = formatPhoneToE164(raw);
  if (!raw) {
    setPhoneError('Please enter a phone number');
    showToast('Please enter a phone number', 'error');
    phoneInput.focus();
    return;
  }
  if (!formatted) {
    setPhoneError('Invalid phone number. Include country code if needed.');
    showToast('Invalid phone number', 'error');
    phoneInput.focus();
    return;
  }

  const message = encodeURIComponent(messageInput.value.trim());
  const url = `https://wa.me/${formatted}${message ? `?text=${message}` : ''}`;
  try {
    window.open(url, '_blank');
    showToast('Opening WhatsApp...', 'success');
  } catch (err) {
    showToast('Unable to open WhatsApp', 'error');
  }
});

// Auto-detect country when user types an international prefix (+ or 00)
if (phoneInput && countrySelect) {
  phoneInput.addEventListener('input', (e) => {
    const v = (e.target.value || '').trim();
    if (!v) return;
    let normalized = v.replace(/[^0-9+]/g, '');
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    else if (normalized.startsWith('00')) normalized = normalized.replace(/^00+/, '');
    else return; // only attempt detection when user types international prefixes

    const detected = detectCountryFromDigits(normalized);
    if (detected) {
      // set dropdown to detected country
      countrySelect.value = detected;
      // remove detected prefix from the phone field to show local portion
      const remainder = normalized.slice(detected.length).replace(/^0+/, '');
      phoneInput.value = remainder;
    }
  });
}

// Profile button
profileBtn.addEventListener('click', () => {
  window.location.href = 'profile.html';
});

// Initial load
loadUserMessages();
// ensure countrySelect defaults to DEFAULT_CODE if present
if (countrySelect) {
  countrySelect.value = DEFAULT_CODE;
}
