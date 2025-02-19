const docId = id => document.getElementById(id)

const canvas = docId('gameCanvas')
const ctx = canvas.getContext('2d')

canvas.width = 700
canvas.height = 600

let board, currentPlayer, gameOver, pieceDropping, playerOneColor, playerTwoColor, gameMode, difficulty

const colors = ['red', 'yellow']

const playGameButton = docId('playGame')
const gameModeOptionsContainer = docId('gameModeOptionsContainer')
const opponentOptions = document.querySelectorAll('.opponent-option')
const difficultyOptionsContainer = docId('difficultyOptionsContainer')
const difficultyOptions = document.querySelectorAll('.difficulty-option')
const playerOne = docId('playerOne')
const secondPlayer = docId('secondPlayer')
const modal = docId('modal')
const statusDisplay = docId('status')

function drawBoard() {
  ctx.fillStyle = '#0047ab'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#fff'
  for(let row = 0; row < 6; row++) {
    for(let col = 0; col < 7; col++) {
      let x = col * 100 + 50
      let y = row * 100 + 50
      ctx.beginPath()
      ctx.arc(x, y, 40, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawPieces() {
  for(let row = 0; row < 6; row++) {
    for(let col = 0; col < 7; col++) {
      if(board[row][col] !== null) {
        let x = col * 100 + 50
        let y = row * 100 + 50
        ctx.fillStyle = board[row][col] === 0 ? playerOneColor : playerTwoColor
        ctx.beginPath()
        ctx.arc(x, y, 40, 0, Math.PI * 2)
        ctx.fill()
      }     
    }
  }
}

function updateTurn() {
  if(!gameOver) {
    if(currentPlayer === 0) {
      playerOne.classList.add('highlighted-text')
      secondPlayer.classList.remove('highlighted-text')
    } else {
      playerOne.classList.remove('highlighted-text')
      secondPlayer.classList.add('highlighted-text')
    }

    if(gameMode === 'computer' && currentPlayer === 1) {
      setTimeout(computerMove, 500)
    }
  }
}

function startGame() {
  board = Array(6).fill(null).map(() => Array(7).fill(null))
  currentPlayer = Math.floor(Math.random() * 2)
  gameOver = false
  pieceDropping = false
  playerOneColor = colors[Math.floor(Math.random() * 2)]
  playerTwoColor = colors.filter(color => color !== playerOneColor)[0]
  drawBoard()
  drawPieces()
  updateTurn()
}

playGameButton.addEventListener('click', function() {
  this.classList.add('hidden')
  gameModeOptionsContainer.classList.remove('hidden')
})

opponentOptions.forEach(opponentOption => {
  opponentOption.addEventListener('click', function() {
    gameMode = this.dataset.opponent
    gameModeOptionsContainer.classList.add('hidden')
    playerOne.innerText = 'Player One'
    secondPlayer.innerText = gameMode === 'player' ? 'Player Two' : 'Computer'
    if(gameMode === 'player') {
      startGame()
    } else {
      difficultyOptionsContainer.classList.remove('hidden')
    }
  })
})

difficultyOptions.forEach(difficultyOption => {
  difficultyOption.addEventListener('click', function() {
    difficulty = this.dataset.difficulty
    difficultyOptionsContainer.classList.add('hidden')
    startGame()
  })
})

modal.addEventListener('click', function() {
  this.classList.add('hidden')
})

function getLowestEmptyRow(col) {
  for(let row = 5; row >= 0; row--) {
    if(board[row][col] === null) return row
  }
  return -1
}

function getLowestEmptyRowForBoard(tempBoard, col) {
  for(let row = 5; row >= 0; row--) {
    if(tempBoard[row][col] === null) return row
  }
  return -1
}

function announceWinner(winner) {
  statusDisplay.textContent = `Game Over - ${winner === 0 ? 'Player One' : gameMode === 'player' ? 'Player Two' : 'Computer'} Wins!`
  gameOver = true
  modal.classList.remove('hidden')
  playGameButton.classList.remove('hidden')
}

function checkWinner() {

  // Check horizontal
  for(let row = 0; row < 6; row++) {
    for(let col = 0; col < 4; col++) {
      if(board[row][col] !== null &&
        board[row][col] === board[row][col + 1] &&
        board[row][col] === board[row][col + 2] &&
        board[row][col] === board[row][col + 3] 
      ) {
        announceWinner(board[row][col])
        return true
      }
    }
  }

  // Check vertical
  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 7; col++) {
      if(board[row][col] !== null &&
        board[row][col] === board[row + 1][col] &&
        board[row][col] === board[row + 2][col] &&
        board[row][col] === board[row + 3][col] 
      ) {
        announceWinner(board[row][col])
        return true
      }
    }
  }

  // Check diagonal top-left - bottom-right
  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 4; col++) {
      if(board[row][col] !== null &&
        board[row][col] === board[row + 1][col + 1] &&
        board[row][col] === board[row + 2][col + 2] &&
        board[row][col] === board[row + 3][col + 3] 
      ) {
        announceWinner(board[row][col])
        return true
      }
    }
  }

  // Check diagonal top-right - bottom-left
  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 7; col++) {
      if(board[row][col] !== null &&
        board[row][col] === board[row + 1][col - 1] &&
        board[row][col] === board[row + 2][col - 2] &&
        board[row][col] === board[row + 3][col - 3] 
      ) {
        announceWinner(board[row][col])
        return true
      }
    }
  }

  // Check for Draw
  let isBoardFull = board.every(row => row.every(cell => cell !== null))
  if(isBoardFull) {
    statusDisplay.textContent = "Game Over - It's a Draw!"
    gameOver = true
    modal.classList.remove('hidden')
    playGameButton.classList.remove('hidden')
    return true
  }

  return false
}

function animateDrop(col, player) {
  if(gameOver || pieceDropping) return

  let row = getLowestEmptyRow(col)
  if(row === -1) return

  let x = col * 100 + 50
  let y = -40
  let targetY = row * 100 + 50
  let speed = 7
  let bounceHeight = 10

  function fall() {
    pieceDropping = true
    ctx.clearRect(0,0, canvas.width, canvas.height)
    drawBoard()
    drawPieces()
    ctx.fillStyle = player === 0 ? playerOneColor : playerTwoColor
    ctx.beginPath()
    ctx.arc(x, y, 40, 0, Math.PI * 2)
    ctx.fill()

    if(y < targetY + bounceHeight) {
      y += speed
      requestAnimationFrame(fall)
    } else {
      bounce()
    }
  }

  function bounce() {
    let bounceUp = true
    function animateBounce() {
      ctx.clearRect(0,0, canvas.width, canvas.height)
      drawBoard()
      drawPieces()
      ctx.fillStyle = player === 0 ? playerOneColor : playerTwoColor
      ctx.beginPath()
      ctx.arc(x, y, 40, 0, Math.PI * 2)
      ctx.fill()

      if(bounceUp && y > targetY - bounceHeight) {
        y -= speed / 2
        requestAnimationFrame(animateBounce)
      } else if (!bounceUp && y < targetY) {
        y += speed / 2
        requestAnimationFrame(animateBounce)
      } else {
        board[row][col] = player
        drawBoard()
        drawPieces()
        pieceDropping = false

        if(!checkWinner()) {
          currentPlayer = currentPlayer === 0 ? 1: 0
          updateTurn()
        }
      }

      bounceUp = !bounceUp
    }
    animateBounce()
  }

  fall()
}

canvas.addEventListener('click', e => {
  if(gameOver || pieceDropping) return
  if(gameMode === 'computer' && currentPlayer === 1) return
  let col = Math.floor(e.offsetX / 100)
  if(col >= 0 && col < 7) {
    animateDrop(col, currentPlayer)
  }
})