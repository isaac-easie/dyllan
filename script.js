const STORAGE_KEY = 'dylan-kartel-playlist';
const COMMENTS_KEY = 'dylan-kartel-comments';
const ADMIN_KEY = 'dylan-kartel-admin';
const ADMIN_PASSWORD = 'dylankartel123';
const DEFAULT_ARTWORK = 'https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=800&q=80';

const pageType = document.body.dataset.page || 'public';
const uploadForm = document.getElementById('uploadForm');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');
const uploadFormContainer = document.getElementById('uploadFormContainer');
const adminStatus = document.getElementById('adminStatus');
const uploadMessage = document.getElementById('uploadMessage');
const playlistEl = document.getElementById('playlist');

let tracks = [];
let comments = {};

function loadStoredTracks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (error) {
    console.error('Unable to load playlist from storage:', error);
    return [];
  }
}

function loadStoredComments() {
  try {
    const saved = localStorage.getItem(COMMENTS_KEY);
    if (!saved) return {};
    return JSON.parse(saved);
  } catch (error) {
    console.error('Unable to load comments from storage:', error);
    return {};
  }
}

function saveTracks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch (error) {
    console.error('Unable to save playlist:', error);
  }
}

function saveComments() {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch (error) {
    console.error('Unable to save comments:', error);
  }
}

function getAdminMode() {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

function setAdminMode(value) {
  localStorage.setItem(ADMIN_KEY, value ? 'true' : 'false');
  updateAdminUI();
}

function updateAdminUI() {
  if (!adminStatus || !uploadFormContainer || !loginForm || !uploadMessage) {
    return;
  }

  const isAdmin = getAdminMode();
  adminStatus.classList.toggle('hidden', !isAdmin);
  uploadFormContainer.classList.toggle('hidden', !isAdmin);
  loginForm.classList.toggle('hidden', isAdmin);

  uploadMessage.textContent = isAdmin
    ? 'Welcome back, admin. Upload your latest song below.'
    : 'Only Dylan can upload songs. Fans can scroll, play, and comment.';
}

function createTrackCard(track) {
  const artUrl = track.imageUrl || DEFAULT_ARTWORK;
  const card = document.createElement('article');
  card.className = 'track-card';

  const artwork = document.createElement('div');
  artwork.className = 'track-art';
  artwork.innerHTML = `<img src="${artUrl}" alt="${track.title} artwork" />`;

  const details = document.createElement('div');
  details.className = 'track-details';

  const titleRow = document.createElement('div');
  titleRow.className = 'track-title';
  titleRow.innerHTML = `<strong>${track.title}</strong><span class="track-meta">${track.artist}</span>`;

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.src = track.url || '';

  const commentsSection = document.createElement('div');
  commentsSection.className = 'comments-section';
  commentsSection.innerHTML = `
    <div class="comments-header">
      <h4>Comments</h4>
      <div id="comments-${track.id}" class="comment-list"></div>
    </div>
    <form class="comment-form" data-track-id="${track.id}">
      <div class="comment-row">
        <input class="comment-name" type="text" placeholder="Your name" required />
        <textarea class="comment-text" rows="2" placeholder="Write a comment..." required></textarea>
      </div>
      <button type="submit">Post Comment</button>
    </form>
  `;

  details.appendChild(titleRow);
  details.appendChild(audio);
  details.appendChild(commentsSection);

  card.appendChild(artwork);
  card.appendChild(details);

  return card;
}

function renderComments(trackId) {
  const list = document.getElementById(`comments-${trackId}`);
  if (!list) return;

  const trackComments = comments[trackId] || [];
  list.innerHTML = '';

  if (!trackComments.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No comments yet. Be the first fan to leave one.';
    list.appendChild(empty);
    return;
  }

  trackComments.forEach((comment) => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <p class="comment-text-content">${comment.text}</p>
      <p class="comment-meta">${comment.name} · ${new Date(comment.createdAt).toLocaleString()}</p>
    `;
    list.appendChild(item);
  });
}

function renderPlaylist() {
  if (!playlistEl) return;

  playlistEl.innerHTML = '';

  if (!tracks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No songs yet. Upload one to start the playlist.';
    playlistEl.appendChild(empty);
    return;
  }

  tracks.forEach((track) => {
    playlistEl.appendChild(createTrackCard(track));
  });

  tracks.forEach((track) => renderComments(track.id));
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addTrack(track) {
  tracks.unshift(track);
  saveTracks();
  renderPlaylist();
}

if (uploadForm) {
  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!getAdminMode()) {
      alert('Only admin can upload songs. Please log in first.');
      return;
    }

    const titleInput = document.getElementById('songTitle');
    const artistInput = document.getElementById('songArtist');
    const fileInput = document.getElementById('songFile');
    const imageInput = document.getElementById('songImage');

    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const file = fileInput.files[0];
    const imageUrl = imageInput.value.trim() || DEFAULT_ARTWORK;

    if (!title || !artist || !file) {
      alert('Please complete every field and select an audio file.');
      return;
    }

    const track = {
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      artist,
      imageUrl,
      url: await readFileAsDataURL(file),
      uploadedAt: new Date().toISOString(),
    };

    await addTrack(track);
    uploadForm.reset();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();

    if (password === ADMIN_PASSWORD) {
      setAdminMode(true);
      passwordInput.value = '';
    } else {
      alert('Incorrect admin password. Please try again.');
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    setAdminMode(false);
  });
}

if (playlistEl) {
  playlistEl.addEventListener('submit', (event) => {
    if (!event.target.classList.contains('comment-form')) return;
    event.preventDefault();

    const form = event.target;
    const trackId = form.dataset.trackId;
    const nameInput = form.querySelector('.comment-name');
    const commentInput = form.querySelector('.comment-text');
    const name = nameInput.value.trim();
    const text = commentInput.value.trim();

    if (!name || !text) {
      alert('Please enter your name and a comment.');
      return;
    }

    comments[trackId] = comments[trackId] || [];
    comments[trackId].push({
      name,
      text,
      createdAt: new Date().toISOString(),
    });

    saveComments();
    renderComments(trackId);
    form.reset();
  });
}

function init() {
  tracks = loadStoredTracks();
  comments = loadStoredComments();
  updateAdminUI();
  renderPlaylist();
}

init();
