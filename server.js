const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.use(express.static(__dirname));

function createGame() {
  return {
    board: Array(9).fill(null),
    currentPlayer: 'heart',
    scores: { heart: 0, smiley: 0, draw: 0 },
    players: { heart: null, smiley: null },
    gameOver: false,
  };
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, createGame());
  return rooms.get(roomId);
}

function getWinner(board, player) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  return lines.find(([a, b, c]) => (
    board[a] === player && board[b] === player && board[c] === player
  )) || null;
}

function publicState(game) {
  return {
    board: game.board,
    currentPlayer: game.currentPlayer,
    scores: game.scores,
    gameOver: game.gameOver,
    players: {
      heart: Boolean(game.players.heart),
      smiley: Boolean(game.players.smiley),
    },
  };
}

function emitState(roomId, event) {
  const game = rooms.get(roomId);
  if (game) io.to(roomId).emit(event || 'game-state', publicState(game));
}

io.on('connection', socket => {
  socket.on('join-game', requestedRoom => {
    const roomId = String(requestedRoom || 'halloween').trim().slice(0, 32) || 'halloween';
    const game = getRoom(roomId);
    const player = !game.players.heart ? 'heart' : !game.players.smiley ? 'smiley' : 'spectator';

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.player = player;
    if (player !== 'spectator') game.players[player] = socket.id;

    socket.emit('player-assigned', { player, roomId });
    emitState(roomId);
  });

  socket.on('make-move', index => {
    const roomId = socket.data.roomId;
    const player = socket.data.player;
    const game = rooms.get(roomId);
    const move = Number(index);

    if (!game || (player !== 'heart' && player !== 'smiley')) return;
    if (game.gameOver || game.currentPlayer !== player || !Number.isInteger(move) || move < 0 || move > 8) return;
    if (game.board[move]) return;

    game.board[move] = player;
    const winLine = getWinner(game.board, player);
    const boardFull = game.board.every(Boolean);
    let result = null;

    if (winLine) {
      game.gameOver = true;
      game.scores[player] += 1;
      result = { type: 'win', player, line: winLine };
    } else if (boardFull) {
      game.gameOver = true;
      game.scores.draw += 1;
      result = { type: 'draw' };
    } else {
      game.currentPlayer = player === 'heart' ? 'smiley' : 'heart';
    }

    io.to(roomId).emit('game-state', { ...publicState(game), result });
  });

  socket.on('reset-game', () => {
    const roomId = socket.data.roomId;
    const game = rooms.get(roomId);
    if (!game || !game.gameOver) return;
    game.board = Array(9).fill(null);
    game.currentPlayer = 'heart';
    game.gameOver = false;
    emitState(roomId);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const game = rooms.get(roomId);
    if (!game) return;
    if (game.players.heart === socket.id) game.players.heart = null;
    if (game.players.smiley === socket.id) game.players.smiley = null;
    emitState(roomId);
    if (!game.players.heart && !game.players.smiley) rooms.delete(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Halloween Criollo disponible en http://localhost:${PORT}`);
});
