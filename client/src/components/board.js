import  '../styles/board.css'
import {useContext, useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import Moves from './moves.js'
import { GameContext } from '../context/context.js'
import io from 'socket.io-client';


const Board = ({grid})=>{
    const {setMovesHistory , setDead, gameState , socket ,  setSocket , 
        gameId , setGameId , currentPlayer , setCurrentPlayer , start , setStart , depth} = useContext(GameContext)
    const [current ,  setCurrent ]=useState(null)
    const [info , setInfo] = useState("")
    //the current state variable will store the piece selected and the columnIndex and rowIndex of that piece in an object
    const navigate = useNavigate()

    //this URL is for connecting with the server using websockets
    const URL = 'https://maglev-chess-backend.onrender.com/'

    //this variable is to initialize an empty board. Its and empty 2D Array
    const board = Array(8).fill(Array(8).fill(""));

    //connecting with the socket server
    useEffect(()=>{
        const newSocket = io(URL)
        setSocket(newSocket)
        newSocket.on('connect',()=>{
            if(gameState === 'PlayerW'){
                setGameId(newSocket.id)
                console.log('White Player: Connection Established, Starting New Game')
                //inform the server that the white player has initiated the game
                newSocket.emit('white-joins')
                setInfo(`Game Id:${newSocket.id}\nShare it with the Black Player`) 

            }else if(gameState === 'PlayerB'){

                console.log(`Black Player: Connecting to Game with ID: ${gameId}`)
                //inform the server that the black player wants to join
                newSocket.emit('black-joins', {gameId})

            }else if(gameState === 'Computer'){

                newSocket.emit('vsComputer-joins' , depth)
                //handles when someone chooses to play against computer

            }
        })

        // newSocket.on('emit-id',(gameId)=>{
        //     setGameId(gameId)
        //     setInfo(`Game ID : ${gameId}\nShare it with the other player`)
        //     console.log(gameId)
        //     //get the gameId from the server for the white player. Black player will now put in the landing page and get in the game

        // })

        newSocket.on('start-game' , (gameId)=>{

            setInfo('Black Player joined the game.')
            setStart(true)
            //The other player joined the game. Now the game can start

        })

        newSocket.on('wrong-game',(gameId)=>{

            setGameId(null)
            alert('This Game has Already started.\nSeems like a Wrong Game!')
            navigate(-1)

        })

        newSocket.on('vsComputer-start' , (gameId)=>{

            setGameId(gameId)
            setStart(true)
            console.log(`Gaem Starts vs Computer at id ${gameId}`)
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
                currentPiece:data.currentPiece,
                movesHistory:data.movesHistory,
                //preferably use the backend to manage movesHistory
                currentPlayer:data.currentPlayer
            }
            setCurrentPlayer(response.currentPlayer)
            //this is the format we are receiving the repsonse object from server. the data.move is false if the move sent is invalid

            const move=response.move
            //destructuring move will open serveral possibilities

            if(move){
                setMovesHistory(response.movesHistory)

                if(response.isCheck) setInfo('That is a Check!')
                //checks for a check

                if(response.isCheckmate){
                    setInfo('That is a Checkmate! Game Ends')
                    navigate(-1)
                }

                if(response.capturedPiece) setDead(dead=>[...dead , `${move.color==='w'?'b':'w'}${response.capturedPiece}`])
                //adds any dead piece to the dead state array

                grid.set(`${move.to}`, response.currentPiece)
                //the move.to has the new position in the exact 'b7' type manner. Thus moving the piece to the new position

                grid.set(`${move.from}`, null)
                //putting value NULL for the key i.e. initial position of the piece

                setCurrent(null)
                setInfo('')
            }
            else {
                setInfo('Invalid Move')
                setCurrent(null)
            }
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
            setInfo('Server Error or Network Error')
        })

        newSocket.on('computer-move-receiver' , ({bestMove ,gameId})=>{
            const sourceSquare = bestMove.slice(0,2)
            const targetSquare = bestMove.slice(2,4)
            const currentPiece = grid.get(bestMove.slice( 0 , 2 ))
            const flagComputer = true
            // emitMove({sourceSquare,targetSquare,currentPiece,flagComputer})
            newSocket.emit('move' , {sourceSquare,targetSquare,currentPiece,gameId:gameId,flagComputer})
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
    function emitMove({sourceSquare , targetSquare , currentPiece , flagComputer }){
        setInfo("")
        if(!socket) return
        console.log({sourceSquare , targetSquare , currentPiece , flagComputer})
        socket.emit('move' , {sourceSquare , targetSquare , currentPiece , gameId:gameId , flagComputer })
    }

    const handleClick = ({piece,columnIndex,rowIndex})=>{
        if(gameState === 'PlayerW' && piece?.color==='black' && !current) return
        if(gameState === 'PlayerB' && piece?.color==='white' && !current) return
        if(currentPlayer === 'w' && gameState==='PlayerB') return
        if(currentPlayer === 'b' && gameState === 'PlayerW') return
        if((!piece) && (!current)){
            setInfo('No piece on clicked box')
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
            //converting the index position to the standard 'e7' type manner by ASCII valye
            emitMove({sourceSquare,targetSquare,currentPiece:current.piece,flagComputer:false})
            //sending the current piece to the server as it might be needed
            //the code that was here initially has been shifted to the newSocket.on('move') part because the state's update do not reflect instanly in the code 
            return
        }
        setCurrent({piece:piece , currRow:rowIndex , currColumn:columnIndex})
        setInfo('')
    }

    return(
        (!gameState)?<><h1>Error 401!</h1></>:
        ((!start)?<>
        <h1>Wait for Black to join!</h1>
        <div style={{widht:'20px',fontSize:'1rem',fontWeight:'bold'}}>{info}</div>
        </>:
        <>
        <div style={{display:'flex',justifyContent:'space-between'}}>
        <div style={{fontWeight:'bold'}}>Against {gameState==='Computer'?'Computer':(gameState==='PlayerW'?'Black':'White')}</div>
        <div style={{widht:'60px',fontSize:'1rem',color:'red'}}>{info}</div>
        </div>
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
                            onClick={()=>{handleClick({piece:piece , columnIndex:columnIndex , rowIndex:rowIndex })}}>
                                {(!piece)?'':piece.icon}
                            </div>
                        )
                        })}
                    </div>
                )
            })}
        </div>
        {/* <div style={{color:'red',textAlign:'center'}}>{error}</div> */}
        </>)
    )
}
export default Board