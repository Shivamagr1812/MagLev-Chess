import { useContext, useEffect } from 'react'
import '../../styles/landing.css'
import { GameContext } from '../../context/context'
import { useNavigate } from 'react-router-dom'
const Landing = ()=>{
    const {setGameState , gameId ,setGameId , setDepth , setStart , setSocket , setDead , setMovesHistory} = useContext(GameContext)
    const navigate = useNavigate()

    useEffect(()=>{
        setStart(false)
        setSocket(null)
        setDead([])
        setMovesHistory([])
    },[])
    const handleComputer = ()=>{
        setGameState('Computer')
        navigate('/game-page')
    }
    const handlePlayerW = ()=>{
        setGameState('PlayerW')
        navigate('/game-page')
    }
    const handlePlayerB = ()=>{
        if(!gameId) return
        setGameState('PlayerB')
        navigate('/game-page')
    }
    const handleDepth = (e)=>{
        setDepth(e.target.value)
    }
    return(
        <div className='landing-btn-wrapper'>
            <div style={{textAlign:'center', width:'35vw', fontSize:'0.9rem'}}>Choose Level only for playing against Computer. By Default Level 1 is selected</div>
            <div style={{display:'flex',flexDirection:'row', justifyContent:'center'}}>
            Level-1<input style={{display:'inline', marginRight:'20px'}} type='radio' name='depth' value='1' onClick={handleDepth} defaultChecked/> 
            Level-2<input style={{display:'inline', marginRight:'20px'}} type='radio' name='depth' value='2' onClick={handleDepth}/>
            Level-3<input style={{display:'inline', marginRight:'20px'}} type='radio' name='depth' value='3' onClick={handleDepth}/>
            </div>
            {/* value=1 => depth=5 , value=2 => depth=10 ,  value=3 => depth=15 */}
        
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