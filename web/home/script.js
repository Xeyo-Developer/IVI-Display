const progress = document.getElementById("progress");
const song = document.getElementById("song");
const controlIcon = document.getElementById("controlIcon");
const playPauseButton = document.querySelector(".play-pause-btn");
const forwardButton = document.querySelector(".controls button.forward");
const backwardButton = document.querySelector(".controls button.backward");
const songName = document.querySelector(".now-playing h1");
const artistName = document.querySelector(".now-playing p");
const albumCover = document.querySelector(".placeholder-cover i");
const playlistContainer = document.querySelector(".playlist-items");
const currentTrack = document.querySelector(".current-track");
const totalTracks = document.querySelector(".total-tracks");

let songs = [
  {
    id: 1,
    title: "Unknown",
    name: "Unknown",
    source: "",
    duration: "3:45"
  },
  {
    id: 2,
    title: "Unknown",
    name: "Unknown",
    source: "",
    duration: "4:20"
  },
  {
    id: 3,
    title: "Unknown",
    name: "Unknown",
    source: "",
    duration: "3:15"
  }
];

let currentSongIndex = 0;
let isPlaying = false;
let progressInterval;
let isSettingsModalOpen = false;
let areNotificationsEnabled = true;

// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost:7070/api';
const API_ENDPOINTS = {
  SETTINGS: `${API_BASE_URL}/app/settings`,
  THEMES: `${API_BASE_URL}/app/settings/themes`
};

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function getSettings() {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.SETTINGS);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.settings;
    } else {
      throw new Error(data.error || 'Failed to get settings');
    }
  } catch (error) {
    console.error('[API] Failed to get settings:', error);
    showSystemNotification('Settings Error', 'Cannot load settings from server');
    return null;
  }
}

async function getSetting(key) {
  try {
    const response = await fetchWithTimeout(`${API_ENDPOINTS.SETTINGS}/${key}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.value;
    } else {
      throw new Error(data.error || 'Failed to get setting');
    }
  } catch (error) {
    console.error(`[API] Failed to get setting "${key}":`, error);
    return null;
  }
}

async function updateSetting(key, value) {
  try {
    const response = await fetchWithTimeout(`${API_ENDPOINTS.SETTINGS}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Failed to update setting');
    }
  } catch (error) {
    console.error(`[API] Failed to update setting "${key}":`, error);
    showSystemNotification('Settings Error', `Cannot update ${key}: ${error.message}`);
    return null;
  }
}

async function getAvailableThemes() {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.THEMES);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return {
        themes: data.themes,
        current: data.current
      };
    } else {
      throw new Error('Failed to get themes');
    }
  } catch (error) {
    console.error('[API] Failed to get themes:', error);
    return {
      themes: ['dark', 'orange'],
      current: 'dark'
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupDashboardTiles();
  setupEventListeners();
  loadPlaylist();

  loadAndApplySettings();
});

// ===== SETTINGS FUNCTIONS =====
async function loadAndApplySettings() {
  try {
    const settings = await getSettings();
    if (settings) {
      applyTheme(settings.theme);
      applyFullscreen(settings.fullscreen);
      updateNotificationsSetting(settings.notifications);
    }
  } catch (error) {
    console.warn('[APP] Could not load settings:', error);
  }
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  console.log(`[THEME] Applied theme: ${theme}`);
}

function applyFullscreen(enabled) {
  if (enabled) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error('[FULLSCREEN] Error:', e);
      });
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function updateNotificationsSetting(enabled) {
  areNotificationsEnabled = enabled;
  console.log(`[NOTIFICATIONS] ${enabled ? 'Enabled' : 'Disabled'}`);
}

// ===== SETTINGS MODAL =====
async function showSettingsModal() {
  if (isSettingsModalOpen) {
    return;
  }

  isSettingsModalOpen = true;

  const modal = document.createElement('div');
  modal.className = 'settings-modal';

  const settings = await getSettings();
  const themesData = await getAvailableThemes();

  if (!settings) {
    showSystemNotification('Error', 'Cannot load settings');
    isSettingsModalOpen = false;
    return;
  }

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>System Settings</h2>
        <button class="close-modal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="setting-item">
          <label for="theme-select">
            <i class="fas fa-palette"></i>
            <span>Theme</span>
          </label>
          <select id="theme-select">
            ${themesData.themes.map(theme =>
              `<option value="${theme}" ${settings.theme === theme ? 'selected' : ''}>
                ${theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="setting-item">
          <label for="fullscreen-toggle">
            <i class="fas fa-expand"></i>
            <span>Fullscreen Mode</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="fullscreen-toggle" ${settings.fullscreen ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <label for="notifications-toggle">
            <i class="fas fa-bell"></i>
            <span>Notifications</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="notifications-toggle" ${settings.notifications ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-actions">
          <button class="btn-primary" id="save-settings">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    if (modal.parentNode) {
      document.body.removeChild(modal);
    }
    isSettingsModalOpen = false;
    document.removeEventListener('keydown', handleEscapeKey);
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && isSettingsModalOpen) {
      closeModal();
    }
  };

  modal.querySelector('.close-modal').addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  modal.querySelector('#save-settings').addEventListener('click', async () => {
    const theme = modal.querySelector('#theme-select').value;
    const fullscreen = modal.querySelector('#fullscreen-toggle').checked;
    const notifications = modal.querySelector('#notifications-toggle').checked;

    await updateSetting('theme', theme);
    await updateSetting('fullscreen', fullscreen);
    await updateSetting('notifications', notifications);

    applyTheme(theme);
    applyFullscreen(fullscreen);
    updateNotificationsSetting(notifications);

    showSystemNotification('Settings', 'Settings saved successfully');
    closeModal();
  });

  document.addEventListener('keydown', handleEscapeKey);
}

// ===== INITIALIZATION =====
function initializeApp() {
  song.volume = 0.7;
  progress.value = 70;

  updateSongInfo();
  updateTrackCounter();

  if (songs[currentSongIndex].source) {
    song.src = songs[currentSongIndex].source;
    song.load();
  }

  document.addEventListener('contextmenu', e => {
    if (e.target.closest('.app-container')) {
      e.preventDefault();
    }
  });

  updateNotificationsSetting(true);
}

// ===== DASHBOARD FUNCTIONALITY =====
function setupDashboardTiles() {
  const tiles = document.querySelectorAll('.tile');

  tiles.forEach(tile => {
    tile.addEventListener('click', handleTileClick);
    tile.addEventListener('touchstart', handleTileTouch, { passive: true });
    tile.setAttribute('tabindex', '0');
    tile.addEventListener('keydown', handleTileKeydown);
    tile.style.userSelect = 'none';
    tile.style.webkitUserSelect = 'none';
  });
}

function handleTileClick(e) {
  const tileId = this.id;

  this.style.transform = 'translateY(-2px) scale(0.98)';
  setTimeout(() => {
    this.style.transform = '';
  }, 200);

  executeTileFunction(tileId);
}

function handleTileTouch(e) {
  e.preventDefault();
  const tile = e.currentTarget;
  const tileId = tile.id;

  tile.style.transform = 'translateY(-2px) scale(0.98)';
  setTimeout(() => {
    tile.style.transform = '';
  }, 200);

  executeTileFunction(tileId);
}

function handleTileKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const tileId = this.id;
    executeTileFunction(tileId);
  }
}

function executeTileFunction(tileId) {
  switch(tileId) {
    case 'maps-tile':
      showSystemNotification('Navigation', 'Service not available yet');
      break;

    case 'radio-tile':
      showSystemNotification('Radio', 'Service not available yet');
      break;

    case 'weather-tile':
      showSystemNotification('Weather', 'Service not available yet');
      break;

    case 'settings-tile':
      showSettingsModal();
      break;
  }
}

// ===== MUSIC PLAYER FUNCTIONALITY =====
function setupEventListeners() {
  // Play/Pause
  playPauseButton.addEventListener("click", togglePlayPause);

  // Album cover click
  albumCover.parentElement.addEventListener("click", togglePlayPause);

  // Navigation buttons
  forwardButton.addEventListener("click", playNextSong);
  backwardButton.addEventListener("click", playPreviousSong);

  // Volume control
  progress.addEventListener("input", updateVolume);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);

  // Song events
  song.addEventListener("ended", playNextSong);
  song.addEventListener("loadedmetadata", updateDurationDisplay);
}

function updateSongInfo() {
  const currentSong = songs[currentSongIndex];
  songName.textContent = currentSong.title;
  artistName.textContent = currentSong.name;

  if (isPlaying) {
    albumCover.style.animation = 'spin 4s linear infinite';
  } else {
    albumCover.style.animation = 'none';
  }

  updateActivePlaylistItem();
  updateTrackCounter();
}

function togglePlayPause() {
  if (songs[currentSongIndex].source === "") {
    showSystemNotification('Music', 'No audio source available');
    return;
  }

  if (song.paused) {
    playSong();
  } else {
    pauseSong();
  }
}

function playSong() {
  song.play().then(() => {
    isPlaying = true;
    controlIcon.classList.remove("fa-play");
    controlIcon.classList.add("fa-pause");

    startProgressUpdates();
    updateSongInfo();
    showSystemNotification('Now Playing', songs[currentSongIndex].title);
  }).catch(error => {
    console.error("Playback error:", error);
    showSystemNotification('Playback Error', 'Cannot play audio');
  });
}

function pauseSong() {
  song.pause();
  isPlaying = false;
  controlIcon.classList.remove("fa-pause");
  controlIcon.classList.add("fa-play");

  stopProgressUpdates();
  albumCover.style.animation = 'none';
}

function playNextSong() {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  song.src = songs[currentSongIndex].source;

  if (isPlaying) {
    playSong();
  } else {
    updateSongInfo();
    song.load();
  }
}

function playPreviousSong() {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  song.src = songs[currentSongIndex].source;

  if (isPlaying) {
    playSong();
  } else {
    updateSongInfo();
    song.load();
  }
}

function updateVolume() {
  const volume = this.value / 100;
  song.volume = volume;

  const volumeIcon = document.querySelector('.volume-label i');
  if (volume === 0) {
    volumeIcon.className = 'fas fa-volume-mute';
  } else if (volume < 0.5) {
    volumeIcon.className = 'fas fa-volume-down';
  } else {
    volumeIcon.className = 'fas fa-volume-up';
  }
}

function startProgressUpdates() {
  stopProgressUpdates();
  progressInterval = setInterval(updateProgressBar, 1000);
}

function stopProgressUpdates() {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
}

function updateProgressBar() {
  if (song.duration) {
    const percentage = (song.currentTime / song.duration) * 100;
  }
}

function updateDurationDisplay() {
}

// ===== PLAYLIST FUNCTIONALITY =====
function loadPlaylist() {
  playlistContainer.innerHTML = '';

  songs.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${index === currentSongIndex ? 'active' : ''}`;
    item.innerHTML = `
      <i class="fas fa-music"></i>
      <span>${song.title}</span>
      <span style="margin-left: auto; opacity: 0.6;">${song.duration}</span>
    `;

    item.addEventListener('click', () => {
      selectSongFromPlaylist(index);
    });

    playlistContainer.appendChild(item);
  });
}

function selectSongFromPlaylist(index) {
  currentSongIndex = index;
  song.src = songs[currentSongIndex].source;

  if (isPlaying) {
    playSong();
  } else {
    updateSongInfo();
    song.load();
  }
}

function updateActivePlaylistItem() {
  const items = document.querySelectorAll('.playlist-item');
  items.forEach((item, index) => {
    if (index === currentSongIndex) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateTrackCounter() {
  if (currentTrack && totalTracks) {
    currentTrack.textContent = currentSongIndex + 1;
    totalTracks.textContent = songs.length;
  }
}

// ===== SYSTEM FUNCTIONS =====
function showSystemNotification(title, message) {
  if (!areNotificationsEnabled) {
    console.log(`[NOTIFICATION SKIPPED] ${title}: ${message}`);
    return;
  }

  const notification = document.createElement('div');
  notification.className = 'system-notification';
  notification.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    notification.style.transform = 'translateX(150%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, 3000);
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboardShortcuts(e) {
  if (e.target.matches('input, select, textarea')) return;

  switch(e.key) {
    case ' ':
      e.preventDefault();
      togglePlayPause();
      break;
    case 'ArrowRight':
      e.preventDefault();
      playNextSong();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      playPreviousSong();
      break;
    case 'm':
      e.preventDefault();
      executeTileFunction('maps-tile');
      break;
    case 'r':
      e.preventDefault();
      executeTileFunction('radio-tile');
      break;
    case 'w':
      e.preventDefault();
      executeTileFunction('weather-tile');
      break;
    case 's':
      e.preventDefault();
      showSettingsModal();
      break;
    case 'Escape':
      const modal = document.querySelector('.settings-modal');
      if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
          closeBtn.click();
        }
      }
      break;
  }
}