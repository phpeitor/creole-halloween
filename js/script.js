const board = document.getElementById('board');
const playerHeartScore = document.getElementById('playerHalloween');
const playerSmileyScore = document.getElementById('playerCriollo');
const drawScore = document.getElementById('draw');
const notification = document.getElementById('notification');
let currentPlayer = 'heart';
let gameOver = false;
let scoreHeart = 0;
let scoreSmiley = 0;
let scoreDraw = 0;

for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  cell.addEventListener('click', handleCellClick);
  board.appendChild(cell);
}

function handleCellClick(event) {
  if (gameOver) return;
  const clickedCell = event.target;
  const index = clickedCell.dataset.index;

  if (isCellEmpty(index)) {
    clickedCell.classList.add(currentPlayer);

    const winLine = checkWinner();
    if (winLine) {
      gameOver = true;
      const winner = currentPlayer === 'heart' ? 'Halloween' : 'Criollo';
      updateScore();
      highlightWin(winLine, currentPlayer);   
      showNotification(`¡Jugador ${winner} ha ganado!`);
      createWinBurst(currentPlayer);         
      setTimeout(resetGame, 1800);            
      return;
    }

    currentPlayer = currentPlayer === 'heart' ? 'smiley' : 'heart';

    if (isBoardFull()) {
      gameOver = true;
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
  currentPlayer = 'heart';
  gameOver = false;
}

function highlightWin(indices, player) {
  const cells = document.querySelectorAll('.cell');
  indices.forEach(i => {
    cells[i].classList.add('win', player === 'heart' ? 'win-heart' : 'win-smiley');
  });
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