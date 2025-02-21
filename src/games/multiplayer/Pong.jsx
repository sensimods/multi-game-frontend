import { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import GameOverModal from '../../components/GameOverModal';
import { Button, Container } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserStats } from '../../slices/authSlice';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const BALL_SIZE = 10;
const BALL_SPEED = 7;
const PADDLE_SPEED = 8;

const Pong = () => {
  const { userInfo } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const canvasRef = useRef();
  const [ctx, setCtx] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameIdInput, setGameIdInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState(null);
  const [player1Username, setPlayer1Username] = useState(null);
  const [player2Username, setPlayer2Username] = useState(null);
  const animationFrameRef = useRef();
  const lastUpdateRef = useRef(Date.now());

  // Initialize socket connection
  useEffect(() => {
    console.log('hey')
    const newSocket = io('http://192.168.2.51:5000');
    
    // Add connection error handling
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('gameUpdate', (updatedGame) => {
      // Validate incoming game state
      if (!updatedGame || typeof updatedGame !== 'object') return;

      if (updatedGame.player1 && !player1Username) {
        setPlayer1Username(updatedGame.player1);
      }
      if (updatedGame.player2 && !player2Username) {
        setPlayer2Username(updatedGame.player2);
      }
      setGameState(updatedGame);
    });

    socket.on('gameOver', ({ winner, gameState: finalState }) => {
      setGameState(finalState);
      setWinner(winner === 'draw' ? 'Draw' : (winner === 1 ? player1Username : player2Username));
      setShowModal(true);

      // Update user stats if needed
      if (userInfo && dispatch) {
        dispatch(updateUserStats({
          gameType: 'pong',
          result: winner === (isHost ? 1 : 2) ? 'win' : 'loss'
        }));
      }
    });

    return () => {
      socket.off('gameUpdate');
      socket.off('gameOver');
    };
  }, [socket, player1Username, player2Username, isHost, userInfo, dispatch]);

  // Handle keyboard controls with rate limiting
  useEffect(() => {
    if (!socket || !activeGameId || !gameState) return;

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && 
          currentTime - lastUpdateRef.current > 16) { // 60fps rate limiting
        
        socket.emit('makeMove', {
          gameType: 'pong',
          gameId: activeGameId,
          moveData: {
            direction: e.key === 'ArrowUp' ? 'up' : 'down',
            player: isHost ? 1 : 2,
            timestamp: currentTime
          }
        });
        lastUpdateRef.current = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket, activeGameId, isHost, gameState]);

  // Draw game state
  useEffect(() => {
    if (!ctx || !gameState) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center line
      ctx.setLineDash([20, 15]);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = '#FFFFFF';
      // Only draw paddles if their positions are valid numbers
      if (!isNaN(gameState.paddle1X) && !isNaN(gameState.paddle1Y)) {
        ctx.fillRect(
          gameState.paddle1X,
          gameState.paddle1Y,
          PADDLE_WIDTH,
          PADDLE_HEIGHT
        );
      }
      if (!isNaN(gameState.paddle2X) && !isNaN(gameState.paddle2Y)) {
        ctx.fillRect(
          gameState.paddle2X,
          gameState.paddle2Y,
          PADDLE_WIDTH,
          PADDLE_HEIGHT
        );
      }

      // Draw ball
      if (!isNaN(gameState.ballX) && !isNaN(gameState.ballY)) {
        ctx.beginPath();
        ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();
      }

      // Draw scores
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(gameState.score1?.toString() || '0', CANVAS_WIDTH / 4, 60);
      ctx.fillText(gameState.score2?.toString() || '0', (CANVAS_WIDTH * 3) / 4, 60);

      // Draw player names
      ctx.font = 'bold 24px Arial';
      ctx.fillText(player1Username || 'Player 1', CANVAS_WIDTH / 4, 100);
      ctx.fillText(player2Username || 'Player 2', (CANVAS_WIDTH * 3) / 4, 100);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ctx, gameState, player1Username, player2Username]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const context = canvas.getContext('2d');
      // Enable image smoothing for better ball rendering
      context.imageSmoothingEnabled = true;
      setCtx(context);
    }
  }, []);

  const handleCreateGame = () => {
    const newGameId = Math.random().toString(36).substring(2, 9);
    setActiveGameId(newGameId);
    setIsHost(true);
    socket.emit('joinGame', 'pong', newGameId, userInfo.username);
  };

  const handleJoinGame = () => {
    if (!gameIdInput) {
      alert('Please enter the game ID');
      return;
    }
    socket.emit('joinGame', 'pong', gameIdInput, userInfo.username);
    setActiveGameId(gameIdInput);
    setIsHost(false);
  };

  const handlePlayAgain = () => {
    if (socket && activeGameId) {
      socket.emit('playAgain', {
        gameType: 'pong',
        gameId: activeGameId
      });
      setShowModal(false);
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center gap-4 p-4">
      <GameOverModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        gameTitle="Game Over"
        gameOverMessage={winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
        showPlayAgain={true}
        onPlayAgain={handlePlayAgain}
      />

      {!activeGameId ? (
        <div className="d-flex flex-column gap-4">
          <div className="d-flex gap-4">
            <Button onClick={handleCreateGame} variant="primary">
              Create Game
            </Button>
            <div className="d-flex gap-2">
              <input
                type="text"
                placeholder="Enter game ID"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                className="form-control"
              />
              <Button onClick={handleJoinGame} variant="success">
                Join Game
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="fs-5">
            Game ID: <span className="fw-bold">{activeGameId}</span>
          </div>
          <div className="fs-5">
            Playing as: <span className="fw-bold">
              {isHost ? player1Username : player2Username}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            style={{ 
              backgroundColor: 'black',
              border: '2px solid #dee2e6'
            }}
          />
          <div className="text-muted mt-2">
            Use Up/Down arrow keys to move your paddle
          </div>
        </>
      )}
    </Container>
  );
};

export default Pong;