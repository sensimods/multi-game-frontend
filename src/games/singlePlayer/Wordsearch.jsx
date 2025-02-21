import {useRef, useState, useEffect} from 'react';
import '../styles/wordsearch.css';

const Wordsearch = () => {

  // Event States
  const [difficulty, setDifficulty] = useState('easy');
  const [timerInterval, setTimerInterval] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [numberOfWordsToFind, setNumberOfWordsToFind] = useState(0);
  const [numberOfWordsFound, setNumberOfWordsFound] = useState(0);
  const [words, setWords] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundWordCoordinates, setFoundWordCoordinates] = useState(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScores, setBestScores] = useState({
    easy: 1,
    medium: 2,
    hard: 3
  });
  const [bestScore, setBestScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [lastWordFoundTime, setLastWordFoundTime] = useState(0);

  // Display States
  // const [canvas, setCanvas] = useState(null)
  const [ctx, setCtx] = useState(null);
  const [grid, setGrid] = useState([]);
  const [cellSize, setCellSize] = useState(null);



  // Refs
  const canvasRef = useRef(null);
  const wordListRef = useRef(null); //<ol>

  // Consts
  const gridSize = {easy: 9, medium: 12, hard: 20};

  // Redux
  function loadBestScores() {
    // Use redux/mongoDB instead of local storage
    // const savedScores = localStorage.getItem('wordsearch-best-scores');
    // if (savedScores) {
    //     bestScores = JSON.parse(savedScores);
    // }
    // updateBestScoreDisplay();
  }

  function saveBestScores() {
    // Use redux/mongoDB instead of local storage
    // localStorage.setItem('wordsearch-best-scores', JSON.stringify(bestScores));
  }

  function startTimer() {
    clearInterval(timerInterval);
    setTimeElapsed(0);
    const newTimerInterval = setInterval(() => {
        setTimeElapsed(prevState => prevState + 1)
      }, 1000);
    setTimerInterval(newTimerInterval);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function updateScore(foundWord) {
    const totalWords = words.length;
    const baseScore = Math.round(1000 / totalWords);

    const now = timeElapsed;
    let timeTaken;

    if(foundWords.size === 0) {
      timeTaken = now;
    } else {
      timeTaken = now - lastWordFoundTime;
    }

    setLastWordFoundTime(now);

    // Ensure time bonus never goes negative
    const maxExpectedTime = 60;
    const timeBonus = Math.max(0, 100 * (1 - (timeTaken / maxExpectedTime)));

    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    }[difficulty];

    const points = Math.round((baseScore + timeBonus) * difficultyMultiplier);

    setScore(prevScore => prevScore += points);
  }

  async function generateWords(size) {
    try {
        // Request more words than needed to account for filtering
        const numberOfWordsToRequest = size * 2; // Request double the amount needed
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${numberOfWordsToRequest}`);
        const data = await response.json();
        
        // Filter words that are too long and convert to uppercase
        let filteredWords = data
            .map(word => word.toUpperCase())
            .filter(word => word.length <= size && word.length >= 3); // Added minimum length of 3
        
        // If we don't have enough words after filtering, fetch more
        if (filteredWords.length < size - 2) {
            const additionalResponse = await fetch(`https://random-word-api.herokuapp.com/word?number=${numberOfWordsToRequest}`);
            const additionalData = await additionalResponse.json();
            
            const additionalWords = additionalData
                .map(word => word.toUpperCase())
                .filter(word => word.length <= size && word.length >= 3);
                
            filteredWords = [...filteredWords, ...additionalWords];
        }
        
        // Take only the number of words we need
        const generatedWords = filteredWords.slice(0, size - 2);
        setWords(generatedWords);
        
        console.log("Final words for puzzle:", words);
    } catch (error) {
        console.error("Error fetching words:", error);
        // Fallback words in case API fails
        const fallbackWords = ["HELLO", "WORLD", "PLAY", "FUN", "GAME"].slice(0, size - 2);
        setWords(fallbackWords);
    }
  }

  // Modify the initGrid function to load best scores
  async function initGrid(size) {
    // Reset game state
    setScore(0);
    loadBestScores(); // Load best scores when starting new game
    setFoundWords(new Set());
    setFoundWordCoordinates(new Map());
    // Generate new grid
    await generateWords(size);
    setGrid(Array.from({ length: size }, () => Array(size).fill("")));
    placeWords();
    fillEmptySpaces();
    drawGrid();
    
    // Start timer
    startTimer();
    setGameActive(true);
  }

  function placeWords() {
    const unplacedWords = [];
    
    for (let word of words) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            let row = Math.floor(Math.random() * grid.length);
            let col = Math.floor(Math.random() * grid.length);
            
            // Direction selection logic
            let direction = Math.floor(Math.random() * 12);
            if (direction >= 8) direction = Math.floor(Math.random() * 4) + 4;
            direction = direction % 8;
            
            placed = tryPlaceWord(word, row, col, direction);
            attempts++;
        }
        
        if (!placed) {
            unplacedWords.push(word);
        }
    }
    
    // Handle unplaced words
    if (unplacedWords.length > 0) {
        console.warn("Unplaced words:", unplacedWords);
        
        // Remove unplaced words from the game
        unplacedWords.forEach(word => {
            const index = words.indexOf(word);
            if (index !== -1) {
                // words.splice(index, 1);
                setWords(prevWords => prevWords.filter(word => !unplacedWords.includes(word)));
            }
        });
        
        // Clear the grid and try again with the remaining words
        if (words.length >= 3) { // Only retry if we have enough words left
            setGrid(Array.from({ length: grid.length }, () => Array(grid.length).fill("")));
            placeWords();
        } else {
            // If too few words remain, get new words and start over
            initGrid(grid.length);
            return;
        }
    }
    
  }

  function tryPlaceWord(word, row, col, direction) {
    // Define all 8 possible directions
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
    
    // Check if word fits in grid
    if (row + dy * (word.length - 1) < 0 || 
        row + dy * (word.length - 1) >= grid.length || 
        col + dx * (word.length - 1) < 0 || 
        col + dx * (word.length - 1) >= grid.length) {
        return false;
    }
    
    // Check if space is available
    for (let i = 0; i < word.length; i++) {
        const newRow = row + i * dy;
        const newCol = col + i * dx;
        if (grid[newRow][newCol] !== "" && grid[newRow][newCol] !== word[i]) {
            return false;
        }
    }
    
    // Place the word and store its coordinates
    const coordinates = [];
    setGrid(prevGrid => {
      // Create a deep copy of the grid (to avoid mutation)
      const newGrid = prevGrid.map(row => [...row]);

      // Update the new grid safely
      for (let i = 0; i < word.length; i++) {
          const newRow = row + i * dy;
          const newCol = col + i * dx;
          newGrid[newRow][newCol] = word[i];
          coordinates.push({ row: newRow, col: newCol });
      }

      return newGrid; // Update state with the new grid
    })

    return true;
}

function fillEmptySpaces() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    setGrid(prevGrid => {
      // Create a deep copy of the grid
      const newGrid = prevGrid.map(row => [...row]);

      // Fill empty spaces
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          if (newGrid[row][col] === "") {
              newGrid[row][col] = letters[Math.floor(Math.random() * letters.length)];
          }
        }
      }

        return newGrid; // Update state with the new grid
    });
}

  function drawGrid() {
    const canvas = canvasRef.current;
    canvas.width = canvas.height = Math.min(400, window.innerWidth - 100);
    setCellSize(canvas.width / grid.length);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw cells and letters
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid.length; col++) {
            drawCell(row, col);
        }
    }
    
    // Redraw found words
    foundWordCoordinates.forEach((coordinates, word) => {
        highlightWord(coordinates, "rgba(0, 255, 0, 0.3)");
    });
  }

  function drawCell(row, col, backgroundColor = "white") {
    const x = col * cellSize;
    const y = row * cellSize;
    
    // Draw cell background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, cellSize, cellSize);
    
    // Draw cell border
    ctx.strokeStyle = "#ccc";
    ctx.strokeRect(x, y, cellSize, cellSize);
    
    // Draw letter
    ctx.fillStyle = "black";
    ctx.font = `bold ${cellSize * 0.6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(grid[row][col], x + cellSize / 2, y + cellSize / 2);
}

function selectLetter(e) {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  
  if (row >= 0 && row < grid.length && col >= 0 && col < grid.length) {
      // If this is the first letter, always add it
      if (selectedLetters.length === 0) {
          selectedLetters.push({ row, col, letter: grid[row][col] });
          return;
      }
      
      // Get the first selected position
      const first = selectedLetters[0];
      
      // Calculate the direction from first letter
      const rowDir = Math.sign(row - first.row);
      const colDir = Math.sign(col - first.col);
      
      // Calculate the absolute differences
      const rowDiff = Math.abs(row - first.row);
      const colDiff = Math.abs(col - first.col);
      
      // Check if the new position maintains a valid line (horizontal, vertical, or diagonal)
      if (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) {
          // Calculate all valid positions along the line from first letter to current position
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
          
          // Sort valid positions by distance from first letter
          validPositions.sort((a, b) => {
              const distA = Math.max(
                  Math.abs(a.row - first.row),
                  Math.abs(a.col - first.col)
              );
              const distB = Math.max(
                  Math.abs(b.row - first.row),
                  Math.abs(b.col - first.col)
              );
              return distA - distB;
          });
          
          // Find current position in valid positions
          const currentIndex = validPositions.findIndex(pos => 
              pos.row === row && pos.col === col
          );
          
          if (currentIndex !== -1) {
              // Update selection to include all positions up to current position
              setSelectedLetters(validPositions.slice(0, currentIndex + 1));
          }
      }
  }
}


  function isValidNextPosition(last, current) {
    const rowDiff = current.row - last.row;
    const colDiff = current.col - last.col;
    
    // No movement
    if (rowDiff === 0 && colDiff === 0) {
        return false;
    }
    
    // If this is the second letter, establish the direction
    if (selectedLetters.length === 1) {
        return true;
    }
    
    // Get the established direction from the first two letters
    const first = selectedLetters[0];
    const second = selectedLetters[1];
    const establishedRowDir = Math.sign(second.row - first.row);
    const establishedColDir = Math.sign(second.col - first.col);
    
    // Current direction must match established direction
    const currentRowDir = Math.sign(rowDiff);
    const currentColDir = Math.sign(colDiff);
    
    return currentRowDir === establishedRowDir && currentColDir === establishedColDir;
  }


  // Modify the checkWord function to update best scores
// function checkWord() {
//   const selectedWord = selectedLetters.map(sel => sel.letter).join("");
//   const reversedWord = selectedWord.split("").reverse().join("");
  
//   let wordToMark = null;
  
//   if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
//       wordToMark = selectedWord;
//   } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
//       wordToMark = reversedWord;
//   }
  
//   if (wordToMark) {
//       foundWords.add(wordToMark);
//       foundWordCoordinates.set(wordToMark, [...selectedLetters]);
//       highlightWordList(wordToMark);
//       updateScore(wordToMark);
//       updateWordsFoundDisplay();
//       drawGrid();
      
//       // Check if all words are found
//       if (foundWords.size === words.length) {
//           stopTimer();
//           setGameActive(false)
          
//           // Update best score if current score is higher
//           const currentDifficulty = difficultySelect.value;
//           if (score > bestScores[currentDifficulty]) {
//               bestScores[currentDifficulty] = score;
//               saveBestScores();
//               updateBestScoreDisplay();
//           }
          
//           setTimeout(() => {
//               alert(`Congratulations! You've found all the words!\nFinal Score: ${score}\nBest Score: ${bestScores[currentDifficulty]}\nTime: ${document.getElementById('timer').textContent}`);
//           }, 100);
//       }
//   } else {
//       drawGrid();
//   }
  
//   setSelectedLetters([])
// }

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
    setFoundWords(prevFoundWords => new Set([...prevFoundWords, wordToMark]));
    
    setFoundWordCoordinates(prevCoordinates => {
      const newCoordinates = new Map(prevCoordinates);
      newCoordinates.set(wordToMark, [...selectedLetters]);
      return newCoordinates;
    });

    highlightWordList(wordToMark);
    updateScore(wordToMark);
    updateWordsFoundDisplay();
    drawGrid();

    // Check if all words are found
    if (foundWords.size + 1 === words.length) {
      stopTimer();
      setGameActive(false);

      // Update best score if current score is higher
      if (score > bestScores[difficulty]) {
        setBestScores(prevState => ({
          ...prevState,
          [difficulty]: score
        }))
        saveBestScores();
        updateBestScoreDisplay();
      }

      setTimeout(() => {
        alert(`Congratulations! You've found all the words!\nFinal Score: ${score}\nBest Score: ${bestScores[difficulty]}\nTime: ${timeElapsed}`);
      }, 100);
    }
  } else {
    drawGrid();
  }

  setSelectedLetters([]);
}

  function highlightWord(coordinates, color) {
    coordinates.forEach(coord => {
      drawCell(coord.row, coord.col, color);
    });
  }

  async function highlightWordList(word) {
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
        wordElement.classList.add('found');
        // await getDefinitionOfWord(word)
    }
  }


  // Event Handlers
  const handleDifficultyChange = e => {
    setDifficulty(e.target.value);
    setBestScore(bestScores[e.target.value]);

    if (gameActive) {
      if (confirm("Starting a new game will reset your current progress. Continue?")) {
          let size = gridSize[e.target.value];
          initGrid(size);
      } else {
          // Reset the select to previous value if user cancels
          // this.value = this.defaultValue;
          setDifficulty('easy');
      }
  }
  // updateBestScoreDisplay();
  }

  const handleStartGame = e => {
    initGrid(gridSize[difficulty]);    
  }

  const handleMouseDown = e => {
    setIsDragging(true);
    setSelectedLetters([]);
    selectLetter(e);
    drawGrid();
    highlightWord(selectedLetters, "rgba(255, 255, 0, 0.3)");
  }

  const handleMouseMove = e => {
    const canvas = canvasRef.current;
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if mouse is within canvas bounds
      if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          selectLetter(e);
          drawGrid();
          highlightWord(selectedLetters, "rgba(255, 255, 0, 0.3)");
      }
    }
  }
 
  const handleMouseLeave = () => {
    if (isDragging && selectedLetters.length > 0) {
      checkWord();
      setIsDragging(false);
    }
  }

  const handleMouseUp = e => {
    const canvas = canvasRef.current;
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if mouse is within canvas bounds
      if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          selectLetter(e);
      }
      
      checkWord();
  }
    setIsDragging(false);
  }

  window.addEventListener("resize", () => {
    drawGrid();
  });

  const handleFake = () => {
    // stopTimer()
  }

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      setCtx(context);
    }

    // Call loadBestScores when the page loads
    loadBestScores();

    // Initialize the game
    initGrid(gridSize.easy);
  
    
  }, [])

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
                <span id="wordsFound">{`${numberOfWordsFound} / ${numberOfWordsToFind}`}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">BEST SCORE</span>
              <span id="bestScore">{bestScore}</span>
          </div>
        </div>
    </div>

    <div className="game-content">
        <div className="word-list">
            <h3>Words to Find:</h3>
            <ol ref={wordListRef}>
              {words.map((word, i) => (
                <li key={i} id={`word-${word}`}>{word}</li>
              ))}
            </ol>
        </div>

        <canvas 
          id="wordsearchCanvas" 
          ref={canvasRef} 
          onMouseDown={handleMouseDown} 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
        ></canvas>

        <div className="game-controls">
            <select className="difficulty-select" onChange={handleDifficultyChange} defaultValue={difficulty}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
            <button id="startGame" className="start-btn" onClick={handleStartGame}>Start New Game</button>
            <button onClick={handleFake}>Stop</button>
        </div>
    </div>
</div>
  )
}
export default Wordsearch