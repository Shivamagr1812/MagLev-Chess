const getMoveFromStockfish = async ({depth , fen})=>{
    try {
      const STOCKFISH_API = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`
      const response  = await fetch( STOCKFISH_API )
      //{success : Boolean  , bestmove: "bestmove b7b6" , evaluation : Number , continuation : String , mate: :| }
      const data = await response.json()
      
      if(!data.success) throw new Error('Something went wrong')
      let bestMove = data.bestmove.split(" ")[1]

      //checking if there is a bestmove or the game is at some game-ending condition.
      if(isNaN(Number(bestMove.charAt(1)))) bestMove = false
        
      return { bestMove , error:false}
    } catch (error) {
      return { bestMove:false , error:true}
    }
  }

  module.exports = getMoveFromStockfish