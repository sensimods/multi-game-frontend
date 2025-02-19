import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'

const GamePage = () => {
  const { game } = useParams() // Extracts the ':game' value from the URL

  return (
    <div>
      <ul>
        <li><Link to={`/games/${game}/multiplayer`}>Mulitplayer</Link></li>
        <li><Link to={`/games/${game}/single`}>Single Player</Link></li>

      </ul>
    </div>
  )
}
export default GamePage
