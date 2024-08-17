import { useContext } from 'react'
import '../../styles/landing.css'
import { GameContext } from '../../context/context'
import { useNavigate } from 'react-router-dom'
const Landing = ()=>{
    const {setGameState} = useContext(GameContext)
    const navigate = useNavigate()
    const handleComputer = ()=>{
        setGameState('Computer')
        navigate('/game-page')
    }
    const handlePlayer = ()=>{
        setGameState('Player')
        navigate('/game-page')
    }
    return(
        <div className='landing-btn-wrapper'>
            <button className="landing-btn" onClick={handleComputer}>
                Play v/s Computer
            </button>
            <button className="landing-btn" onClick={handlePlayer}>
                Play v/s Player
            </button>
        </div>
    )
}
export default Landing