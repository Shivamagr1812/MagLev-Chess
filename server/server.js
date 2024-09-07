const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors =require('cors');
const { LOCALHOST_URL, DEPLOYED_URL } = require('./constants');
const Move = require('./utils/move.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server , {
  cors: {
    origin: [LOCALHOST_URL, DEPLOYED_URL],
    methods: ["GET", "POST"]
  }
});

const corsOptions = {
  origin: [LOCALHOST_URL, DEPLOYED_URL, LOCALHOST_URL + '/game-page', DEPLOYED_URL + '/game-page'],
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// display a server running message
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Store game states
const games = {};

io.on('connection', (socket) => {
  console.log('a user connected');
  

                      //M U L T I P L A Y E R 


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
      playersIn : false,
      //PvP stands for Player vs Player. Is will be false if the game is against computer otherwise true
      PvP:true,
      depth:0
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
      games[gameId].lastMoveTime={white: Date.now(), black: Date.now()}
      io.to(gameId).emit('start-game' , gameId)

    }else if(games[gameId] && games[gameId].playerIn){

      console.log('The Game has already started')
      // if a third person tries to enter a pre existing game
      socket.to(gameId).emit('wrong-game' , gameId)

    }else socket.emit('error', 'Invalid game ID')
    //if the gameId does not exist
    })


                          // S I N G L E P L A Y E R


  socket.on('vsComputer-joins' ,(depth)=>{
    const gameId = socket.id
    console.log(`Game Started at id ${gameId} vs Computer`)

    const chess = new Chess()
    games[gameId] = {
      chess:chess,
      timer: { white: 300, black: 300 }, // 5 minutes each
      currentPlayer: 'w',
      lastMoveTime: { white: Date.now(), black: Date.now() }, // Track last move times
      movesHistory: [],
      //this playersIn keeps a track in which of the games both the white and black players are present in case of multiplayer 
      playersIn : true,
      //PvP stands for Player vs Player. Is will be false if the game is against computer otherwise true
      PvP:false,
      depth:depth
    }
    io.to(gameId).emit('vsComputer-start' , gameId)
    //sending the gameId to set in the state in the frontend; was not extremely necessary but still for maintaining the consistency and resusability of code
  })



                            // M O V E  S E N D  C O N T R O L L E R


  // Handle move validation and game status updates
  socket.on('move', async ({ sourceSquare, targetSquare , currentPiece , gameId , flagComputer , promotion , castleMove }) => {
    //castleMove incase the player wants to make a castling move
    //flagComputer is used to distinguish the move of the Computer i.e. Stcokfish from the the move of player.
    //currentPiece moves from sourceSquare to targetSquare

    const game = games[gameId];
    const responseObject = await Move({io , game ,  sourceSquare, targetSquare , currentPiece , gameId , flagComputer , promotion , castleMove })
  });


  socket.on('forfiet-game' , ({gameState , gameId})=>{
    const winner = gameState==='PlayerB'?'White':'Black'
    const forfieted = winner === 'White'?'Black':'White'
    io.to(gameId).emit('forfiet-game' , {winner , forfieted})
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete games[socket.id]
  });
});




server.listen(5000, () => {
  console.log('listening on *:5000');
});