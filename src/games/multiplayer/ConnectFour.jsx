// import { useRef, useState, useEffect } from 'react'
// import { io } from 'socket.io-client'
// import GameOverModal from '../../components/GameOverModal'
// import { Button } from 'react-bootstrap'
// import { useSelector, useDispatch } from 'react-redux'
// import { updateUserStats } from '../../slices/authSlice'

// const ConnectFour = () => {
//   const { userInfo } = useSelector(state => state.auth)
//   const dispatch = useDispatch()
//   const canvasRef = useRef()
//   const animationFrameRef = useRef()
//   const [ctx, setCtx] = useState(null)
//   const [socket, setSocket] = useState(null)
//   const [activeGameId, setActiveGameId] = useState(null)
//   const [gameIdInput, setGameIdInput] = useState('')
//   const [isHost, setIsHost] = useState(false)
//   const [gameState, setGameState] = useState({
//     board: Array(6).fill(null).map(() => Array(7).fill(null)),
//     currentPlayer: null,
//     playerOneColor: 'red',
//     playerTwoColor: 'yellow',
//     gameOver: true,
//     winner: null,
//     gamesPlayed: 0
//   })
//   const [dropAnimation, setDropAnimation] = useState(null)
//   const [isPieceDropping, setIsPieceDropping] = useState(false)
//   const [showModal, setShowModal] = useState(false)
//   const [winner, setWinner] = useState(null)
//   const [player1Username, setPlayer1Username] = useState(null)
//   const [player2Username, setPlayer2Username] = useState(null)
//   const [playAgainRequested, setPlayAgainRequested] = useState(false)
//   const [showPlayAgainModal, setShowPlayAgainModal] = useState(false)

//   // Initialize socket connection
//   useEffect(() => {
//     const newSocket = io('http://192.168.2.51:5000')
//     setSocket(newSocket)
//     return () => newSocket.close()
//   }, [])

//   // Socket event handlers
//   useEffect(() => {
//     if (!socket) return

//     socket.on('gameUpdate', (updatedGame) => {
//       if (updatedGame.player1 && !player1Username) {
//         setPlayer1Username(updatedGame.player1)
//       }
//       if (updatedGame.player2 && !player2Username) {
//         setPlayer2Username(updatedGame.player2)
//       }

//       const changes = findBoardChanges(gameState.board, updatedGame.boardState)
//       if (changes.length > 0) {
//         const [row, col, value] = changes[0]
//         startDropAnimation(col, row, value === 1 ? gameState.playerOneColor : gameState.playerTwoColor)
        
//         setGameState(prevState => ({
//           ...prevState,
//           currentPlayer: updatedGame.turn,
//           gameOver: updatedGame.gameOver,
//           gamesPlayed: updatedGame.gamesPlayed || prevState.gamesPlayed
//         }))

//         setDropAnimation(prev => ({
//           ...prev,
//           newBoardState: updatedGame.boardState
//         }))
//       } else {
//         setGameState(prevState => ({
//           ...prevState,
//           board: updatedGame.boardState,
//           currentPlayer: updatedGame.turn,
//           gameOver: updatedGame.gameOver,
//           gamesPlayed: updatedGame.gamesPlayed || prevState.gamesPlayed
//         }))
//       }
//     })

//     socket.on('gameOver', (data) => {
//       const { winner, gameState: updatedGameState } = data
      
//       const changes = findBoardChanges(gameState.board, updatedGameState.boardState)
//       if (changes.length > 0) {
//         const [row, col, value] = changes[0]
//         startDropAnimation(col, row, value === 1 ? gameState.playerOneColor : gameState.playerTwoColor)
        
//         setGameState(prevState => ({
//           ...prevState,
//           currentPlayer: updatedGameState.turn,
//           gameOver: true,
//           winner: winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username),
//           gamesPlayed: prevState.gamesPlayed + 1
//         }))

//         setDropAnimation(prev => ({
//           ...prev,
//           newBoardState: updatedGameState.boardState
//         }))
//       }
      
//       setWinner(winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username))
//       setShowModal(true)
//     })

//     socket.on('playAgainRequest', () => {
//       setShowPlayAgainModal(true)
//     })

//     socket.on('playAgainAccepted', (newGameState) => {
//       setShowModal(false)
//       setShowPlayAgainModal(false)
//       setPlayAgainRequested(false)
//       setGameState(prevState => ({
//         ...prevState,
//         board: Array(6).fill(null).map(() => Array(7).fill(null)),
//         currentPlayer: newGameState.turn,
//         gameOver: false,
//         winner: null
//       }))
//     })

//     socket.on('playAgainDeclined', () => {
//       setPlayAgainRequested(false)
//       alert('The other player declined to play again.')
//     })

//     socket.on('statsUpdate', ({ playerId, stats }) => {
//       if (playerId === userInfo._id) {
//         dispatch(updateUserStats(stats))
//       }
//     })

//     return () => {
//       socket.off('gameUpdate')
//       socket.off('gameOver')
//       socket.off('playAgainRequest')
//       socket.off('playAgainAccepted')
//       socket.off('playAgainDeclined')
//       socket.off('statsUpdate')
//     }
//   }, [socket, gameState.board, userInfo._id, dispatch])

//   // Animation effects
//   useEffect(() => {
//     if (!ctx || !dropAnimation) return

//     const animate = () => {
//       if (!dropAnimation) return
      
//       drawBoard(canvasRef.current, ctx)
//       drawPieces(ctx, gameState.board)

//       const { col, targetRow, color, currentY } = dropAnimation
//       const targetY = targetRow * 100 + 50
//       const x = col * 100 + 50

//       ctx.fillStyle = color
//       ctx.beginPath()
//       ctx.arc(x, currentY, 40, 0, Math.PI * 2)
//       ctx.fill()

//       if (currentY < targetY) {
//         setDropAnimation(prev => ({
//           ...prev,
//           currentY: Math.min(prev.currentY + 15, targetY)
//         }))
//         animationFrameRef.current = requestAnimationFrame(animate)
//       } else {
//         if (dropAnimation.newBoardState) {
//           setGameState(prevState => ({
//             ...prevState,
//             board: dropAnimation.newBoardState
//           }))
//         }
//         setDropAnimation(null)
//         setIsPieceDropping(false)
//       }
//     }

//     animationFrameRef.current = requestAnimationFrame(animate)

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current)
//       }
//     }
//   }, [ctx, dropAnimation, gameState.board])

//   // Initialize canvas
//   useEffect(() => {
//     if (canvasRef.current) {
//       const canvas = canvasRef.current
//       const context = canvas.getContext('2d')
//       setCtx(context)
      
//       canvas.width = 700
//       canvas.height = 600
      
//       const initialCtx = canvas.getContext('2d')
//       drawBoard(canvas, initialCtx)
//       drawPieces(initialCtx, gameState.board)
//     }
//   }, [])

//   // Redraw board when game state changes
//   useEffect(() => {
//     if (ctx && canvasRef.current && !dropAnimation) {
//       drawBoard(canvasRef.current, ctx)
//       drawPieces(ctx, gameState.board)
//     }
//   }, [gameState, ctx])

//   const findBoardChanges = (oldBoard, newBoard) => {
//     const changes = []
//     for (let row = 0; row < 6; row++) {
//       for (let col = 0; col < 7; col++) {
//         if (oldBoard[row][col] !== newBoard[row][col]) {
//           changes.push([row, col, newBoard[row][col]])
//         }
//       }
//     }
//     return changes
//   }

//   const startDropAnimation = (col, targetRow, color) => {
//     setIsPieceDropping(true)
//     setDropAnimation({
//       col,
//       targetRow,
//       color,
//       currentY: -50
//     })
//   }

//   const handleCreateGame = () => {
//     const newGameId = Math.random().toString(36).substring(2, 9)
//     setActiveGameId(newGameId)
//     setIsHost(true)
//     socket.emit('joinGame', 'connectFour', newGameId, userInfo.username)
//   }

//   const handleJoinGame = () => {
//     if (!gameIdInput) {
//       alert('Please enter the game ID')
//       return
//     }
//     socket.emit('joinGame', 'connectFour', gameIdInput, userInfo.username)
//     setActiveGameId(gameIdInput)
//     setIsHost(false)
//   }

//   const drawBoard = (canvas, ctx) => {
//     ctx.fillStyle = '#0047ab'
//     ctx.fillRect(0, 0, canvas.width, canvas.height)

//     ctx.fillStyle = '#fff'
//     for (let row = 0; row < 6; row++) {
//       for (let col = 0; col < 7; col++) {
//         const x = col * 100 + 50
//         const y = row * 100 + 50
//         ctx.beginPath()
//         ctx.arc(x, y, 40, 0, Math.PI * 2)
//         ctx.fill()
//       }
//     }
//   }

//   const drawPieces = (ctx, board) => {
//     for (let row = 0; row < 6; row++) {
//       for (let col = 0; col < 7; col++) {
//         if (board[row][col] !== null) {
//           const x = col * 100 + 50
//           const y = row * 100 + 50
//           ctx.fillStyle = board[row][col] === 1 ? gameState.playerOneColor : gameState.playerTwoColor
//           ctx.beginPath()
//           ctx.arc(x, y, 40, 0, Math.PI * 2)
//           ctx.fill()
//         }
//       }
//     }
//   }

//   const handleCanvasClick = (e) => {
//     if (gameState.gameOver || !ctx) return
//     const rect = canvasRef.current.getBoundingClientRect()
//     const x = e.clientX - rect.left
//     const col = Math.floor(x / 100)
    
//     if (col >= 0 && col < 7) {
//       animateDrop(col)
//     }
//   }

//   const animateDrop = (col) => {
//     if (gameState.gameOver || isPieceDropping) return
    
//     const player = isHost ? 1 : 2
//     if (player !== gameState.currentPlayer) {
//       alert("It's not your turn!")
//       return
//     }

//     socket.emit('makeMove', {
//       gameType: 'connectFour',
//       gameId: activeGameId,
//       moveData: col,
//       player
//     })
//   }

//   const handlePlayAgainRequest = () => {
//     if (socket && activeGameId) {
//       socket.emit('requestPlayAgain', {
//         gameId: activeGameId,
//         requestingPlayer: isHost ? 1 : 2
//       })
//       setPlayAgainRequested(true)
//     }
//   }

//   const handlePlayAgainResponse = (accepted) => {
//     if (socket && activeGameId) {
//       socket.emit('respondToPlayAgain', {
//         gameId: activeGameId,
//         accepted,
//         respondingPlayer: isHost ? 1 : 2
//       })
//       setShowPlayAgainModal(false)
//     }
//   }

//   const handleCloseModal = () => {
//     setShowModal(false)
//   }

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <GameOverModal
//         show={showModal}
//         handleClose={handleCloseModal}
//         gameTitle="Game Over"
//         gameOverMessage={winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
//         showPlayAgain={!playAgainRequested}
//         onPlayAgain={handlePlayAgainRequest}
//       />

//       {/* Play Again Request Modal */}
//       {showPlayAgainModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-lg">
//             <h3 className="text-xl mb-4">Play Again?</h3>
//             <p className="mb-4">{player1Username} wants to play again!</p>
//             <div className="flex gap-4">
//               <Button
//                 onClick={() => handlePlayAgainResponse(true)}
//                 variant="success"
//               >
//                 Accept
//               </Button>
//               <Button
//                 onClick={() => handlePlayAgainResponse(false)}
//                 variant="danger"
//               >
//                 Decline
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {!activeGameId ? (
//         <div className="flex flex-col gap-4">
//           <div className="flex gap-4">
//             <Button
//               onClick={handleCreateGame}
//               variant='primary'
//             >
//               Create Game
//             </Button>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 placeholder="Enter game ID"
//                 value={gameIdInput}
//                 onChange={(e) => setGameIdInput(e.target.value)}
//                 className="px-4 py-2 border rounded"
//               />
//               <Button
//                 onClick={handleJoinGame}
//                 variant='success'
//               >
//                 Join Game
//               </Button>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <>
//           <div className="text-lg">
//             Game ID: <span className="font-bold">{activeGameId}</span>
//           </div>
//           <div className="text-lg">
//             Playing as: <span className="font-bold">
//               {isHost 
//                 ? `${player1Username} (Red)` 
//                 : `${player2Username} (Yellow)`}
//             </span>
//           </div>
//           <div className="text-lg">
//             Current Turn: <span className="font-bold">
//               {gameState.currentPlayer === 1 
//                 ? `${player1Username} (Red)` 
//                 : `${player2Username} (Yellow)`}
//             </span>
//           </div>
//         </>
//       )}

//       <canvas 
//         ref={canvasRef}
//         onClick={handleCanvasClick}
//         className="border border-gray-300 bg-white"
//         style={{ backgroundColor: 'white' }}
//       />
//     </div>
//   )
// }

// export default ConnectFour

import { useRef, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import GameOverModal from '../../components/GameOverModal'
import { Button } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserStats } from '../../slices/authSlice'

const ConnectFour = () => {
  const { userInfo } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const canvasRef = useRef()
  const animationFrameRef = useRef()
  const [ctx, setCtx] = useState(null)
  const [socket, setSocket] = useState(null)
  const [activeGameId, setActiveGameId] = useState(null)
  const [gameIdInput, setGameIdInput] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [gameState, setGameState] = useState({
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: null,
    playerOneColor: 'red',
    playerTwoColor: 'yellow',
    gameOver: true,
    winner: null,
    gamesPlayed: 0
  })
  const [dropAnimation, setDropAnimation] = useState(null)
  const [isPieceDropping, setIsPieceDropping] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [winner, setWinner] = useState(null)
  const [player1Username, setPlayer1Username] = useState(null)
  const [player2Username, setPlayer2Username] = useState(null)
  const [playAgainRequested, setPlayAgainRequested] = useState(false)
  const [showPlayAgainModal, setShowPlayAgainModal] = useState(false)
  const [isWaitingForRematchResponse, setIsWaitingForRematchResponse] = useState(false)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://192.168.2.51:5000')
    setSocket(newSocket)
    return () => newSocket.close()
  }, [])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    socket.on('gameUpdate', (updatedGame) => {
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
          gameOver: updatedGame.gameOver,
          gamesPlayed: updatedGame.gamesPlayed || prevState.gamesPlayed
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
          gameOver: updatedGame.gameOver,
          gamesPlayed: updatedGame.gamesPlayed || prevState.gamesPlayed
        }))
      }
    })

    socket.on('gameOver', (data) => {
      const { winner, gameState: updatedGameState } = data
      
      const changes = findBoardChanges(gameState.board, updatedGameState.boardState)
      if (changes.length > 0) {
        const [row, col, value] = changes[0]
        startDropAnimation(col, row, value === 1 ? gameState.playerOneColor : gameState.playerTwoColor)
        
        setGameState(prevState => ({
          ...prevState,
          currentPlayer: updatedGameState.turn,
          gameOver: true,
          winner: winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username),
          gamesPlayed: prevState.gamesPlayed + 1
        }))

        setDropAnimation(prev => ({
          ...prev,
          newBoardState: updatedGameState.boardState
        }))
      }
      
      setWinner(winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username))
      setShowModal(true)
    })

    socket.on('playAgainRequest', ({ requestingPlayer }) => {
      const isRequester = (requestingPlayer === 1 && isHost) || 
                         (requestingPlayer === 2 && !isHost);
      
      if (!isRequester) {
        setShowPlayAgainModal(true)
      }
    })

    socket.on('playAgainAccepted', (newGameState) => {
      setShowModal(false)
      setShowPlayAgainModal(false)
      setPlayAgainRequested(false)
      setIsWaitingForRematchResponse(false)
      setGameState(prevState => ({
        ...prevState,
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        currentPlayer: 1,
        gameOver: false,
        winner: null
      }))
    })

    socket.on('playAgainDeclined', () => {
      setPlayAgainRequested(false)
      setIsWaitingForRematchResponse(false)
      alert('The other player declined to play again.')
    })

    socket.on('statsUpdate', ({ playerId, stats }) => {
      if (playerId === userInfo._id) {
        dispatch(updateUserStats(stats))
      }
    })

    return () => {
      socket.off('gameUpdate')
      socket.off('gameOver')
      socket.off('playAgainRequest')
      socket.off('playAgainAccepted')
      socket.off('playAgainDeclined')
      socket.off('statsUpdate')
    }
  }, [socket, gameState.board, userInfo._id, dispatch, isHost, player1Username, player2Username])

  // Animation effects
  useEffect(() => {
    if (!ctx || !dropAnimation) return

    const animate = () => {
      if (!dropAnimation) return
      
      drawBoard(canvasRef.current, ctx)
      drawPieces(ctx, gameState.board)

      const { col, targetRow, color, currentY } = dropAnimation
      const targetY = targetRow * 100 + 50
      const x = col * 100 + 50

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, currentY, 40, 0, Math.PI * 2)
      ctx.fill()

      if (currentY < targetY) {
        setDropAnimation(prev => ({
          ...prev,
          currentY: Math.min(prev.currentY + 15, targetY)
        }))
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
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
      currentY: -50
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

  const handleCanvasClick = (e) => {
    if (gameState.gameOver || !ctx) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const col = Math.floor(x / 100)
    
    if (col >= 0 && col < 7) {
      animateDrop(col)
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

  const handlePlayAgainRequest = () => {
    if (socket && activeGameId) {
      socket.emit('requestPlayAgain', {
        gameId: activeGameId,
        requestingPlayer: isHost ? 1 : 2
      })
      setIsWaitingForRematchResponse(true)
      setPlayAgainRequested(true)
    }
  }

  const handlePlayAgainResponse = (accepted) => {
    if (socket && activeGameId) {
      socket.emit('respondToPlayAgain', {
        gameId: activeGameId,
        accepted,
        respondingPlayer: isHost ? 1 : 2
      })
      setShowPlayAgainModal(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <GameOverModal
        show={showModal}
        handleClose={handleCloseModal}
        gameTitle="Game Over"
        gameOverMessage={winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
        showPlayAgain={!playAgainRequested}
        onPlayAgain={handlePlayAgainRequest}
        waitingMessage={isWaitingForRematchResponse ? "Waiting for opponent's response..." : null}
      />

      {showPlayAgainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-xl mb-4">Play Again?</h3>
            <p className="mb-4">{isHost ? player2Username : player1Username} wants to play again!</p>
            <div className="flex gap-4">
              <Button
                onClick={() => handlePlayAgainResponse(true)}
                variant="success"
              >
                Accept
              </Button>
              <Button
                onClick={() => handlePlayAgainResponse(false)}
                variant="danger"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

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
          <div className="text-lg">
            Playing as: <span className="font-bold">
              {isHost 
                ? `${player1Username} (Red)` 
                : `${player2Username} (Yellow)`}
            </span>
          </div>
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

export default ConnectFour