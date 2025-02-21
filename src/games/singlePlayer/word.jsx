import { useRef, useState, useEffect } from 'react';
import {useSelector} from 'react-redux'
import '../styles/wordsearch.css';

const Wordsearch = () => {

  const {userInfo} = useSelector(state => state.auth)

  // Event States
  const [difficulty, setDifficulty] = useState('easy');
  const [timerInterval, setTimerInterval] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [words, setWords] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundWordCoordinates, setFoundWordCoordinates] = useState(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScores, setBestScores] = useState({
    easy: 0,
    medium: 0,
    hard: 0
  });
  const [gameActive, setGameActive] = useState(false);
  const [lastWordFoundTime, setLastWordFoundTime] = useState(0);
  const [grid, setGrid] = useState([]);
  const [cellSize, setCellSize] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const wordListRef = useRef(null);
  const ctxRef = useRef(null);

  // Constants
  const gridSize = { easy: 9, medium: 12, hard: 20 };

  
  useEffect(() => {
    console.log('userInfo: ', userInfo)
    setBestScores(prevState => ({
      ...prevState,
      easy: userInfo.bestScores.length > 0 ? userInfo.bestScores : 0
    }))
  }, [userInfo])

  useEffect(() => {
  if (canvasRef.current) {
    ctxRef.current = canvasRef.current.getContext('2d');
    initEmptyGrid(gridSize[difficulty]);
  }
}, [difficulty]); // Add difficulty as dependency

  // Initialize empty grid without starting the game
  function initEmptyGrid(size) {
  const newGrid = Array.from({ length: size }, () => Array(size).fill(""));
  setGrid(newGrid);
  setWords([]); // Clear words
  setFoundWords(new Set());
  setFoundWordCoordinates(new Map());
  setGameActive(false);
  setTimeElapsed(0);
  if (timerInterval) {
    clearInterval(timerInterval);
    setTimerInterval(null);
  }
  drawGrid();
}


  const startNewGame = async () => {
    setScore(0);
    setFoundWords(new Set());
    setFoundWordCoordinates(new Map());
    setGameActive(true);
    setTimeElapsed(0);
    
    // Generate words first
    await generateWords(gridSize[difficulty]);
  };



  // Modify the useEffect that handles word placement
useEffect(() => {
  if (words.length > 0 && gameActive) {
    // Create new grid with proper size
    const newGrid = Array.from(
      { length: gridSize[difficulty] }, 
      () => Array(gridSize[difficulty]).fill("")
    );
    
    // Place words and fill spaces
    placeWords(newGrid);
    fillEmptySpaces(newGrid);
    
    // Update grid and start timer
    setGrid(newGrid);
    startTimer();
  }
}, [words, gameActive, difficulty]);

  // Redraw grid when it changes
  useEffect(() => {
    if (grid.length > 0) {
      drawGrid();
    }
  }, [grid]);

 

  async function generateWords(size) {
  try {
    const numberOfWordsToRequest = size * 2;
    const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${numberOfWordsToRequest}`);
    const data = await response.json();
    
    let filteredWords = data
      .map(word => word.toUpperCase())
      .filter(word => word.length <= size && word.length >= 3);
    
    if (filteredWords.length < size - 2) {
      const additionalResponse = await fetch(`https://random-word-api.herokuapp.com/word?number=${numberOfWordsToRequest}`);
      const additionalData = await additionalResponse.json();
      
      const additionalWords = additionalData
        .map(word => word.toUpperCase())
        .filter(word => word.length <= size && word.length >= 3);
        
      filteredWords = [...filteredWords, ...additionalWords];
    }
    
    const finalWords = filteredWords.slice(0, size - 2);
    setWords(finalWords);
  } catch (error) {
    console.error("Error fetching words:", error);
    const fallbackWords = ["HELLO", "WORLD", "PLAY", "FUN", "GAME"].slice(0, size - 2);
    setWords(fallbackWords);
  }
}


  function placeWords(grid) {
    const unplacedWords = [];
    
    for (const word of words) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!placed && attempts < maxAttempts) {
        const row = Math.floor(Math.random() * grid.length);
        const col = Math.floor(Math.random() * grid.length);
        const direction = Math.floor(Math.random() * 8);
        
        placed = tryPlaceWord(word, row, col, direction, grid);
        attempts++;
      }
      
      if (!placed) {
        unplacedWords.push(word);
      }
    }
    
    if (unplacedWords.length > 0) {
      setWords(prevWords => prevWords.filter(word => !unplacedWords.includes(word)));
    }
  }

  function tryPlaceWord(word, row, col, direction, grid) {
    const directions = [
      [0, 1],   // right
      [1, 0],   // down
      [1, 1],   // diagonal down-right
      [-1, 1],  // diagonal up-right
      [0, -1],  // left
      [-1, 0],  // up
      [-1, -1], // diagonal up-left
      [1, -1]   // diagonal down-left
    ];
    
    const [dy, dx] = directions[direction];
    
    if (row + dy * (word.length - 1) < 0 || 
        row + dy * (word.length - 1) >= grid.length || 
        col + dx * (word.length - 1) < 0 || 
        col + dx * (word.length - 1) >= grid.length) {
      return false;
    }
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (grid[newRow][newCol] !== "" && grid[newRow][newCol] !== word[i]) {
        return false;
      }
    }
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      grid[newRow][newCol] = word[i];
    }
    
    return true;
  }

  function fillEmptySpaces(grid) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === "") {
          grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
  }


  function drawGrid() {
  if (!ctxRef.current || !canvasRef.current) return;
  
  const canvas = canvasRef.current;
  canvas.width = canvas.height = Math.min(400, window.innerWidth - 100);
  setCellSize(canvas.width / grid.length);
  
  const ctx = ctxRef.current;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid lines even if cells are empty
  const cellSize = canvas.width / grid.length;
  
  // Draw vertical lines
  for (let i = 0; i <= grid.length; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.strokeStyle = "#ccc";
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let i = 0; i <= grid.length; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.strokeStyle = "#ccc";
    ctx.stroke();
  }
  
  // Draw cells
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid.length; col++) {
      drawCell(row, col);
    }
  }
  
  // Draw found words highlights
  foundWordCoordinates.forEach((coordinates) => {
    highlightWord(coordinates, "rgba(0, 255, 0, 0.3)");
  });
  
  // Draw current selection highlight
  if (selectedLetters.length > 0) {
    highlightWord(selectedLetters, "rgba(255, 255, 0, 0.3)");
  }
}




  function drawCell(row, col, backgroundColor = "white") {
    const ctx = ctxRef.current;
    const x = col * cellSize;
    const y = row * cellSize;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, cellSize, cellSize);
    
    ctx.strokeStyle = "#ccc";
    ctx.strokeRect(x, y, cellSize, cellSize);
    
    ctx.fillStyle = "black";
    ctx.font = `bold ${cellSize * 0.6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(grid[row][col], x + cellSize / 2, y + cellSize / 2);
  }

  function highlightWord(coordinates, color) {
    coordinates.forEach(coord => {
      drawCell(coord.row, coord.col, color);
    });
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    setTimeElapsed(0);
    const newTimerInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    setTimerInterval(newTimerInterval);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }

  function updateScore(foundWord) {
    const totalWords = words.length;
    const baseScore = Math.round(1000 / totalWords);
    const now = timeElapsed;
    const timeTaken = foundWords.size === 0 ? now : now - lastWordFoundTime;
    
    setLastWordFoundTime(now);
    
    const maxExpectedTime = 60;
    const timeBonus = Math.max(0, 100 * (1 - (timeTaken / maxExpectedTime)));
    
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    }[difficulty];
    
    const points = Math.round((baseScore + timeBonus) * difficultyMultiplier);
    setScore(prev => prev + points);
  }


  function checkWord() {
    const selectedWord = selectedLetters.map(sel => sel.letter).join("");
    const reversedWord = selectedWord.split("").reverse().join("");
    
    let wordToMark = null;
    
    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
      wordToMark = selectedWord;
    } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
      wordToMark = reversedWord;
    }
    
    if (wordToMark) {
      // First update foundWords set
      setFoundWords(prev => new Set([...prev, wordToMark]));
      
      // Then update coordinates map and immediately highlight in green
      setFoundWordCoordinates(prev => {
        const next = new Map(prev);
        next.set(wordToMark, [...selectedLetters]);
        return next;
      });
      
      // Clear selection before redrawing
      setSelectedLetters([]);
      
      updateScore(wordToMark);
      
      // Force redraw to show green highlight
      drawGrid();
      
      if (foundWords.size + 1 === words.length) {
        stopTimer();
        setGameActive(false);
        
        if (score > bestScores[difficulty]) {
          setBestScores(prev => ({
            ...prev,
            [difficulty]: score
          }));
        }
        
        setTimeout(() => {
          alert(`Congratulations! You've found all the words!\nFinal Score: ${score}\nBest Score: ${bestScores[difficulty]}\nTime: ${timeElapsed}`);
        }, 100);
      }
    } else {
      // If word is not valid, clear selection
      setSelectedLetters([]);
      drawGrid();
    }
  }

  function selectLetter(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < grid.length && col >= 0 && col < grid.length) {
      if (selectedLetters.length === 0) {
        setSelectedLetters([{ row, col, letter: grid[row][col] }]);
        return;
      }
      
      const first = selectedLetters[0];
      const rowDir = Math.sign(row - first.row);
      const colDir = Math.sign(col - first.col);
      const rowDiff = Math.abs(row - first.row);
      const colDiff = Math.abs(col - first.col);
      
      if (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) {
        const steps = Math.max(rowDiff, colDiff);
        const validPositions = [];
        
        for (let i = 0; i <= steps; i++) {
          const pathRow = first.row + (rowDir * i);
          const pathCol = first.col + (colDir * i);
          validPositions.push({
            row: pathRow,
            col: pathCol,
            letter: grid[pathRow][pathCol]
          });
        }
        
        setSelectedLetters(validPositions);
      }
    }
  }

  // Handlers
  const handleMouseDown = e => {
    setIsDragging(true);
    setSelectedLetters([]);
    selectLetter(e);
    drawGrid();
  }

  const handleMouseMove = e => {
    if (isDragging) {
      selectLetter(e);
      drawGrid();
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      checkWord();
      setIsDragging(false);
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      const selectedWord = selectedLetters.map(sel => sel.letter).join("");
      const reversedWord = selectedWord.split("").reverse().join("");
      
      let wordToMark = null;
      
      if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
        wordToMark = selectedWord;
      } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
        wordToMark = reversedWord;
      }
      
      if (wordToMark) {
        // First update foundWords and coordinates
        const newFoundWords = new Set([...foundWords, wordToMark]);
        const newFoundWordCoordinates = new Map(foundWordCoordinates);
        newFoundWordCoordinates.set(wordToMark, [...selectedLetters]);
        
        // Update score
        updateScore(wordToMark);
        
        // Clear selection
        setSelectedLetters([]);
        
        // Immediately update the visual state
        setFoundWords(newFoundWords);
        setFoundWordCoordinates(newFoundWordCoordinates);
        
        // Force immediate redraw with new state
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw all cells
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid.length; col++) {
            drawCell(row, col);
          }
        }
        
        // Immediately draw all found words including the new one
        newFoundWordCoordinates.forEach((coordinates) => {
          highlightWord(coordinates, "rgba(0, 255, 0, 0.3)");
        });
        
        // Check for game completion
        if (newFoundWords.size === words.length) {
          stopTimer();
          setGameActive(false);
          
          if (score > bestScores[difficulty]) {
            setBestScores(prev => ({
              ...prev,
              [difficulty]: score
            }));
          }
          
          setTimeout(() => {
            alert(`Congratulations! You've found all the words!\nFinal Score: ${score}\nBest Score: ${bestScores[difficulty]}\nTime: ${timeElapsed}`);
          }, 100);
        }
      } else {
        setSelectedLetters([]);
        drawGrid();
      }
      
      setIsDragging(false);
    }
  }


  // Handle difficulty change
  const handleDifficultyChange = e => {
    const newDifficulty = e.target.value;
    if (gameActive) {
      if (window.confirm("Starting a new game will reset your current progress. Continue?")) {
        setDifficulty(newDifficulty);
        initEmptyGrid(gridSize[newDifficulty]);
      }
    } else {
      setDifficulty(newDifficulty);
      initEmptyGrid(gridSize[newDifficulty]);
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Word Search Challenge</h1>
        <div className="game-stats">
          <div className="stat-box">
            <span className="stat-label">TIMER</span>
            <span>{timeElapsed}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">SCORE</span>
            <span>{score}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">WORDS FOUND</span>
            <span>{`${foundWords.size} / ${words.length}`}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">BEST SCORE</span>
            <span>{bestScores[difficulty]}</span>
          </div>
        </div>
      </div>

      <div className="game-content">
        <div className="word-list">
          <h3>Words to Find:</h3>
          {!gameActive ? (
            <p>Click 'Start New Game' to begin!</p>
          ) : (
            <ol ref={wordListRef}>
              {words.map((word, i) => (
                <li 
                  key={i} 
                  id={`word-${word}`}
                  className={foundWords.has(word) ? 'found' : ''}
                >
                  {word}
                </li>
              ))}
            </ol>
          )}
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        <div className="game-controls">
          <select 
            className="difficulty-select" 
            value={difficulty}
            onChange={handleDifficultyChange}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button 
            className="start-btn"
            onClick={startNewGame}
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  )};

  export default Wordsearch