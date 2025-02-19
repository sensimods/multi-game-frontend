import { useParams } from 'react-router-dom'
// import ConnectFour from '../games/multiplayer/ConnectFourOld'
import WordSearch from '../games/multiplayer/WordSearch'
import ConnectFour from '../games/multiplayer/ConnectFour'
import Pong from '../games/multiplayer/Pong'
import GameContainer from '../components/GameContainer'
// import Pong from '../games/Pong'
// import Poker from '../games/Poker'

const gameComponents = {
  'connect-four': ConnectFour,
  'wordsearch': WordSearch,
  'pong': Pong,
  // 'poker': Poker,
}

const MultiplayerPage = () => {
  const { game } = useParams()

  const SelectedGame = gameComponents[game] || (() => <p>Game not found</p>)

  return (
    <div>
      <GameContainer>
      <SelectedGame />

      </GameContainer>
    </div>
  )
}

export default MultiplayerPage
