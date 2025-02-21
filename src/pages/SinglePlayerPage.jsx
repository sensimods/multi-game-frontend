import { useParams } from 'react-router-dom'
// import ConnectFour from '../games/multiplayer/ConnectFourOld'
// import WordSearch from '../games/multiplayer/WordSearch'
// import ConnectFour from '../games/multiplayer/ConnectFour'
// import Pong from '../games/multiplayer/Pong'
import GameContainer from '../components/GameContainer'
// import Pong from '../games/Pong'
// import Poker from '../games/Poker'
import Wordsearch from '../games/singlePlayer/word'
const gameComponents = {
  'wordsearch': Wordsearch
}

const SinglePlayerPage = () => {
  const { game } = useParams()
  console.log(game)

  const SelectedGame = gameComponents[game] || (() => <p>Game not found bitch</p>)

  return (
    <div>
      <GameContainer>
        <SelectedGame />
      {/* <h1>hello</h1> */}
      </GameContainer>
    </div>
  )
}

export default SinglePlayerPage
