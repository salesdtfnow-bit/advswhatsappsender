const sendBtn = document.getElementById('sendBtn');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const presetSelect = document.getElementById('preset');
const newMessageInput = document.getElementById('newMessage');
const saveMessageBtn = document.getElementById('saveMessageBtn');
const profileBtn = document.getElementById('profileBtn');

const username = localStorage.getItem('loggedInUser');
const USER_MSG_KEY = `messages_${username}`;
const DEFAULT_CODE = '44';

if (!username) window.location.href = '/index';

let highlightedDiv = null;

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

  // Populate preset select
  presetSelect.innerHTML = '<option value="">-- Select a message --</option>';
  allMessages.forEach((msg) => {
    const option = document.createElement('option');
    option.value = msg;
    option.textContent = msg;
    presetSelect.appendChild(option);
  });

  // Saved messages container
  const existingContainer = document.querySelector('.saved-messages-container');
  if (existingContainer) existingContainer.remove();

  const container = document.createElement('div');
  container.classList.add('saved-messages-container');

  savedMessages.forEach((msg, i) => {
    const div = document.createElement('div');
    div.className = 'saved-message';
    div.innerHTML = `
      <span class="msg-text">${msg}</span>
      <div>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    container.appendChild(div);

    const span = div.querySelector('.msg-text');

    // Click to select message and highlight
    span.addEventListener('click', () => {
      messageInput.value = msg;

      if (highlightedDiv) highlightedDiv.style.background = '#f1f1f1';
      div.style.background = '#d4f6e3';
      highlightedDiv = div;

      // Update presetSelect to match
      presetSelect.value = msg;
      messageInput.classList.add('filled');
    });

    // Edit button
    div.querySelector('.edit-btn').addEventListener('click', () => {
      newMessageInput.value = msg;
      newMessageInput.focus();
    });

    // Delete button
    div.querySelector('.delete-btn').addEventListener('click', () => {
      savedMessages.splice(i,1);
      localStorage.setItem(USER_MSG_KEY, JSON.stringify(savedMessages));
      loadUserMessages();
      messageInput.value = '';
      if (highlightedDiv) highlightedDiv.style.background = '#f1f1f1';
    });
  });

  document.querySelector('.container').appendChild(container);
}

// Update textarea when preset changes
presetSelect.addEventListener('change', () => {
  messageInput.value = presetSelect.value;
  messageInput.classList.add('filled');

  // Highlight saved message if matches
  const savedDivs = document.querySelectorAll('.saved-message');
  savedDivs.forEach(div => div.style.background = '#f1f1f1');
  savedDivs.forEach(div => {
    if (div.querySelector('.msg-text').textContent === presetSelect.value) {
      div.style.background = '#d4f6e3';
      highlightedDiv = div;
    }
  });
});

// Save new message
saveMessageBtn.addEventListener('click', () => {
  const msg = newMessageInput.value.trim();
  if (!msg) return alert('Enter a message!');
  let saved = JSON.parse(localStorage.getItem(USER_MSG_KEY)) || [];
  saved.unshift(msg);
  if (saved.length > 10) saved.pop();
  localStorage.setItem(USER_MSG_KEY, JSON.stringify(saved));
  newMessageInput.value = '';
  loadUserMessages();
});

// Send WhatsApp
sendBtn.addEventListener('click', () => {
  let phone = phoneInput.value.replace(/\D/g, '');
  if (!phone) return alert('Please enter a phone number!');
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (!phone.startsWith(DEFAULT_CODE)) phone = DEFAULT_CODE + phone;

  const message = encodeURIComponent(messageInput.value.trim());
  const url = `https://wa.me/${phone}${message ? `?text=${message}` : ''}`;
  window.open(url, '_blank');
});

// Profile button
profileBtn.addEventListener('click', () => window.location.href = '/profile');

// Floating label logic
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
  input.addEventListener('input', () => {
    if(input.value) input.classList.add('filled');
    else input.classList.remove('filled');
  });
});

loadUserMessages();
