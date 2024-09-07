import { useContext, useEffect, useState } from "react"
import { GameContext } from "../context/context.js"
import '../styles/timer.css'

const Timer = ()=>{
    const {currentPlayer , timer} = useContext(GameContext)
    const [white , setWhite] = useState(300)
    const [black , setBlack] = useState(300)

    useEffect(()=>{
        setWhite(300)
        setBlack(300)
    },[])

    useEffect(()=>{
        //updating the timer every time the currentPlayer changes i.e. someone made a move
        const timerInterval = setInterval(() => {
            if(currentPlayer === 'w') setWhite((prevWhite)=>Math.max(prevWhite - 1, 0))
            else if(currentPlayer === 'b') setBlack((prevBlack)=>Math.max(prevBlack - 1, 0))
        }, 1000)

        //this return statements prevents any unusual behaviour with the timer cleaning it up thus removing any garbage value
        return ()=>{
            clearInterval(timerInterval)
        }
    },[currentPlayer])
    
    return(
        <>
        <div className="timer-wrapper">
            
            <div className="timer-inner-wrapper">
                <div className="player-time">White:{white}sec</div>
            </div>
            <div className="timer-inner-wrapper">
                <div className="player-time">Black:{black}sec</div>
            </div>

        </div>
        </>
    )
}

export default Timer