const board = document.getElementById('board');
const playerHeartScore = document.getElementById('playerHalloween');
const playerSmileyScore = document.getElementById('playerCriollo');
const drawScore = document.getElementById('draw');
const notification = document.getElementById('notification');
const gameStatus = document.getElementById('game-status');
const connectionStatus = document.getElementById('connection-status');
const cardReward = document.getElementById('card-reward');
const cardRewardClose = cardReward?.querySelector('.card-reward__close');
const shareRoomButton = document.getElementById('share-room');
const soundToggle = document.getElementById('sound-toggle');
const chatPanel = document.getElementById('chat');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
let currentPlayer = 'heart';
let gameOver = false;
let scoreHeart = 0;
let scoreSmiley = 0;
let scoreDraw = 0;
let myPlayer = null;
let socket = null;
let multiplayer = false;
let rewardTimer = null;
const REWARD_DURATION = 15000;
const VIDEO_COUNT = 4;
const VIDEO_KEY = 'halloween-last-video';
const SOUND_KEY = 'halloween-sound';
const CHAT_MAX_MESSAGES = 30;
const BUBBLE_DURATION = 4000;
const CHAT_NAMES = { heart: '🎃 Halloween', smiley: '🎸 Criollo', spectator: '👻 Espectador' };
const bubbleTimers = {};

// localStorage puede no estar disponible (modo privado, file://); solo se pierde la preferencia
function readStorage(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* preferencia no persistida */ }
}

// Efectos de sonido arcade sintetizados con Web Audio; apagados por defecto
const Sound = (() => {
  let enabled = readStorage(SOUND_KEY) === 'on';
  let ctx = null;

  function context() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, duration, type = 'square', volume = .06) {
    const now = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + .02);
  }

  const patterns = {
    move: player => tone(player === 'heart' ? 440 : 587, 0, .09),
    win: () => [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * .11, .18, 'square', .07)),
    draw: () => {
      tone(330, 0, .16, 'triangle', .08);
      tone(262, .16, .26, 'triangle', .08);
    },
    toggle: () => tone(880, 0, .07, 'triangle', .05),
    chat: () => tone(988, 0, .05, 'triangle', .04)
  };

  return {
    get enabled() { return enabled; },
    setEnabled(value) {
      enabled = value;
      writeStorage(SOUND_KEY, value ? 'on' : 'off');
    },
    play(name, arg) {
      if (!enabled || !context()) return;
      patterns[name](arg);
    }
  };
})();

function renderSoundToggle() {
  if (!soundToggle) return;
  soundToggle.textContent = Sound.enabled ? '🔊' : '🔇';
  soundToggle.setAttribute('aria-pressed', String(Sound.enabled));
  soundToggle.setAttribute('aria-label', Sound.enabled ? 'Desactivar sonido' : 'Activar sonido');
}

soundToggle?.addEventListener('click', () => {
  Sound.setEnabled(!Sound.enabled);
  renderSoundToggle();
  Sound.play('toggle');
});
renderSoundToggle();

function setConnectionStatus(message, waiting = false) {
  if (!connectionStatus) return;
  connectionStatus.textContent = message;
  connectionStatus.classList.toggle('is-waiting', waiting);
}

function getRoomUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('room', getRoomId());
  url.hash = '';
  return url.toString();
}

// navigator.clipboard solo existe en HTTPS/localhost; en HTTP se usa la copia clásica
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  return copied;
}

let shareResetTimer = null;
shareRoomButton?.addEventListener('click', async () => {
  const url = getRoomUrl();
  let copied = false;
  try {
    copied = await copyText(url);
  } catch {
    copied = false;
  }
  if (!copied) {
    window.prompt('Copia este link y compártelo:', url);
    return;
  }
  shareRoomButton.textContent = '¡Link copiado!';
  shareRoomButton.classList.add('is-copied');
  window.clearTimeout(shareResetTimer);
  shareResetTimer = window.setTimeout(() => {
    shareRoomButton.textContent = 'Copiar link de la sala';
    shareRoomButton.classList.remove('is-copied');
  }, 2000);
});

function updateRoomStatus(state) {
  if (!myPlayer) return;
  const roomId = getRoomId();
  if (myPlayer === 'spectator') {
    setConnectionStatus(`Sala ${roomId} · Espectador`);
    return;
  }
  const rival = myPlayer === 'heart' ? 'smiley' : 'heart';
  const me = myPlayer === 'heart' ? 'Halloween' : 'Criollo';
  if (state && !state.players[rival]) {
    setConnectionStatus(`Sala ${roomId} · Eres ${me} · Esperando rival…`, true);
  } else {
    setConnectionStatus(`Sala ${roomId} · Eres ${me} · Rival conectado`);
  }
}

// Chat de la sala estilo DragonBound: registro con el nombre del bando y globo sobre su marcador
function addChatMessage({ from, text }, animate = true) {
  if (!chatLog) return;
  const item = document.createElement('li');
  item.className = `chat__msg chat__msg--${from}`;
  const name = document.createElement('span');
  name.className = 'chat__name';
  name.textContent = `${CHAT_NAMES[from] || CHAT_NAMES.spectator}${from === myPlayer ? ' (tú)' : ''}:`;
  item.append(name, ` ${text}`);
  chatLog.appendChild(item);
  while (chatLog.children.length > CHAT_MAX_MESSAGES) chatLog.firstElementChild.remove();
  chatLog.scrollTop = chatLog.scrollHeight;
  if (!animate) return;
  showChatBubble(from, text);
  if (from !== myPlayer) Sound.play('chat');
}

function showChatBubble(from, text) {
  const score = from === 'heart' ? playerHeartScore : from === 'smiley' ? playerSmileyScore : null;
  const scoreboard = score?.parentElement;
  if (!scoreboard) return;
  // El globo cuelga del marcador y no de la etiqueta, que se reescribe con textContent en cada estado
  let bubble = scoreboard.querySelector(`.chat-bubble--${from}`);
  if (!bubble) {
    bubble = document.createElement('span');
    bubble.className = `chat-bubble chat-bubble--${from}`;
    bubble.setAttribute('aria-hidden', 'true');
    scoreboard.appendChild(bubble);
  }
  bubble.style.left = `${score.offsetLeft + score.offsetWidth / 2}px`;
  bubble.textContent = text;
  bubble.classList.remove('is-visible');
  void bubble.offsetWidth; // reinicia la animación si llega otro mensaje
  bubble.classList.add('is-visible');
  window.clearTimeout(bubbleTimers[from]);
  bubbleTimers[from] = window.setTimeout(() => bubble.classList.remove('is-visible'), BUBBLE_DURATION);
}

function sendChat(text) {
  const message = text.trim();
  if (!message || !socket?.connected) return;
  socket.emit('chat-message', message);
}

chatForm?.addEventListener('submit', event => {
  event.preventDefault();
  sendChat(chatInput.value);
  chatInput.value = '';
});

chatPanel?.querySelectorAll('.chat__emote').forEach(button => {
  button.addEventListener('click', () => sendChat(button.dataset.text));
});

// Enter enfoca el chat desde cualquier parte; Escape lo suelta
document.addEventListener('keydown', event => {
  if (!chatPanel || chatPanel.hidden || !chatInput) return;
  if (event.key === 'Enter' && document.activeElement === document.body) {
    event.preventDefault();
    chatInput.focus();
  } else if (event.key === 'Escape' && document.activeElement === chatInput) {
    chatInput.blur();
  }
});

function showCardReward() {
  if (!cardReward) return;
  window.clearTimeout(rewardTimer);
  cardReward.hidden = false;
  cardRewardClose?.focus();
  rewardTimer = window.setTimeout(hideCardReward, REWARD_DURATION);
}

function hideCardReward() {
  if (!cardReward) return;
  cardReward.hidden = true;
}

cardRewardClose?.addEventListener('click', hideCardReward);
cardReward?.addEventListener('click', event => {
  if (event.target === cardReward) hideCardReward();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') hideCardReward();
});

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room') || 'halloween';
}

function updateGameStatus() {
  // data-turn alimenta la vista previa de la jugada; vacío cuando no se puede jugar
  const canPlay = !gameOver && (!multiplayer || myPlayer === currentPlayer);
  board.dataset.turn = canPlay ? currentPlayer : '';
  if (!gameStatus) return;
  gameStatus.textContent = currentPlayer === 'heart'
    ? 'Turno de 🎃 Halloween'
    : 'Turno de 🎸 Criollo';
}

for (let i = 0; i < 9; i++) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.setAttribute('aria-label', `Casilla ${i + 1}`);
  cell.classList.add('cell');
  cell.dataset.index = i;
  cell.addEventListener('click', handleCellClick);
  board.appendChild(cell);
}

function handleCellClick(event) {
  if (gameOver) return;
  const clickedCell = event.target;
  const index = clickedCell.dataset.index;

  if (multiplayer) {
    if (myPlayer !== currentPlayer) {
      showNotification('No es tu turno');
      return;
    }
    socket.emit('make-move', Number(index));
    return;
  }

  if (isCellEmpty(index)) {
    clickedCell.classList.add(currentPlayer);
    Sound.play('move', currentPlayer);

    const winLine = checkWinner();
    if (winLine) {
      gameOver = true;
      const winner = currentPlayer === 'heart' ? 'Halloween' : 'Criollo';
      updateScore();
      highlightWin(winLine, currentPlayer);
      updateGameStatus();
      Sound.play('win');
      showNotification(`¡Jugador ${winner} ha ganado!`);
      createWinBurst(currentPlayer);         
      showCardReward();
      setTimeout(resetGame, REWARD_DURATION);
      return;
    }

    currentPlayer = currentPlayer === 'heart' ? 'smiley' : 'heart';
    updateGameStatus();

    if (isBoardFull()) {
      gameOver = true;
      updateGameStatus();
      Sound.play('draw');
      showNotification('¡Empate!');
      updateDrawScore();
      setTimeout(resetGame, 1200);
      return;
    }
  }
}

function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove('hidden');
  notification.classList.add('notify-in');
  setTimeout(() => {
    notification.classList.add('notify-out');
  }, 900);
  setTimeout(() => {
    notification.classList.add('hidden');
    notification.classList.remove('notify-in', 'notify-out');
  }, 1600);
}

function isCellEmpty(index) {
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  return !cell.classList.contains('heart') && !cell.classList.contains('smiley');
}

function checkWinner() {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  const cells = document.querySelectorAll('.cell');
  for (const line of lines) {
    const [a, b, c] = line;
    if (
      cells[a].classList.contains(currentPlayer) &&
      cells[b].classList.contains(currentPlayer) &&
      cells[c].classList.contains(currentPlayer)
    ) {
      return line;
    }
  }
  return null;
}

function isBoardFull() {
  const cells = document.querySelectorAll('.cell');
  for (const cell of cells) {
    if (!cell.classList.contains('heart') && !cell.classList.contains('smiley')) {
      return false;
    }
  }
  return true;
}

function updateScore() {
  if (currentPlayer === 'heart') {
    scoreHeart++;
    playerHeartScore.textContent = `🎃Halloween: ${scoreHeart}`;
  } else {
    scoreSmiley++;
    playerSmileyScore.textContent = `🎸Criollo: ${scoreSmiley}`;
  }
}

function updateDrawScore() {
  scoreDraw++;
  drawScore.textContent = `🤝Empate: ${scoreDraw}`;
}

function resetGame() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('heart', 'smiley', 'win', 'win-heart', 'win-smiley');
  });
  clearWinLine();
  currentPlayer = 'heart';
  gameOver = false;
  updateGameStatus();
}

function applyRemoteState(state) {
  const cells = document.querySelectorAll('.cell');
  let newMove = null;
  cells.forEach((cell, index) => {
    const wasEmpty = !cell.classList.contains('heart') && !cell.classList.contains('smiley');
    if (wasEmpty && state.board[index]) newMove = state.board[index];
    cell.classList.remove('heart', 'smiley', 'win', 'win-heart', 'win-smiley');
    if (state.board[index]) cell.classList.add(state.board[index]);
  });
  clearWinLine();
  if (newMove) Sound.play('move', newMove);
  currentPlayer = state.currentPlayer;
  gameOver = state.gameOver;
  scoreHeart = state.scores.heart;
  scoreSmiley = state.scores.smiley;
  scoreDraw = state.scores.draw;
  playerHeartScore.textContent = `🎃Halloween: ${scoreHeart}`;
  playerSmileyScore.textContent = `🎸Criollo: ${scoreSmiley}`;
  drawScore.textContent = `🤝Empate: ${scoreDraw}`;
  updateGameStatus();
  updateRoomStatus(state);
}

function initMultiplayer() {
  if (!window.io || window.location.protocol === 'file:') return;
  // Ruta relativa a la página: funciona en la raíz (/) y detrás de un proxy en subruta (/creole-halloween/)
  const basePath = new URL('.', window.location.href).pathname;
  socket = window.io({ path: `${basePath}socket.io` });
  multiplayer = true;
  setConnectionStatus('Conectando a la partida…');

  socket.on('connect', () => socket.emit('join-game', getRoomId()));
  socket.on('player-assigned', ({ player }) => {
    myPlayer = player;
    if (shareRoomButton) shareRoomButton.hidden = false;
    if (chatPanel) chatPanel.hidden = false;
    updateRoomStatus(null);
    updateGameStatus();
  });
  socket.on('chat-history', messages => {
    if (chatLog) chatLog.replaceChildren();
    messages.forEach(message => addChatMessage(message, false));
  });
  socket.on('chat-message', message => addChatMessage(message));
  socket.on('game-state', state => {
    applyRemoteState(state);
    if (state.result) {
      if (state.result.type === 'win') {
        highlightWin(state.result.line, state.result.player);
        Sound.play('win');
        showNotification(`¡Jugador ${state.result.player === 'heart' ? 'Halloween' : 'Criollo'} ha ganado!`);
        createWinBurst(state.result.player);
        if (state.result.player === myPlayer) {
          showCardReward();
        }
      } else {
        Sound.play('draw');
        showNotification('¡Empate!');
      }
      window.setTimeout(() => socket.emit('reset-game'), REWARD_DURATION);
    }
  });
  socket.on('disconnect', () => {
    if (shareRoomButton) shareRoomButton.hidden = true;
    if (chatPanel) chatPanel.hidden = true;
    setConnectionStatus('Desconectado · modo local pausado');
  });
}

updateGameStatus();
initMultiplayer();

function highlightWin(indices, player) {
  const cells = document.querySelectorAll('.cell');
  indices.forEach(i => {
    cells[i].classList.add('win', player === 'heart' ? 'win-heart' : 'win-smiley');
  });
  drawWinLine(indices, player);
  document.dispatchEvent(new CustomEvent('game:win', { detail: { player } }));
}

// Trazo neón que cruza las tres casillas ganadoras (offset* ignora el scale de .win)
function drawWinLine(indices, player) {
  clearWinLine();
  const cells = document.querySelectorAll('.cell');
  const first = cells[indices[0]];
  const last = cells[indices[indices.length - 1]];
  const center = cell => ({
    x: cell.offsetLeft + cell.offsetWidth / 2,
    y: cell.offsetTop + cell.offsetHeight / 2
  });
  const a = center(first);
  const b = center(last);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const extra = first.offsetWidth * .32;
  const line = document.createElement('span');
  line.className = `win-line win-line--${player}`;
  line.setAttribute('aria-hidden', 'true');
  line.style.left = `${a.x - Math.cos(angle) * extra}px`;
  line.style.top = `${a.y - Math.sin(angle) * extra}px`;
  line.style.width = `${Math.hypot(b.x - a.x, b.y - a.y) + extra * 2}px`;
  line.style.setProperty('--angle', `${angle}rad`);
  board.appendChild(line);
}

function clearWinLine() {
  board.querySelectorAll('.win-line').forEach(line => line.remove());
}

function createWinBurst(player) {
  const emoji = player === 'heart' ? '🎃' : '🎸';
  const burstCount = 14;
  const fragment = document.createDocumentFragment();
  const rect = board.getBoundingClientRect();

  for (let i = 0; i < burstCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'burst';
    piece.textContent = emoji;
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top + rect.height / 2}px`;
    const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.6;
    const dist = 120 + Math.random() * 120;
    piece.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    fragment.appendChild(piece);
  }

  document.body.appendChild(fragment);
  setTimeout(() => {
    document.querySelectorAll('.burst').forEach(b => b.remove());
  }, 1500);
}

// Video de fondo aleatorio sin repetir el de la visita anterior
function initBackgroundVideo() {
  const video = document.getElementById('background-video');
  if (!video) return;
  const last = Number(readStorage(VIDEO_KEY));
  const options = Array.from({ length: VIDEO_COUNT }, (_, i) => i + 1).filter(n => n !== last);
  const pick = options[Math.floor(Math.random() * options.length)];
  writeStorage(VIDEO_KEY, String(pick));
  video.src = `./resources/video0${pick}.mp4`;
  // Si el navegador bloquea el autoplay se queda el fondo oscuro; no es un error
  video.play().catch(() => {});

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else video.play().catch(() => {});
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initBackgroundVideo();
  const overlay = document.querySelector('.keyhole-overlay');
  if (!overlay) return;
  document.body.classList.add('no-scroll');

  const closeIntro = () => {
    overlay.remove();
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', skipIntro);
  };
  const skipIntro = () => overlay.classList.add('is-skipping');

  overlay.addEventListener('animationend', event => {
    if (event.target === overlay) closeIntro();
  });
  overlay.addEventListener('click', skipIntro);
  document.addEventListener('keydown', skipIntro);
});