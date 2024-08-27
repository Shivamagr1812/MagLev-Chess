const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors =require('cors')

const app = express();
const server = http.createServer(app);
const io = socketIo(server , {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const corsOptions = {
  origin: ['http://localhost:3000','http://localhost:3000/game-page'],
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Store game states
const games = {};

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Create a new game for each connection (or use room ID)
  socket.on('white-joins', ()=>{
    const gameId = socket.id
    // White player starts the game, use their socket ID as gameId
    console.log(`Game started with ID: ${gameId}`);

    const chess = new Chess();
    console.log(gameId)
    games[gameId] = {
      chess:chess,
      timer: { white: 300, black: 300 }, // 5 minutes each
      currentPlayer: 'w',
      lastMoveTime: { white: Date.now(), black: Date.now() }, // Track last move times
      movesHistory: [],
      //this playersIn keeps a track in which of the games both the white and black players are present 
      playersIn : false
    };

    // socket.join(gameId)
    // White player joins the room with gameId
    console.log(`White player joined the game with id:${gameId}`)
    io.to(gameId).emit('game-id', gameId)
    // Send the gameId back to White player so it can be shared
  });

  socket.on('black-joins', ({ gameId })=>{
    if (games[gameId] && !games[gameId].playerIn){

      socket.join(gameId)
      games[gameId].playerIn = true
      // Black player joins the room with gameId
      console.log(`Black Player joined game with ID: ${gameId}`)
      io.to(gameId).emit('start-game' , gameId)

    }else if(games[gameId] && games[gameId].playerIn){

      console.log('The Game has already started')
      // if a third person tries to enter a pre existing game
      socket.to(gameId).emit('wrong-game' , gameId)

    }else socket.emit('error', 'Invalid game ID')
    //if the gameId does not exist
    })

  // Handle move validation and game status updates
  socket.on('move', ({ sourceSquare, targetSquare , currentPiece , gameId }) => {
    //currentPiece moves from sourceSquare to targetSquare
    const game = games[gameId];
    const { chess, timer, currentPlayer, lastMoveTime, movesHistory } = game;

    // Validate the move
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
      });
      //this function thorws an error if the move is invalid that crashes the server. So putting up a try-catch block
      
      if (move){
        // Calculate time spent on the current move
        const timeSpent = calculateTimeSpent(currentPlayer, lastMoveTime);
        timer[currentPlayer === 'w' ? 'white' : 'black'] -= timeSpent;
  
        // Update the last move time
        lastMoveTime[currentPlayer === 'w' ? 'white' : 'black'] = Date.now();
  
        //add this move to the moveshistory array
        (game.movesHistory).push(`${move.from}->${move.to}`)

        // Switch player
        game.currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
  
        // Check game status
        const isCheck = chess.inCheck();
        const isCheckmate = chess.isCheckmate();
        const isDraw = chess.isDraw();
        const isStalemate = chess.isStalemate();
        const isInsufficientMaterial = chess.isInsufficientMaterial();
        
        // Check if there was an opponent's piece captured
        const capturedPiece = move.captured ? move.captured.toUpperCase() : null;
  
        // Emit game status
        io.to(gameId).emit('move', {
          move,
          timer,
          isCheck,
          isCheckmate,
          isDraw,
          isStalemate,
          isInsufficientMaterial,
          capturedPiece,
          currentPiece,
          movesHistory,
          currentPlayer
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
    } catch (error) {
      io.to(gameId).emit('move', {
        move:false,
        timer:null,
        isCheck:null,
        isCheckmate:null,
        isDraw:null,
        isStalemate:null,
        isInsufficientMaterial:null,
        capturedPiece:null,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete games[socket.id];
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