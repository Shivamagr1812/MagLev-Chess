const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store game states
const games = {};

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Create a new game for each connection (or use room ID)
  const gameId = socket.id;
  const chess = new Chess();
  games[gameId] = {
    chess,
    timer: { white: 300, black: 300 }, // 5 minutes each
    currentPlayer: 'w',
    lastMoveTime: { white: Date.now(), black: Date.now() }, // Track last move times
  };

  // Handle move validation and game status updates
  socket.on('move', ({ sourceSquare, targetSquare }) => {
    const game = games[gameId];
    const { chess, timer, currentPlayer, lastMoveTime } = game;

    // Validate the move
    const move = chess.move({
      from: sourceSquare,
      to: targetSquare,
    });

    if (move) {
      // Calculate time spent on the current move
      const timeSpent = calculateTimeSpent(currentPlayer, lastMoveTime);
      timer[currentPlayer === 'w' ? 'white' : 'black'] -= timeSpent;

      // Update the last move time
      lastMoveTime[currentPlayer === 'w' ? 'white' : 'black'] = Date.now();

      // Switch player
      game.currentPlayer = currentPlayer === 'w' ? 'b' : 'w';

      // Check game status
      const isCheck = chess.in_check();
      const isCheckmate = chess.in_checkmate();
      const isDraw = chess.in_draw();
      const isStalemate = chess.in_stalemate();
      const isInsufficientMaterial = chess.insufficient_material();
      
      // Check if there was an opponent's piece captured
      const capturedPiece = move.captured ? move.captured.toUpperCase() : null;

      // Emit game status
      io.emit('move', {
        move,
        timer,
        isCheck,
        isCheckmate,
        isDraw,
        isStalemate,
        isInsufficientMaterial,
        capturedPiece,
      });

      // If the game is over, end the game
      if (isCheckmate || isDraw || isStalemate || isInsufficientMaterial) {
        socket.emit('game-over', {
          result: isCheckmate ? 'checkmate' : isDraw ? 'draw' : isStalemate ? 'stalemate' : 'insufficient material',
        });
      }
    } else {
      socket.emit('invalid-move', 'Invalid move');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete games[gameId];
  });
});

server.listen(5000, () => {
  console.log('listening on *:5000');
});

// Utility function to calculate time spent by a player
function calculateTimeSpent(player, lastMoveTime) {
  const now = Date.now();
  const opponentColor = player === 'b' ? 'white' : 'black';
  const timeSpent = Math.floor((now - lastMoveTime[opponentColor]) / 1000); // Time spent in seconds
  return timeSpent;
}