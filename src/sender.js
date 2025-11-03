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
  if (!msg) return alert('Enter a message!');
  let saved = JSON.parse(localStorage.getItem(USER_MSG_KEY)) || [];
  saved.unshift(msg);
  if (saved.length > 10) saved.pop();
  localStorage.setItem(USER_MSG_KEY, JSON.stringify(saved));
  newMessageInput.value = '';
  loadUserMessages();
  alert('Message saved!');
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
profileBtn.addEventListener('click', () => {
  window.location.href = '/profile';
});

// Initial load
loadUserMessages();
