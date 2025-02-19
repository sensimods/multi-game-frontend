import React, { useState, useEffect, useRef } from 'react';

// Constants for grid sizes and difficulties
const GRID_SIZES = {
  easy: 9,
  medium: 12,
  hard: 20
};

const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [-1, 1],  // diagonal up-right
  [0, -1],  // left
  [-1, 0],  // up
  [-1, -1], // diagonal up-left
  [1, -1]   // diagonal down-left
];

const Wordsearch = () => {
  // State declarations
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundWordCoordinates, setFoundWordCoordinates] = useState(new Map());
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScores, setBestScores] = useState({
    easy: 0,
    medium: 0,
    hard: 0
  });
  const [gameActive, setGameActive] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [lastWordFoundTime, setLastWordFoundTime] = useState(0);

  // Refs
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const ctxRef = useRef(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext('2d');
      canvas.width = canvas.height = Math.min(400, window.innerWidth - 100);
    }
  }, []);

  // Load best scores from localStorage
  useEffect(() => {
    const savedScores = localStorage.getItem('wordsearch-best-scores');
    if (savedScores) {
      setBestScores(JSON.parse(savedScores));
    }
  }, []);

  // Save best scores to localStorage
  useEffect(() => {
    localStorage.setItem('wordsearch-best-scores', JSON.stringify(bestScores));
  }, [bestScores]);

  // Timer effect
  useEffect(() => {
    if (gameActive) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameActive]);

  const generateWords = async (size) => {
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
      
      return filteredWords.slice(0, size - 2);
    } catch (error) {
      console.error("Error fetching words:", error);
      return ["HELLO", "WORLD", "PLAY", "FUN", "GAME"].slice(0, size - 2);
    }
  };

  const initGrid = async (size) => {
    setScore(0);
    setFoundWords(new Set());
    setFoundWordCoordinates(new Map());
    setTimeElapsed(0);
    
    const newWords = await generateWords(size);
    setWords(newWords);
    
    const newGrid = Array.from({ length: size }, () => Array(size).fill(""));
    setGrid(newGrid);
    
    placeWords(newGrid, newWords);
    setGameActive(true);
  };

  const placeWords = (grid, words) => {
    const newGrid = [...grid];
    
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * grid.length);
        const col = Math.floor(Math.random() * grid.length);
        const direction = Math.floor(Math.random() * 8);
        const [dy, dx] = DIRECTIONS[direction];
        
        if (canPlaceWord(word, row, col, dy, dx, newGrid)) {
          placeWord(word, row, col, dy, dx, newGrid);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty spaces
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid.length; col++) {
        if (newGrid[row][col] === "") {
          newGrid[row][col] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        }
      }
    }
    
    setGrid(newGrid);
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !grid.length) return;

    const cellSize = canvas.width / grid.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        drawCell(rowIndex, colIndex, cellSize, "white");
      });
    });

    foundWordCoordinates.forEach((coordinates) => {
      coordinates.forEach(coord => {
        drawCell(coord.row, coord.col, cellSize, "rgba(0, 255, 0, 0.3)");
      });
    });

    if (selectedLetters.length > 0) {
      selectedLetters.forEach(coord => {
        drawCell(coord.row, coord.col, cellSize, "rgba(255, 255, 0, 0.3)");
      });
    }
  };

  const drawCell = (row, col, cellSize, backgroundColor) => {
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
  };

  useEffect(() => {
    drawGrid();
  }, [grid, selectedLetters, foundWordCoordinates]);


  function selectLetter(e) {
  const canvas = canvasRef.current
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
              selectedLetters = validPositions.slice(0, currentIndex + 1);
          }
      }
  }
}

function highlightWord(coordinates, color) {
    coordinates.forEach(coord => {
        drawCell(coord.row, coord.col, color);
    });
}


  const handleMouseDown = e => {
    setIsDragging(true)
    setSelectedLetters([])
    selectLetter(e);
    drawGrid();
    highlightWord(selectedLetters, "rgba(255, 255, 0, 0.3)");
  } 

  const handleMouseMove = e => {
    const canvas = canvasRef.current
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

  async function highlightWordList(word) {
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
        wordElement.classList.add('found');
        // await getDefinitionOfWord(word)
    }
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
      foundWords.add(wordToMark);
      foundWordCoordinates.set(wordToMark, [...selectedLetters]);
      highlightWordList(wordToMark);
      updateScore(wordToMark);
      updateWordsFoundDisplay();
      drawGrid();
      
      // Check if all words are found
      if (foundWords.size === words.length) {
          stopTimer();
          gameActive = false;
          
          // Update best score if current score is higher
          const currentDifficulty = difficultySelect.value;
          if (score > bestScores[currentDifficulty]) {
              bestScores[currentDifficulty] = score;
              saveBestScores();
              updateBestScoreDisplay();
          }
          
          setTimeout(() => {
              alert(`Congratulations! You've found all the words!\nFinal Score: ${score}\nBest Score: ${bestScores[currentDifficulty]}\nTime: ${document.getElementById('timer').textContent}`);
          }, 100);
      }
  } else {
      drawGrid();
  }
  
  selectedLetters = [];
}

  const handleMouseUp = e => {
    const canvas = canvasRef.current
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
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-4">Word Search Challenge</h1>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg min-w-[150px]">
              <div className="text-green-400 text-sm mb-2">TIME</div>
              <div className="text-white text-xl">{timeElapsed}</div>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg min-w-[150px]">
              <div className="text-green-400 text-sm mb-2">SCORE</div>
              <div className="text-white text-xl">{score}</div>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg min-w-[150px]">
              <div className="text-green-400 text-sm mb-2">WORDS FOUND</div>
              <div className="text-white text-xl">{foundWords.size} / {words.length}</div>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg min-w-[150px]">
              <div className="text-green-400 text-sm mb-2">BEST SCORE</div>
              <div className="text-white text-xl">{bestScores[difficulty]}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="text-green-400 mb-4">Words to Find:</h3>
              <div className="text-white">
                {words.map((word, index) => (
                  <div 
                    key={word} 
                    className={`mb-2 ${foundWords.has(word) ? 'text-green-400 line-through' : ''}`}
                  >
                    {word}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="bg-white rounded-lg shadow-lg"
              />
            </div>

            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <select
                value={difficulty}
                onChange={handleDifficultyChange}
                className="w-full p-3 mb-4 rounded-lg bg-white bg-opacity-90 text-gray-900"
              >
                {Object.keys(GRID_SIZES).map(diff => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => initGrid(GRID_SIZES[difficulty])}
                className="w-full p-3 rounded-lg bg-green-400 text-gray-900 font-bold hover:bg-green-500 transition-colors"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wordsearch