import { useContext } from "react"
import { GameContext } from "../context/context"

const Moves = ()=>{
    const {movesHistory} = useContext(GameContext)
    return(
        <div className='moves-history-wrapper'>
            {([...movesHistory].reverse()).map((move,index)=>{
                return(
                    <span style={{margin:'2px 5px'}} key={index}>{move}</span>
                )
            })}
        </div>
    )
}
export default Moves