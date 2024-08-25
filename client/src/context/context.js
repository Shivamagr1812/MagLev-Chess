import { createContext , useState } from "react";
export const GameContext = createContext()
export const GameContextProvider = ({children})=>{
    const [socket , setSocket]=useState(null)
    const [movesHistory , setMovesHistory] = useState([])
    const [dead , setDead] = useState([])
    const [gameState , setGameState] = useState(null)
    //gameState keeps the track whether the user is playing against another user or the computer
    return(
        <GameContext.Provider value={{movesHistory , setMovesHistory , dead , setDead , gameState , setGameState, socket , setSocket}}>
            {children}
        </GameContext.Provider>
    )
}