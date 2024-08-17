import { createContext , useState } from "react";
export const GameContext = createContext()
export const GameContextProvider = ({children})=>{
    const [movesHistory , setMovesHistory] = useState([])
    const [dead , setDead] = useState([])
    const [gameState , setGameState] = useState(null)
    //gameState keeps the track whether the user is playing against another user or the computer
    return(
        <GameContext.Provider value={{movesHistory , setMovesHistory , dead , setDead , gameState , setGameState}}>
            {children}
        </GameContext.Provider>
    )
}