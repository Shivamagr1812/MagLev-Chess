import { createContext , useState } from "react";
export const GameContext = createContext()
export const GameContextProvider = ({children})=>{
    const [socket , setSocket]=useState(null)
    const [gameId , setGameId]=useState(null)
    const [timer , setTimer]=useState({ white: 300, black: 300 })
    const [currentPlayer , setCurrentPlayer] = useState('w')
    const [start , setStart]=useState(false)
    const [movesHistory , setMovesHistory] = useState([])
    const [dead , setDead] = useState([])
    const [depth , setDepth] = useState(5)
    const [gameState , setGameState] = useState(null)
    //gameState keeps the track whether the user is playing against another user or the computer
    return(
        <GameContext.Provider value={{movesHistory , setMovesHistory , dead , setDead ,
         gameState , setGameState, socket , setSocket , gameId , setGameId , currentPlayer , setCurrentPlayer , 
         start , setStart , depth , setDepth , timer , setTimer }}>
            {children}
        </GameContext.Provider>
    )
}