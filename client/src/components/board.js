import  '../styles/board.css'
import '../styles/pawnPromotion.css'
import '../styles/dead.css'
import {useContext, useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import PawnPromote from './pawnPromote.js'
import Moves from './moves.js'
import {Bishop, Knight, Queen, Rook} from  '../class/piece.js'
import { GameContext } from '../context/context.js'
import io from 'socket.io-client';
import Timer from './timer.js'


const Board = ({grid})=>{
    const {setMovesHistory , setDead, gameState , socket ,  setSocket , timer ,  setTimer , 
        gameId , setGameId , currentPlayer , setCurrentPlayer , start , setStart , depth} = useContext(GameContext)
    const [current ,  setCurrent ]=useState(null)
    const [promotePawn , setPromotePawn]=useState(false)
    const [promotionMove , setPromotionMove]=useState(null)
    // const [castling , setCastling] = useState({})
    const [info , setInfo] = useState("")
    //the current state variable will store the piece selected and the columnIndex and rowIndex of that piece in an object
    const navigate = useNavigate()

    //this URL is for connecting with the server using websockets
    // const URL = 'https://maglev-chess-backend.onrender.com/'
    const URL = 'http://localhost:5000'

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

        newSocket.on('move' , (response)=>{
            console.log(response)
        
            setCurrentPlayer(response.currentPlayer)
            setTimer(response.timer)
            //this is the format we are receiving the repsonse object from server. the data.move is false if the move sent is invalid

            const move=response.move
            //destructuring move will open serveral possibilities

            if(move){
                setMovesHistory(response.movesHistory)

                //promoting pawn
                setPromotePawn(false)
                if(move.promotion === 'q') response.currentPiece = new Queen(response.currentPiece.color)
                else if(move.promotion === 'r') response.currentPiece = new Rook(response.currentPiece.color)
                else if(move.promotion === 'n') response.currentPiece = new Knight(response.currentPiece.color)
                else if(move.promotion === 'b') response.currentPiece = new Bishop(response.currentPiece.color)

                if(response.isCheck) setInfo('That is a Check!')
                //checks for a check

                if(response.capturedPiece) setDead(dead=>[...dead , `${move.color==='w'?'b':'w'}${response.capturedPiece}`])
                //adds any dead piece to the dead state array

                grid.set(`${move.to}`, response.currentPiece)
                //the move.to has the new position in the exact 'b7' type manner. Thus moving the piece to the new position

                grid.set(`${move.from}`, null)
                //putting value NULL for the key i.e. initial position of the piece

                //moving the rook if castling was successful
                if(move.from === 'e1' && move.to === 'g1'){
                    const rook = grid.get('h1')
                    grid.set('h1' , null)
                    grid.set('f1' , rook)
                }
                else if(move.from === 'e1' && move.to === 'c1'){
                    const rook = grid.get('a1')
                    grid.set('a1' , null)
                    grid.set('d1' , rook)
                }
                else if(move.from === 'e8' && move.to === 'g8'){
                    const rook = grid.get('h8')
                    grid.set('h8' , null)
                    grid.set('f8' , rook)
                }
                else if(move.from === 'e8' && move.to === 'c8'){
                    const rook = grid.get('a8')
                    grid.set('a8' , null)
                    grid.set('d8' , rook)
                }

                if(response.isCheckmate){
                    alert(`That is a Checkmate!`)
                    navigate(-1)
                }

                setCurrent(null)
                if(!response.isCheck) setInfo('')
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

        newSocket.on('forfiet-game' , ({winner , forfieted})=>{
            console.log(winner)
            alert(`${forfieted} Resigned\n${winner} Wins!!`)
            navigate(-1)
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
    function emitMove({sourceSquare , targetSquare , currentPiece , promotion=null , flagComputer }){
        setInfo("")
        if(!socket) return
        socket.emit('move' , {sourceSquare , targetSquare , currentPiece , gameId:gameId , flagComputer , promotion })
    }

    const handlePromotionMove = (promotedTo)=>{
        setPromotePawn(false)
        emitMove({...promotionMove , promotion:promotedTo , flagComputer:false})
    }

    const handleForfiet=()=>{
        if(!socket) return
        socket.emit('forfiet-game' , {gameState , gameId})
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
            if(((targetSquare[1]==='1' && sourceSquare[1]==='2') || (targetSquare[1]==='8' && sourceSquare[1]==='7')) && current?.piece.type === 'Pawn' ){
                setPromotePawn(true)
                setPromotionMove({sourceSquare , targetSquare , currentPiece:current.piece})
            }else emitMove({sourceSquare,targetSquare,currentPiece:current.piece,promotion:null,flagComputer:false})
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
        {promotePawn && <PawnPromote handlePromotionMove={handlePromotionMove}/>}
        <Timer/>
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
        {/* {((gameState === 'PlayerW' && currentPlayer === 'w') || (gameState === 'PlayerB' && currentPlayer === 'b')) && <Castling castling={castling} handleCastleMove={handleCastleMove}/>} */}
        <div className='forfiet-btn-wrapper'><button className='forfiet-btn'  onClick={()=>{handleForfiet()}}>FORFIET</button></div>
        </>)
    )
}
export default Board