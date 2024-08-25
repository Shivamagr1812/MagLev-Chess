import  '../styles/board.css'
import {useContext, useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import Moves from './moves.js'
import { GameContext } from '../context/context.js'
import io from 'socket.io-client';


const Board = ({grid})=>{
    const {movesHistory , setMovesHistory , dead , setDead, gameState , socket ,  setSocket} = useContext(GameContext)
    const [current ,  setCurrent ]=useState(null)
    //the current state variable will store the piece selected and the columnIndex and rowIndex of that piece in an object
    const [error , setError] = useState("")
    const navigate = useNavigate()

    //this URL is for coonecting with the server using websockets
    const URL = 'http://localhost:5000'

    //this variable is to initialize an empty board. Its and empty 2D Array
    const board = Array(8).fill(Array(8).fill(""));


    //connecting with the socket server
    useEffect(()=>{
        const newSocket = io(URL)
        setSocket(newSocket)

        newSocket.on('connect', ()=>{
            console.log('Connection Established, Game Starts')
        })

        newSocket.on('move' , (data)=>{
            console.log(data)
            const response = {
                move:data.move,
                timer:data.timer,
                isCheck: data.isCheck,
                isCheckmate: data.isCheckmate,
                isDraw: data.isDraw,
                isStalemate: data.isStalemate,
                isInsufficientMaterial: data.isInsufficientMaterial,
                capturedPiece: data.capturedPiece,
                currentPiece:data.currentPiece
            }
            //this is the format we are receiving the repsonse object from server. the data.move is false if the move sent is invalid
            const move=response.move
            //destructuring move will open serveral possibilities
            if(move){
                setMovesHistory([...movesHistory , `${move.from}->${move.to}`])

                if(response.isCheck) alert('That is a Check!')
                //checks for a check

                if(response.capturedPiece) setDead([...dead , response.capturedPiece])
                //adds any dead piece to the dead state array

                grid.set(`${move.to}`, response.currentPiece)
                //converting the coloumn index from number to alphabet with ASCII value to store in the map in the format of 'b7' after the new move.
                grid.set(`${move.from}`, null)
                //putting value NULL for the key i.e. initial position of the piece
                setCurrent(null)
                setError('')
            }
            else setError('Invalid Move')
        })

        newSocket.on('game-over' , (result)=>{
            console.log(`Game-Over, Result:\n${result}`)
            alert(result)
        })

        newSocket.on('invalid-move' , (invalid)=>{
            alert(`Oops!! That is a invalid move!\n ${invalid}`)
        })

        newSocket.on('connect_error', (error) => {
            alert('Some Error Occured. Game Frozen while error is fixed')
            setError('Server Error or Network Error')
        })

        // newSocket.on('disconnect' , (error)=>{
        //     console.log('error')
        //     setIsDisconnected(true)
        //     setError('Server Disconnected')
        // })

        return ()=>{
            newSocket.disconnect()
            setSocket(null)
        }
    },[])

    //a function to emit move to the socket server
    const emitMove = ({sourceSquare , targetSquare , currentPiece})=>{
        if(!socket) return;
        socket.emit('move' , {sourceSquare , targetSquare , currentPiece})
    }



    const handleClick = ({piece,columnIndex,rowIndex})=>{
        if((!piece) && (!current)){
            setError('No piece on clicked box')
            return
        } 
        
        //check if the player mistakenly tries to put chosen piece on own piece
        if(piece?.color === current?.piece.color){
            // setError('Invalid to Kill own pieces')
            setCurrent({piece:piece , currRow:rowIndex , currColumn:columnIndex})
            return
        }
        if(current){
            const sourceSquare = `${String.fromCharCode(current.currColumn + 97)}${8-current.currRow}`
            const targetSquare = `${String.fromCharCode(columnIndex + 97)}${8-rowIndex}`
            emitMove({sourceSquare,targetSquare,currentPiece:current.piece})
            //sending the current piece to the server as it might be needed
            //the code that was here initially has been shifted to the newSocket.on('move') part because the state's update do not reflect instanly in the code 
            return
        }
        setCurrent({piece:piece , currRow:rowIndex , currColumn:columnIndex})
        setError('')
    }

    return(
        (!gameState)?<><h1>Error 401!</h1></>:
        <>
        <h3>Against {gameState}</h3>
        <Moves/>
        <div className='board-outer-wrapper'>
            {board.map((line , rowIndex)=>{
                return(
                    <div style={{display:'flex',width:'100%',height:'12.5%'}}>
                        {line.map((block , columnIndex)=>{
                        let color = ''
                        //checking if the box is black or white. The '+1' is because rowIndex and columnIndex are array-indexed(i.e. starts from 0)
                        if((rowIndex+columnIndex+1)%2 === 0) color = '#c86f39'
                        else color = '#edd3b1'
                        let piece = grid.get(`${String.fromCharCode(columnIndex + 97)}${8-rowIndex}`)
                        return(
                            <div className={`board-blocks`} 
                            style = {{backgroundColor:color,color:(!piece)?'':`${piece.color}`,
                            textShadow:(!piece || piece.color==='black')?'':'0px 0px 3px black' ,
                            border:(current?.currRow === rowIndex && current?.currColumn === columnIndex)?'1px solid white':'1px solid black'}}
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