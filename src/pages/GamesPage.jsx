import connectFourIcon from '../assets/connect-four.png'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import GameCard from '../components/GameCard'
import { io } from 'socket.io-client'
import { useEffect, useState } from 'react'




const GamesPage = () => {

  const [socket, setSocket] = useState(null)

  

   // Initialize socket connection
   useEffect(() => {
      const newSocket = io('http://192.168.2.51:5000')
      setSocket(newSocket)
      return () => newSocket.close()
    }, [])


    useEffect(() => {
      if(!socket) return

      socket.on('allGames', (games) => {
        console.log('games: ', games)
        for (const [gameId, gameData] of Object.entries(games)) {
          console.log(`Game ID: ${gameId}`, gameData);
        }
      })

    }, [socket])

  return (
    <>
      <h1 className='text-center'>Games</h1>
      <div className='py-4'>
        <Row>
          <Col xs={6} md={4}>
            <GameCard image={connectFourIcon} title='Connect Four' link='connect-four' />
          </Col>  
          <Col xs={6} md={4}>
            <GameCard image={connectFourIcon} title='Pong' link='pong' />
          </Col>
          <Col xs={6} md={4}>
            <GameCard image={connectFourIcon} title='Wordsearch' link='wordsearch' />
          </Col>
        </Row>
      </div>
    </>
  )
}
export default GamesPage
