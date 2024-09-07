import { useContext } from "react"
import { GameContext } from "../context/context"

const DeadWhite = ()=>{
    const {dead} = useContext(GameContext)
    const deadIcons = new Map()
    deadIcons.set('P' , '♟')
    deadIcons.set('Q' , '♛')
    deadIcons.set('B' , '♝')
    deadIcons.set('N' , '♞')
    deadIcons.set('R' , '♜')
    return(
        <div className="dead-piece-wrapper">
            {dead.map((piece)=>{
                if(piece[0]==='w') 
                return(
                    <div className="dead-white-piece">
                        {deadIcons.get(piece[1])}
                    </div>
                )
            })}
        </div>
    )
}

export default DeadWhite