import { GameContextProvider } from "./context/context";
import Game from "./pages/gamePage/game"
import Landing from "./pages/landingPage/landing";
import {BrowserRouter , Routes , Route} from 'react-router-dom'
function App() {
  document.title = 'MagLev Chess'
  return (
    <GameContextProvider>
    <h1>MagLev-Chess</h1>
    <BrowserRouter>
    <Routes>
      <Route exact path="/" element={<Landing/>}/>
      <Route exact path="/game-page" element={<Game/>}/>
    </Routes>
    </BrowserRouter>
    </GameContextProvider>
  );
}

//Present scenario/problems as of 16th Aug : 
//If there is some refresh of the page, then the game restarts from beginning....solution -> The state of the board will be stored in the backend and thus we can get the same state after any refresh or network issues and put it back in the game
//There is no way to connect the user or computer(since backend not yet ready, hopefully after that this will be done)
//The moves are expected to be verfied from the backend, so no code for it in frontend for now.
//The clock will run in backend to avoid any malicious attacks in the browser.
//The incoming moves expected from backend(for both player and )

export default App;
