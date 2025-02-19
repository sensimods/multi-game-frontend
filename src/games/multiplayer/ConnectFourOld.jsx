import { useRef, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import GameOverModal from '../../components/GameOverModal'
import { Button } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'

// import { updateUserStats } from '../features/auth/authSlice';
import { updateUserStats } from '../../slices/authSlice'

const ConnectFourOld = () => {
  
  const {userInfo} = useSelector(state => state.auth)
  const dispatch = useDispatch()


  // const playGameButtonRef = useRef()
  const canvasRef = useRef()
  // const modalRef = useRef()
  // const statusDisplayRef = useRef()
  const animationFrameRef = useRef()
  const [ctx, setCtx] = useState(null)
  const [socket, setSocket] = useState(null)
  const [activeGameId, setActiveGameId] = useState(null)
  const [gameIdInput, setGameIdInput] = useState('')
  // const [username, setUsername] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [gameState, setGameState] = useState({
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: null,
    playerOneColor: 'red',
    playerTwoColor: 'yellow',
    gameOver: true,
    winner: null
  })
  const [dropAnimation, setDropAnimation] = useState(null)
  const [isPieceDropping, setIsPieceDropping] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [winner, setWinner] = useState(null)
  const [player1Username, setPlayer1Username] = useState(null)
  const [player2Username, setPlayer2Username] = useState(null)

  const handleGameOver = (winnerName) => {
    setWinner(winnerName)
    setShowModal(true) // Show modal when the game ends
  }

  const handleCloseModal = () => {
    setShowModal(false)
    // Reset game logic here if needed
  }

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://192.168.2.51:5000')
    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

// Update the gameOver socket listener in your ConnectFour component
useEffect(() => {
  if (!socket) return

  socket.on('gameUpdate', (updatedGame) => {
    // Set usernames when they become available
    if (updatedGame.player1 && !player1Username) {
      setPlayer1Username(updatedGame.player1)
    }
    if (updatedGame.player2 && !player2Username) {
      setPlayer2Username(updatedGame.player2)
    }

    const changes = findBoardChanges(gameState.board, updatedGame.boardState)
    if (changes.length > 0) {
      const [row, col, value] = changes[0]
      startDropAnimation(col, row, value === 1 ? gameState.playerOneColor : gameState.playerTwoColor)
      
      setGameState(prevState => ({
        ...prevState,
        currentPlayer: updatedGame.turn,
        gameOver: updatedGame.gameOver
      }))

      setDropAnimation(prev => ({
        ...prev,
        newBoardState: updatedGame.boardState
      }))
    } else {
      setGameState(prevState => ({
        ...prevState,
        board: updatedGame.boardState,
        currentPlayer: updatedGame.turn,
        gameOver: updatedGame.gameOver
      }))
    }
  })

 

  socket.on('gameOver', (data) => {
  console.log('Game Over event received:', data)
  const { winner, gameState: updatedGameState } = data
  
  const changes = findBoardChanges(gameState.board, updatedGameState.boardState)
  if (changes.length > 0) {
    const [row, col, value] = changes[0]
    startDropAnimation(col, row, value === 1 ? gameState.playerOneColor : gameState.playerTwoColor)
    
    setGameState(prevState => ({
      ...prevState,
      currentPlayer: updatedGameState.turn,
      gameOver: true,
      winner: winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username)
    }))

    setDropAnimation(prev => ({
      ...prev,
      newBoardState: updatedGameState.boardState
    }))
  }
  
  // Show the modal with username
  setWinner(winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username))
  setShowModal(true)
})

  return () => {
    socket.off('gameUpdate')
    socket.off('gameOver')
  }
}, [socket, gameState.board])

  // Modify the animation loop
useEffect(() => {
  if (!ctx || !dropAnimation) return

  const animate = () => {
    if (!dropAnimation) return
    
    // Clear the canvas and redraw the board
    drawBoard(canvasRef.current, ctx)
    drawPieces(ctx, gameState.board)

    // Draw the dropping piece
    const { col, targetRow, color, currentY } = dropAnimation
    const targetY = targetRow * 100 + 50
    const x = col * 100 + 50

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, currentY, 40, 0, Math.PI * 2)
    ctx.fill()

    // Update position
    if (currentY < targetY) {
      setDropAnimation(prev => ({
        ...prev,
        currentY: Math.min(prev.currentY + 15, targetY)
      }))
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      // Animation is complete - now update the board state
      if (dropAnimation.newBoardState) {
        setGameState(prevState => ({
          ...prevState,
          board: dropAnimation.newBoardState
        }))
      }
      setDropAnimation(null)
      setIsPieceDropping(false)
    }
  }

  animationFrameRef.current = requestAnimationFrame(animate)

  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }
}, [ctx, dropAnimation, gameState.board])

 // Initialize canvas
useEffect(() => {
  if (canvasRef.current) {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    setCtx(context)
    
    canvas.width = 700
    canvas.height = 600
    
    // Draw initial board immediately after setting dimensions
    const initialCtx = canvas.getContext('2d')
    drawBoard(canvas, initialCtx)
    drawPieces(initialCtx, gameState.board)
  }
}, [])

  // Redraw board when game state changes
useEffect(() => {
  if (ctx && canvasRef.current && !dropAnimation) {
    drawBoard(canvasRef.current, ctx)
    drawPieces(ctx, gameState.board)
  }
}, [gameState, ctx])

  const findBoardChanges = (oldBoard, newBoard) => {
    const changes = []
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (oldBoard[row][col] !== newBoard[row][col]) {
          changes.push([row, col, newBoard[row][col]])
        }
      }
    }
    return changes
  }

  const startDropAnimation = (col, targetRow, color) => {
    setIsPieceDropping(true)
    setDropAnimation({
      col,
      targetRow,
      color,
      currentY: -50 // Start above the board
    })
  }

  const handleCreateGame = () => {
    const newGameId = Math.random().toString(36).substring(2, 9)
    setActiveGameId(newGameId)
    setIsHost(true)
    
    socket.emit('joinGame', 'connectFour', newGameId, userInfo.username)
  }

  const handleJoinGame = () => {
    if (!gameIdInput) {
      alert('Please enter the game ID')
      return
    }
    
    socket.emit('joinGame', 'connectFour', gameIdInput, userInfo.username)
    setActiveGameId(gameIdInput)
    setIsHost(false)
  }

  const drawBoard = (canvas, ctx) => {
    ctx.fillStyle = '#0047ab'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#fff'
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const x = col * 100 + 50
        const y = row * 100 + 50
        ctx.beginPath()
        ctx.arc(x, y, 40, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawPieces = (ctx, board) => {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] !== null) {
          const x = col * 100 + 50
          const y = row * 100 + 50
          ctx.fillStyle = board[row][col] === 1 ? gameState.playerOneColor : gameState.playerTwoColor
          ctx.beginPath()
          ctx.arc(x, y, 40, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }


  const animateDrop = (col) => {
    if (gameState.gameOver || isPieceDropping) return
    
    const player = isHost ? 1 : 2
    if (player !== gameState.currentPlayer) {
      alert("It's not your turn!")
      return
    }

    socket.emit('makeMove', {
      gameType: 'connectFour',
      gameId: activeGameId,
      moveData: col,
      player
    })
  }

  const handleCanvasClick = (e) => {
    if (gameState.gameOver || !ctx) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const col = Math.floor(x / 100)
    
    if (col >= 0 && col < 7) {
      animateDrop(col)
    }
  }




  useEffect(() => {
  if (socket) {
    socket.on('statsUpdate', ({ playerId, stats }) => {
      // Only update if these stats belong to the current user
      if (playerId === userInfo._id) {
        dispatch(updateUserStats(stats));
      }

    });

    return () => {
      socket.off('statsUpdate');
    };
  }
}, [socket, userInfo._id, dispatch]);


  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <GameOverModal
        show={showModal}
        handleClose={handleCloseModal}
        gameTitle="Game Over"
        gameOverMessage={winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
      />

      {!activeGameId ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button
              onClick={handleCreateGame}
              variant='primary'
            >
              Create Game
            </Button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter game ID"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                className="px-4 py-2 border rounded"
              />
              <Button
                onClick={handleJoinGame}
                variant='success'
              >
                Join Game
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-lg">
            Game ID: <span className="font-bold">{activeGameId}</span>
          </div>
          {/* Update the player display */}
          <div className="text-lg">
            Playing as: <span className="font-bold">
              {isHost 
                ? `${player1Username} (Red)` 
                : `${player2Username} (Yellow)`}
            </span>
          </div>
          {/* <div className="text-lg">
            Playing as: <span className="font-bold">{isHost ? 'Player 1 (Red)' : 'Player 2 (Yellow)'}</span>
          </div> */}
          {/* <div className="text-lg">
            Current Turn: <span className="font-bold">
              {gameState.currentPlayer === 1 ? 'Player 1 (Red)' : 'Player 2 (Yellow)'}
            </span>
          </div> */}
          {/* Update the display of current turn */}
            <div className="text-lg">
              Current Turn: <span className="font-bold">
                {gameState.currentPlayer === 1 
                  ? `${player1Username} (Red)` 
                  : `${player2Username} (Yellow)`}
              </span>
            </div>
        </>
      )}

      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-gray-300 bg-white"
        style={{ backgroundColor: 'white' }}
      />
    </div>
  )
}

export default ConnectFourOld