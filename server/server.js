const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors =require('cors');
const calculateTimeSpent = require('./utils/timeSpent.js')
const checkCastling = require('./utils/checkCastling.js')
const getMoveFromStockfish = require('./utils/moveStockfish.js')
const { LOCALHOST_URL, DEPLOYED_URL } = require('./constants');

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
    console.log(games[gameId].timer)
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
    const { chess, timer, currentPlayer, lastMoveTime, movesHistory } = game;
    try {
      //if request for castling comes, then enters in this
      if(castleMove){
        if(currentPlayer === 'w' && castleMove ==='K'){
          sourceSquare = 'e1'
          targetSquare = 'g1'
        }
        else if(currentPlayer === 'w' && castleMove ==='Q'){
          sourceSquare = 'e1'
          targetSquare = 'c1'
        } 
        else if(currentPlayer === 'b' && castleMove ==='K'){
          sourceSquare = 'e8'
          targetSquare = 'g8'
        } 
        else if(currentPlayer === 'b' && castleMove ==='Q'){
          sourceSquare = 'e8'
          targetSquare = 'c8'
        } 
        if(currentPlayer === 'w') castleMove = castleMove.toUpperCase()
      }

    // Validate the move
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion
      });
      //this function thorws an error if the move is invalid; that crashes the server. So putting up a try-catch block

      if (move){
        //example for FEN string - r1bqkbnr/pppppppp/2n5/8/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 2 2 stored in move.after
        const currentFEN = move.after

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
  
        //check for availability of castling with the utility function for the next move
        const castling = checkCastling(currentFEN , game)
        
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
          currentPlayer:game.currentPlayer,
          castling,
          castleMove
          //difference between castleMove and castling - castleMove stores the castle that happened in this move(if any) whereas castling stores the possibility of castling in the next move
        });

        // If the game is over, emit end the game
        if (isCheckmate || isDraw || isStalemate || isInsufficientMaterial) {
          socket.emit('game-over', {
            result: isCheckmate ? 'checkmate' : isDraw ? 'draw' : isStalemate ? 'stalemate' : 'insufficient material',
          });
        }

        //never gets in this for multiplayer since PvP will be false. 
        //only gets in this when the user in PvC has played a move and it is the turn of the computer to play a move
        if(!game.PvP && !flagComputer){

          //this move.after is having FEN string that will be sent to the stockfish api
          //rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
          const {bestMove , error}
          = await getMoveFromStockfish({fen:move.after , depth:game.depth})
          
          if(error) throw new Error('Some Internal error in Fetching move from Stockfish')

          //adding this move of stockfish in the movesHistory
          // (game.movesHistory).push(bestMove)
          io.to(gameId).emit('computer-move-receiver' , {bestMove,gameId})
        }

      } else {
        socket.emit('invalid-move', 'Invalid move');
      }
    } catch (error) {

      // Calculate time spent on the current move
      const timeSpent = calculateTimeSpent(currentPlayer, lastMoveTime);
      timer[currentPlayer === 'w' ? 'white' : 'black'] -= timeSpent;

      const currentFEN = chess.fen()
      console.log(currentFEN)
      const castling = checkCastling(currentFEN , game)

      io.to(gameId).emit('move', {
        move:false,
        timer,
        isCheck:null,
        isCheckmate:null,
        isDraw:null,
        isStalemate:null,
        isInsufficientMaterial:null,
        capturedPiece:null,
        currentPiece:null,
        movesHistory:null,
        currentPlayer:game.currentPlayer,
        castling,
        castleMove:null
      });
    }
  });


  socket.on('forfiet-game' , ({gameState , gameId})=>{
    const winner = gameState==='PlayerB'?'White':'Black'
    const forfieted = winner === 'White'?'Black':'White'
    io.to(gameId).emit('forfiet-game' , {winner , forfieted})
    delete games[gameId]
  })



  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete games[socket.id];
  });
});




server.listen(5000, () => {
  console.log('listening on *:5000');
});