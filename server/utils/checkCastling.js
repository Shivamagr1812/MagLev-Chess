const checkCastling = (currentFEN , game)=>{

    let kingSideCastling=true
    let queenSideCastling=true
    if(currentFEN.split(" ")[2] !== '-'){
      //get the position of the piece of the nextPlayer from the FEN String
      const pos = (currentFEN.split(" ")[0]).split("/")[game.currentPlayer==='b'?0:7].toUpperCase()
      console.log(pos)
  
      //check if there are any pieces between King and King Side Rook
      kingSideCastling = (pos.slice(5 , 7) === '11')?kingSideCastling : false
  
      //check if there are any pieces between King and Queen Side Rook
      queenSideCastling = (pos.slice(1 , 4) === '111')?queenSideCastling : false
  
      //check if there is any King and King Side Rook are in original Position
      kingSideCastling = (pos[4] === 'K' && pos[7] === 'R')?kingSideCastling : false
  
      //check if there is any King and Queen Side Rook are in original Position
      queenSideCastling = (pos[4] === 'K' && pos[0] === 'R')?kingSideCastling : false
      
    }
    const castling = {kingSide:{name:"King Side Castling" , status:kingSideCastling} , 
                      queenSide:{name:"Queen Side Castling" , status:queenSideCastling}}
    return castling     
}

module.exports = checkCastling