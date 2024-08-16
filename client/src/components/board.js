import  '../styles/board.css'
import {useState} from 'react'
import Moves from './moves.js'

const Board = ({grid})=>{
    const [current ,  setCurrent ]=useState(null)
    const [error , setError] = useState("")
    const [movesHistory , setMovesHistory] = useState([])
    const [dead , setDead] = useState([])

    const board  = [
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""]
    ]

    const handleClick = ({piece,columnIndex,rowIndex})=>{
        if((!piece) && (!current)){
            setError('No piece on clicked box')
            return
        } 
        if(piece?.color === current?.piece.color){
            setError('Invalid to Kill own pieces')
            setCurrent(null)
            return
        }
        if(current){
            const response = {
                valid:true,
                dead:piece || null,
                check:false,
                checkmate:false,
                draw:false
            };
            //code for connecting to server and validating the move and storing the verdict in the repsonse
            if(response){
                setMovesHistory([...movesHistory , 
                `${String.fromCharCode(current.currColumn + 97)}${8-current.currRow}->${String.fromCharCode(columnIndex + 97)}${8-rowIndex}`])

                if(response.dead) setDead([...dead , response.dead])

                grid.set(`${String.fromCharCode(columnIndex + 97)}${8-rowIndex}`,current.piece)
                grid.set(`${String.fromCharCode(current.currColumn + 97)}${8-current.currRow}`,null)

                setCurrent(null)
                setError('')
            }
            else setError('Invalid Move')
            return
        }
        setCurrent({piece:piece , currRow:rowIndex , currColumn:columnIndex})
        setError('')
    }

    return(<>
        <Moves movesHistory={movesHistory}/>
        <div className='board-outer-wrapper'>
            {board.map((line , rowIndex)=>{
                return(
                    <div style={{display:'flex',width:'100%',height:'12.5%'}}>
                        {line.map((block , columnIndex)=>{
                        let color = ''
                        if((rowIndex+columnIndex+1)%2 === 0) color = '#c86f39'
                        else color = '#edd3b1'
                        let piece = grid.get(`${String.fromCharCode(columnIndex + 97)}${8-rowIndex}`)
                        return(
                            <div className='board-blocks' 
                            style = {{backgroundColor:color,color:(!piece)?'':`${piece.color}`,textShadow:(!piece || piece.color==='black')?'':'0px 0px 3px black'}}
                            onClick={()=>{handleClick({piece:piece , columnIndex:columnIndex , rowIndex:rowIndex})}}>
                                {(!piece)?'':piece.icon}
                            </div>
                        )
                        })}
                    </div>
                )
            })}
        </div>
        <div style={{color:'red',textAlign:'center'}}>{error}</div>
        </>
    )
}
export default Board