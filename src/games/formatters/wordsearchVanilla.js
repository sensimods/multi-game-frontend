// const canvas = document.getElementById("wordsearchCanvas");
const ctx = canvas.getContext("2d"); //
const difficultySelect = document.getElementById("difficultySelect");//
const wordList = document.getElementById("wordList");//
const gridSize = { easy: 9, medium: 12, hard: 20 }; //
const gameTitle = 'wordsearch'//
let grid = [];//
let words = []; //
let cellSize; //
let selectedLetters = []; //
let foundWords = new Set(); //
let foundWordCoordinates = new Map(); //
let isDragging = false; //

// New game state variables
let timeElapsed = 0;//
let timerInterval; //
let score = 0; //
let bestScores = {
  easy: 0,
  medium: 0,
  hard: 0
}; //
let gameActive = false; //


// async function getDefinitionOfWord(word) {
//   try {
//     const res = await fetch(`https://corsproxy.io/?https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
//     console.log(res)
//   } catch (error) {
    
//   }
// }

// Add this function to load best scores from localStorage
function loadBestScores() {
  const savedScores = localStorage.getItem('wordsearch-best-scores');
  if (savedScores) {
      bestScores = JSON.parse(savedScores);
  }
  updateBestScoreDisplay();
} //

// Add this function to save best scores to localStorage
function saveBestScores() {
  localStorage.setItem('wordsearch-best-scores', JSON.stringify(bestScores));
}

// Add this function to update the best score display
function updateBestScoreDisplay() {
  const currentDifficulty = difficultySelect.value;
  document.getElementById('bestScore').textContent = bestScores[currentDifficulty];
} // not needed

// Timer functions
function startTimer() {
  clearInterval(timerInterval);
  timeElapsed = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
      timeElapsed++;
      updateTimerDisplay();
  }, 1000);
} //

function stopTimer() {
  clearInterval(timerInterval);
} //

function updateTimerDisplay() {
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  document.getElementById('timer').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} // not needed

// Score functions
// function updateScore(foundWord) {
//   const timeBonus = Math.max(0, 100 - timeElapsed);
//   const wordLengthBonus = foundWord.length * 10;
//   const difficultyMultiplier = {
//       'easy': 1,
//       'medium': 1.5,
//       'hard': 2
//   }[difficultySelect.value];

//   const points = Math.round((timeBonus + wordLengthBonus) * difficultyMultiplier);
//   score += points;
//   document.getElementById('score').textContent = score;
// }

// Store timestamps for tracking word find times
let lastWordFoundTime = 0;

function updateScore(foundWord) {
    const totalWords = words.length;
    const baseScore = Math.round(1000 / totalWords);  // Dynamic base score

    const now = timeElapsed;
    let timeTaken;

    if (foundWords.size === 0) {
        // First word found, calculate time from start
        timeTaken = now;
    } else {
        // Calculate time taken since last word was found
        timeTaken = now - lastWordFoundTime;
    }
    
    lastWordFoundTime = now; // Update last found word time

    // Ensure time bonus never goes negative
    const maxExpectedTime = 60;
    const timeBonus = Math.max(0, 100 * (1 - (timeTaken / maxExpectedTime)));

    // Difficulty multiplier
    const difficultyMultiplier = {
        'easy': 1,
        'medium': 1.5,
        'hard': 2
    }[difficultySelect.value];

    // Calculate final points
    const points = Math.round((baseScore + timeBonus) * difficultyMultiplier);
    
    // Update total score
    score += points;
    document.getElementById('score').textContent = score;
} //

function updateWordsFoundDisplay() { // not needed
  document.getElementById('wordsFound').textContent = 
      `${foundWords.size} / ${words.length}`;
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
      words = filteredWords.slice(0, size - 2);
      
      console.log("Final words for puzzle:", words);
  } catch (error) {
      console.error("Error fetching words:", error);
      // Fallback words in case API fails
      words = ["HELLO", "WORLD", "PLAY", "FUN", "GAME"].slice(0, size - 2);
  }
}; //



// Modify the initGrid function to load best scores
async function initGrid(size) {
  // Reset game state
  score = 0;
  document.getElementById('score').textContent = '0';
  loadBestScores(); // Load best scores when starting new game
  foundWords.clear();
  foundWordCoordinates.clear();
  // Generate new grid
  await generateWords(size);
  grid = Array.from({ length: size }, () => Array(size).fill(""));
  updateWordList();
  placeWords();
  fillEmptySpaces();
  drawGrid();
  
  // Update UI
  updateWordsFoundDisplay();
  updateBestScoreDisplay();
  
  // Start timer
  startTimer();
  gameActive = true;
}; //

function updateWordList() {
    wordList.innerHTML = "";
    words.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        li.id = `word-${word}`;
        wordList.appendChild(li);
    });
} // ALERT come back here in case needed 


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
              words.splice(index, 1);
          }
      });
      
      // Clear the grid and try again with the remaining words
      if (words.length >= 3) { // Only retry if we have enough words left
          grid = Array.from({ length: grid.length }, () => Array(grid.length).fill(""));
          placeWords();
      } else {
          // If too few words remain, get new words and start over
          initGrid(grid.length);
          return;
      }
  }
  
  updateWordList();
} //


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
    for (let i = 0; i < word.length; i++) {
        const newRow = row + i * dy;
        const newCol = col + i * dx;
        grid[newRow][newCol] = word[i];
        coordinates.push({ row: newRow, col: newCol });
    }
    return true;
} //

function fillEmptySpaces() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid.length; col++) {
            if (grid[row][col] === "") {
                grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
} //

function drawGrid() {
    canvas.width = canvas.height = Math.min(400, window.innerWidth - 100);
    cellSize = canvas.width / grid.length;
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
} //

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
} //


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
} //


// Modify the checkWord function to update best scores
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
} //


function highlightWord(coordinates, color) {
    coordinates.forEach(coord => {
        drawCell(coord.row, coord.col, color);
    });
}; //

// Modified highlightWordList function to use new styling
async function highlightWordList(word) {
  const wordElement = document.getElementById(`word-${word}`);
  if (wordElement) {
      wordElement.classList.add('found');
      // await getDefinitionOfWord(word)
  }
}

// Add event listener for the start game button
document.getElementById('startGame').addEventListener('click', () => {
  let size = gridSize[difficultySelect.value];
  initGrid(size);
});

// Update mouse event listeners for better grid boundary handling
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  selectedLetters = [];
  selectLetter(e);
  drawGrid();
  highlightWord(selectedLetters, "rgba(255, 255, 0, 0.3)");
});

canvas.addEventListener("mousemove", (e) => {
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
});

// Add mouseleave event handler
canvas.addEventListener("mouseleave", () => {
  if (isDragging && selectedLetters.length > 0) {
      checkWord();
      isDragging = false;
  }
});

canvas.addEventListener("mouseup", (e) => {
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
  isDragging = false;
});


// Handle window resize
window.addEventListener("resize", () => {
    drawGrid();
});


// Add event listener for difficulty change to update best score display
difficultySelect.addEventListener('change', function() {
  if (gameActive) {
      if (confirm("Starting a new game will reset your current progress. Continue?")) {
          let size = gridSize[difficultySelect.value];
          initGrid(size);
      } else {
          // Reset the select to previous value if user cancels
          this.value = this.defaultValue;
      }
  }
  updateBestScoreDisplay();
});

// Call loadBestScores when the page loads
loadBestScores();

// Initialize the game
initGrid(gridSize.easy);




