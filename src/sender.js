const sendBtn = document.getElementById('sendBtn');
const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phoneError');
const messageInput = document.getElementById('message');
const presetSelect = document.getElementById('preset');
const newMessageInput = document.getElementById('newMessage');
const saveMessageBtn = document.getElementById('saveMessageBtn');
const profileBtn = document.getElementById('profileBtn');
const toastContainer = document.getElementById('toast-container');

const username = localStorage.getItem('loggedInUser');
const USER_MSG_KEY = `messages_${username}`;
const DEFAULT_CODE = '44';

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
  // remove all non-digit characters and leading +
  let digits = value.replace(/[^0-9+]/g, '');
  digits = digits.replace(/^\+/, '');

  // if number starts with 00 (international prefix), remove the leading zeros
  if (digits.startsWith('00')) digits = digits.replace(/^0+/, '');

  // strip any non-digits now
  digits = digits.replace(/\D/g, '');

  // basic length checks
  if (digits.length < 8) return null; // too short
  if (digits.length > 15) return null; // too long / invalid

  // if it looks like a local number (8-10 digits) and doesn't start with DEFAULT_CODE, prepend default
  if (!digits.startsWith(DEFAULT_CODE) && digits.length <= 10) {
    digits = DEFAULT_CODE + digits.replace(/^0+/, '');
  }

  return digits;
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

// Profile button
profileBtn.addEventListener('click', () => {
  window.location.href = 'profile.html';
});

// Initial load
loadUserMessages();
