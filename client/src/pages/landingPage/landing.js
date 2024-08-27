import { useContext } from 'react'
import '../../styles/landing.css'
import { GameContext } from '../../context/context'
import { useNavigate } from 'react-router-dom'
const Landing = ()=>{
    const {setGameState , setGameId} = useContext(GameContext)
    const navigate = useNavigate()
    const handleComputer = ()=>{
        setGameState('Computer')
        navigate('/game-page')
    }
    const handlePlayerW = ()=>{
        setGameState('PlayerW')
        navigate('/game-page')
    }
    const handlePlayerB = ()=>{
        setGameState('PlayerB')
        navigate('/game-page')
    }
    return(
        <div className='landing-btn-wrapper'>
            <button className="landing-btn" onClick={handleComputer}>
                Play v/s Computer
            </button>
            <button className="landing-btn" onClick={handlePlayerW}>
                Play v/s Player (as White)
            </button>
            <input style={{marginTop:'20px'}} type='text' placeholder='Enter the Game Id and Join to play as Black' onChange={(e)=>{setGameId(e.target.value)}}/>
            <button className="landing-btn" onClick={handlePlayerB}>
                Join a Game (as Black) 
            </button>
        </div>
    )
}
export default Landing