const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors =require('cors');
const e = require('express');
const { copyFileSync } = require('fs');

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
  socket.on('move', async ({ sourceSquare, targetSquare , currentPiece , gameId , flagComputer }) => {
    //flagComputer is used to distinguish the move of the Computer i.e. Stcokfish from the the move of player.
    //currentPiece moves from sourceSquare to targetSquare
    const game = games[gameId];
    console.log(gameId)
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
          currentPlayer:game.currentPlayer
        });

        // If the game is over, end the game
        if (isCheckmate || isDraw || isStalemate || isInsufficientMaterial) {
          socket.emit('game-over', {
            result: isCheckmate ? 'checkmate' : isDraw ? 'draw' : isStalemate ? 'stalemate' : 'insufficient material',
          });
        }

        //never gets in this for multiplayer since PvP will be false. 
        if(!game.PvP && !flagComputer){

          //this move.after is having FEN string that will be sent to the stockfish api
          //rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
          const {bestMove , moveStockfish , currentPlayer , gameEnding , mate , error}
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

//Utility function to get the bestMove by calling the api
const getMoveFromStockfish = async ({depth , fen})=>{
  try {
    const STOCKFISH_API = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`
    const response  = await fetch( STOCKFISH_API )
    //{success : Boolean  , bestmove: "bestmove b7b6" , evaluation : Number , continuation : String , mate: :| }
    const data = await response.json()
    
    if(!data.success) throw new Error('Something went wrong')
    const bestMove = data.bestmove.split(" ")[1]
    const color = fen.split(" ")[1] 
    const currentPlayer = (color === 'w')? 'b':'w'

    const chessNew = new Chess(fen)
    const moveStockfish = chessNew.move({
      from:bestMove.slice(0 , 2),
      to:bestMove.slice(2 , 4)
    })

    let gameEnding = false
    //checking if there is a bestmove or the game is at some game-ending condition.
    if(isNaN(Number(bestMove.charAt(1))))  gameEnding=true

    return { bestMove , moveStockfish , currentPlayer , gameEnding  , mate:data.mate , error:false}
  } catch (error) {
    return {move:false , bestMove:false , currentPlayer:null , gameEnding:null , mate:null , error:true}
  }
}