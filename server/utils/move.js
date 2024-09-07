const calculateTimeSpent = require('./timeSpent.js')
const getMoveFromStockfish = require('./moveStockfish.js')

const Move = async({io , game ,  sourceSquare, targetSquare , currentPiece , gameId , flagComputer , promotion  })=>{
    const { chess, timer, currentPlayer, lastMoveTime, movesHistory } = game;
    let returnObject = {}

    try {
      
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
        
        returnObject = {
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
            // castling,
            // castleMove
            //difference between castleMove and castling - castleMove stores the castle that happened in this move(if any) whereas castling stores the possibility of castling in the next move
          }

        // Emit game status
        io.to(gameId).emit('move', returnObject);

        // If the game is over, emit end the game
        if (isCheckmate || isDraw || isStalemate || isInsufficientMaterial) {
            returnObject = {...returnObject , gameOver:true}
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
          returnObject = {...returnObject , computerMove : bestMove}
        }

      } else {
        socket.emit('invalid-move', 'Invalid move');
      }
    } catch (error) {

      // Calculate time spent on the current move
      const timeSpent = calculateTimeSpent(currentPlayer, lastMoveTime);
      timer[currentPlayer === 'w' ? 'white' : 'black'] -= timeSpent;

      const currentFEN = chess.fen()

      returnObject = {
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
        // castling,
        // castleMove:null
      }
      io.to(gameId).emit('move', returnObject);
    }

    return returnObject
}

module.exports = Move