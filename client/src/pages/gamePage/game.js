import Board from "../../components/board"
import {Pawn , King , Queen , Rook , Knight , Bishop} from '../../class/piece.js'

const Game = ()=>{

    //initializing the grid for the board 
    const grid = new Map()
    for(let  i = 2;i<=7;i++){
        for(let j = 'a'.charCodeAt(0) ; j<='h'.charCodeAt(0) ; j++){
            const coordinate = `${String.fromCharCode(j)}${9-i}`
            if(i>2 && i<7) grid.set(coordinate , null)
            if(i===2) grid.set(coordinate , new Pawn('black'))
            if(i===7) grid.set(coordinate , new Pawn('white'))    
        }
    }
    // White Pieces
    grid.set('a1', new Rook('white'));
    grid.set('h1', new Rook('white'));
    grid.set('b1', new Knight('white'));
    grid.set('g1', new Knight('white'));
    grid.set('c1', new Bishop('white'));
    grid.set('f1', new Bishop('white'));
    grid.set('d1', new Queen('white'));
    grid.set('e1', new King('white'));

    // Black Pieces
    grid.set('a8', new Rook('black'));
    grid.set('h8', new Rook('black'));
    grid.set('b8', new Knight('black'));
    grid.set('g8', new Knight('black'));
    grid.set('c8', new Bishop('black'));
    grid.set('f8', new Bishop('black'));
    grid.set('d8', new Queen('black'));
    grid.set('e8', new King('black'));

    return(
        <>
            <Board grid={grid}/>
        </>
    )
}

export default Game