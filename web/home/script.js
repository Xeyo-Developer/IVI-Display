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

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupDashboardTiles();
  setupEventListeners();
  loadPlaylist();
});

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
      showSystemNotification('Settings', 'Service not available yet');
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
  const notification = document.createElement('div');
  notification.className = 'system-notification';
  notification.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 30px;
    right: 30px;
    background: rgba(28, 22, 37, 0.95);
    color: var(--primary-clr);
    padding: 20px 25px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    transform: translateX(150%);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 250px;
    max-width: 300px;
  `;

  const titleStyle = `
    font-weight: 600;
    margin-bottom: 5px;
    font-size: 1.1rem;
    color: #FF9800;
  `;

  const messageStyle = `
    font-size: 0.9rem;
    opacity: 0.9;
  `;

  notification.querySelector('.notification-title').style.cssText = titleStyle;
  notification.querySelector('.notification-message').style.cssText = messageStyle;

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
      executeTileFunction('settings-tile');
      break;
    case 'Escape':
      const modal = document.querySelector('.settings-modal');
      if (modal) {
        document.body.removeChild(modal);
      }
      break;
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .playlist-item {
    transition: all 0.2s ease;
  }

  button, .tile {
    transition: all 0.2s ease;
  }

  .system-notification {
    animation: slideInRight 0.4s ease;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(150%);
    }
    to {
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);
