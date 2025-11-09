// =======================================================
// 0. API & AUTH CONFIGURATION
// =======================================================

// This is the address of your backend server
const API_URL = 'https://arcade-hub-api.onrender.com';

/**
 * Saves the user's login token to localStorage.
 * @param {string} token - The JWT token from the server.
 */
function saveToken(token) {
    localStorage.setItem('arcadeUserToken', token);
}

/**
 * Retrieves the user's login token from localStorage.
 * @returns {string | null} The token, or null if not found.
 */
function getToken() {
    return localStorage.getItem('arcadeUserToken');
}

/**
 * Checks if the user is currently logged in.
 * @returns {boolean} True if a token exists, false otherwise.
 */
function isLoggedIn() {
    return getToken() !== null;
}

/**
 * Logs the user out by removing the token and reloading the page.
 */
function logout() {
    localStorage.removeItem('arcadeUserToken');
    // Redirect to the home page after logout
    window.location.href = 'home.html';
}

/**
 * A helper function for making API requests.
 * Automatically adds the auth token to headers if it exists.
 * @param {string} endpoint - The API endpoint (e.g., '/api/save-score')
 * @param {string} method - The HTTP method (e.g., 'POST', 'GET')
 * @param {object} [body] - The JSON body for POST/PUT requests
 * @returns {Promise<object>} The JSON response from the server
 */
async function apiRequest(endpoint, method, body) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(API_URL + endpoint, config);
        if (!response.ok) {
            // Try to parse the error message from the server
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error; // Re-throw the error so the calling function can handle it
    }
}

// =======================================================
// 1. THEME SWITCHER LOGIC (Unchanged)
// =======================================================
(function() {
    // Set theme on initial load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

window.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// =======================================================
// 2. MODAL/ACCOUNT LOGIC
// =======================================================
const modal = document.getElementById('accountModal');
if (modal) {
    // This code only runs on pages that have the modal
    const modalTitle = document.getElementById('modal-title');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');

    window.openModal = function(type) {
        modal.style.display = 'block';
        if (type === 'login') {
            modalTitle.textContent = 'User Login';
            modalSubmitBtn.textContent = 'Login';
        } else {
            modalTitle.textContent = 'Create Account';
            modalSubmitBtn.textContent = 'Sign Up';
        }
    }
    
    window.closeModal = function() {
        modal.style.display = 'none';
    }
    
    // Close modal if user clicks outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    /**
     * Handles the form submission for both Login and Signup.
     * This is now a REAL function that calls the backend.
     */
    window.handleAccount = async function(event) {
        event.preventDefault(); // Stop the form from reloading the page
        const formType = modalTitle.textContent.includes('Login') ? 'login' : 'signup';
        
        // Use the 'name' attributes from the modal form
        const username = event.target.modal_username.value;
        const password = event.target.modal_psw.value;
        const endpoint = (formType === 'login') ? '/api/login' : '/api/signup';

        try {
            const data = await apiRequest(endpoint, 'POST', { username, password });
            
            if (formType === 'signup') {
                alert('Signup successful! Please log in.');
                openModal('login'); // Switch to login modal
            } else {
                // Login was successful!
                saveToken(data.token); // Save the token
                alert(`Welcome, ${data.username}!`);
                closeModal();
                updateAuthUI(); // Update the header
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

/**
 * Updates the header to show "Logout" if logged in.
 */
function updateAuthUI() {
    const authButtonsDiv = document.querySelector('.auth-buttons');
    if (!authButtonsDiv) return; // Exit if not on a page with auth buttons

    if (isLoggedIn()) {
        authButtonsDiv.innerHTML = '<button class="btn" onclick="logout()">Logout</button>';
    } else {
        authButtonsDiv.innerHTML = `
            <button class="btn" onclick="openModal('login')">Login</button>
            <button class="btn" onclick="openModal('signup')">Sign Up</button>
        `;
    }
}
// Run this check every time a page with the script.js loads
// Also check on the login page
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Specific logic for the login page
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            try {
                const data = await apiRequest('/api/login', 'POST', { username, password });
                saveToken(data.token);
                alert(`Welcome, ${data.username}!`);
                window.location.href = 'home.html'; // Redirect to home on success
            } catch (error) {
                alert(`Login Failed: ${error.message}`);
            }
        });
    }
});


// =======================================================
// 3. SCORE SAVING LOGIC
// =======================================================

/**
 * Saves a score to the backend.
 * Only works if the user is logged in.
 * @param {string} gameName - The name of the game (e.g., "snake", "dino_run")
 * @param {number} score - The final score
 */
async function saveScore(gameName, score) {
    if (!isLoggedIn()) {
        console.log('Not logged in. Score will not be saved.');
        return;
    }

    console.log(`Attempting to save score: ${score} for ${gameName}`);
    try {
        const data = await apiRequest('/api/save-score', 'POST', { gameName, score });
        console.log('Score saved successfully!', data.message);
        alert(`Score saved! (${score} points for ${gameName})`);
    } catch (error) {
        console.error('Failed to save score:', error.message);
        // Don't alert the user, just log it.
    }
}


// =======================================================
// 4. TIC-TAC-TOE LOGIC (for tictactoe.html)
// =======================================================
// This code only runs if it finds the 'tictactoe-board' element on the page
if (document.getElementById('tictactoe-board')) {
    
    const tttStatus = document.getElementById('tictactoe-status');
    const tttBoard = document.getElementById('tictactoe-board');
    const tttResetBtn = document.getElementById('tictactoe-reset-btn');
    let tttPlayer = 'X';
    let tttState = Array(9).fill('');
    let tttActive = true;
    
    // All possible winning combinations
    const tttConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    const tttMsgTurn = () => `It's ${tttPlayer}'s turn!`;
    const tttMsgWin = () => `Player ${tttPlayer} has won! 🎉`;
    const tttMsgDraw = () => `Game ended in a draw! 🤷‍♂️`;
    
    function tttUpdateStatus(message) { tttStatus.innerHTML = message; }
    
    function tttRenderBoard() {
        tttBoard.innerHTML = ''; // Clear the board
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i; // Store index
            if (tttState[i]) { 
                cell.innerHTML = tttState[i]; 
                cell.classList.add(tttState[i].toLowerCase()); 
            }
            cell.addEventListener('click', tttHandleClick);
            tttBoard.appendChild(cell);
        }
    }
    
    function tttHandleClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        // If cell is already filled or game is over, do nothing
        if (tttState[index] !== '' || !tttActive) return;
        
        // Update state and UI
        tttState[index] = tttPlayer;
        cell.innerHTML = tttPlayer;
        cell.classList.add(tttPlayer.toLowerCase());
        
        tttValidateResult();
    }
    
    function tttChangePlayer() {
        tttPlayer = tttPlayer === 'X' ? 'O' : 'X';
        tttUpdateStatus(tttMsgTurn());
    }
    
    function tttValidateResult() {
        let won = false;
        for (let i = 0; i < tttConditions.length; i++) {
            const [a, b, c] = tttConditions[i];
            // Check if board state matches a win condition
            if (tttState[a] && tttState[a] === tttState[b] && tttState[a] === tttState[c]) {
                won = true;
                // Highlight winning cells
                [a, b, c].forEach(idx => {
                    if(tttBoard.children[idx]) {
                         tttBoard.children[idx].style.backgroundColor = 'var(--secondary-color)';
                    }
                });
                break;
            }
        }
        
        if (won) { 
            tttUpdateStatus(tttMsgWin()); 
            tttActive = false; 
        } else if (!tttState.includes('')) { // Check for draw
            tttUpdateStatus(tttMsgDraw()); 
            tttActive = false; 
        } else { 
            tttChangePlayer(); // No winner, no draw, change player
        }
    }
    
    function tttRestartGame() {
        tttActive = true;
        tttPlayer = 'X';
        tttState = Array(9).fill('');
        tttRenderBoard(); // Re-draw the empty board
        tttUpdateStatus(tttMsgTurn());
    }
    
    // Add listener to the reset button
    if(tttResetBtn) {
        tttResetBtn.addEventListener('click', tttRestartGame);
    }
    
    // Initial draw of the board when the page loads
    tttRenderBoard();
}

// =======================================================
// 5. ROCK, PAPER, SCISSORS LOGIC (for rps.html)
// =======================================================
if (document.getElementById('rps-result')) {
    
    const rpsResult = document.getElementById('rps-result');
    const rpsPlayerScore = document.getElementById('rps-player-score');
    const rpsCompScore = document.getElementById('rps-comp-score');
    const rpsChoices = ['rock', 'paper', 'scissors'];
    let pScore = 0;
    let cScore = 0;

    function getComputerChoice() { 
        return rpsChoices[Math.floor(Math.random() * 3)]; 
    }
    
    function getEmoji(choice) {
        if (choice === 'rock') return '👊';
        if (choice === 'paper') return '✋';
        if (choice === 'scissors') return '✌️';
        return '';
    }
    
    // Make function global so HTML onclick can find it
    window.playRPS = function(playerChoice) {
        const computerChoice = getComputerChoice();
        const p = getEmoji(playerChoice);
        const c = getEmoji(computerChoice);
        let result = '';

        if (playerChoice === computerChoice) {
            result = `It's a tie! ${p} vs ${c}`;
            rpsResult.style.color = 'var(--text-color)';
        } else if (
            (playerChoice === 'rock' && computerChoice === 'scissors') ||
            (playerChoice === 'paper' && computerChoice === 'rock') ||
            (playerChoice === 'scissors' && computerChoice === 'paper')
        ) {
            result = `You Win! ${p} beats ${c}`;
            rpsResult.style.color = 'var(--secondary-color)';
            pScore++;
        } else {
            result = `You Lose! ${c} beats ${p}`;
            rpsResult.style.color = '#dc3545';
            cScore++;
        }
        
        // Update UI
        rpsResult.innerHTML = result;
        rpsPlayerScore.textContent = pScore;
        rpsCompScore.textContent = cScore;
    }
    
    // Make function global
    window.resetRPS = function() {
        pScore = 0;
        cScore = 0;
        rpsPlayerScore.textContent = pScore;
        rpsCompScore.textContent = cScore;
        rpsResult.innerHTML = 'Score reset. Click a hand to begin!';
        rpsResult.style.color = 'var(--text-color)';
    }
}

// =======================================================
// 6. MEMORY CARD GAME LOGIC (for memory.html)
// =======================================================
if (document.getElementById('memory-board')) {
    
    const memoryBoard = document.getElementById('memory-board');
    const memoryStatus = document.getElementById('memory-status');
    const memoryIcons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let lockBoard = false;
    
    function shuffle(array) {
        // Fisher-Yates shuffle
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function createBoard() {
        cards = shuffle([...memoryIcons, ...memoryIcons]); // Double the icons
        memoryBoard.innerHTML = ''; // Clear board
        cards.forEach((icon, index) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('memory-card');
            cardElement.dataset.icon = icon;
            cardElement.dataset.index = index;
            cardElement.innerHTML = '?'; // Show back of card
            cardElement.addEventListener('click', flipCard);
            memoryBoard.appendChild(cardElement);
        });
        updateMemoryStatus();
    }
    
    function flipCard(event) {
        // Find the card element, even if user clicks on the icon inside it
        const card = event.target.closest('.memory-card'); 
        if (!card || lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        card.classList.add('flipped');
        card.innerHTML = card.dataset.icon; // Show icon
        flippedCards.push(card);
        
        // Check if two cards are flipped
        if (flippedCards.length === 2) {
            lockBoard = true; // Lock board
            moves++; // Increment moves
            checkForMatch();
        }
    }
    
    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.icon === card2.dataset.icon;
        
        // If it's a match, disable cards. If not, unflip them.
        isMatch ? disableCards(card1, card2) : unflipCards(card1, card2);
    }
    
    function disableCards(card1, card2) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        resetBoard(); // Check for win
    }
    
    function unflipCards(card1, card2) {
        // Wait 1 second before flipping back
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.innerHTML = '?';
            card2.innerHTML = '?';
            resetBoard();
        }, 1000);
    }
    
    function resetBoard() {
        [flippedCards, lockBoard] = [[], false]; // Reset flipped cards and unlock board
        updateMemoryStatus();
        
        // Check for win
        if (matchedPairs === memoryIcons.length) {
            memoryStatus.innerHTML = `🏆 You won in ${moves} moves!`;
            // Game over! Save the score (lower is better)
            saveScore('memory', moves);
        }
    }
    
    function updateMemoryStatus() {
        memoryStatus.innerHTML = `Moves: ${moves} | Pairs Left: ${memoryIcons.length - matchedPairs}`;
    }
    
    // Make function global for reset button
    window.initMemoryGame = function() {
        [flippedCards, matchedPairs, moves, lockBoard] = [[], 0, 0, false];
        createBoard();
    }
    
    // Initialize game on page load
    initMemoryGame();

    // Add listener for reset button
    const resetButton = document.getElementById('memory-reset-btn');
    if (resetButton) {
        resetButton.addEventListener('click', initMemoryGame);
    }
}

// =======================================================
// 7. SNAKE GAME LOGIC (for snake.html)
// =======================================================
if (document.getElementById('snake-board')) {
    const canvas = document.getElementById('snake-board');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('snake-start-btn');
    const scoreDisplay = document.getElementById('snake-display');
    const gridSize = 20; // 400px / 20 = 20 cells
    const cellSize = canvas.width / gridSize;
    const speed = 150; // Milliseconds per frame
    let snake, food, dx, dy, score, gameLoopId;

    // --- Get touch control buttons ---
    const btnUp = document.getElementById('snake-up');
    const btnDown = document.getElementById('snake-down');
    const btnLeft = document.getElementById('snake-left');
    const btnRight = document.getElementById('snake-right');


    function generateFood() {
        food = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
        // Ensure food doesn't spawn on the snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                generateFood(); // Try again
            }
        }
    }
    
    function drawElement(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    
    function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawElement(food.x, food.y, 'red');
        snake.forEach(segment => drawElement(segment.x, segment.y, 'green'));
    }
    
    function moveSnake() {
        if (!gameLoopId) return; // Stop if gameLoopId is cleared
        if (dx === 0 && dy === 0 && snake.length > 1) return; // Don't move if paused (and not at start)

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        
        // Check for wall collision
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return gameOver();
        }
        
        // Check for self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return gameOver();
            }
        }
        
        snake.unshift(head); // Add new head
        
        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            generateFood();
        } else {
            snake.pop(); // Remove tail
        }
        drawGame();
    }
    
    function changeDirection(event) {
        // Prevent page scrolling with arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }
        
        // Check for 'key' (from keyboard) or 'dataset.key' (from our buttons)
        const keyPressed = event.key || event.currentTarget.dataset.key;
        const goingUp = dy === -1, goingDown = dy === 1, goingLeft = dx === -1, goingRight = dx === 1;

        // Start game on first keypress if not started
        if (dx === 0 && dy === 0 && gameLoopId === null) { // Check gameLoopId to prevent restart
             gameLoopId = setInterval(moveSnake, speed);
        }

        // Prevent snake from reversing on itself
        if (keyPressed === 'ArrowLeft' && !goingRight) { dx = -1; dy = 0; }
        else if (keyPressed === 'ArrowUp' && !goingDown) { dx = 0; dy = -1; }
        else if (keyPressed === 'ArrowRight' && !goingLeft) { dx = 1; dy = 0; }
        else if (keyPressed === 'ArrowDown' && !goingUp) { dx = 0; dy = 1; }
    }
    
    function gameOver() {
        clearInterval(gameLoopId);
        gameLoopId = null; // Clear game loop ID
        alert(`Game Over! Final Score: ${score}`);
        
        // --- SAVE SCORE ---
        if (score > 0) {
            saveScore('snake', score);
        }
        // ------------------

        startButton.textContent = 'Play Again';
        startButton.disabled = false;
        document.removeEventListener('keydown', changeDirection);
        // Remove touch listeners
        btnUp.removeEventListener('click', changeDirection);
        btnDown.removeEventListener('click', changeDirection);
        btnLeft.removeEventListener('click', changeDirection);
        btnRight.removeEventListener('click', changeDirection);
    }
    
    function initSnakeGame() {
        clearInterval(gameLoopId);
        gameLoopId = null; // Clear game loop ID
        snake = [{ x: 10, y: 10 }]; // Start snake in middle
        dx = 0; dy = 0; score = 0; // Start paused
        scoreDisplay.textContent = 'Score: 0';
        generateFood();
        drawGame(); // Draw initial state
        startButton.textContent = 'Playing... (Press Arrow Key or Controls)';
        startButton.disabled = true;
        
        // Listen for keydown to start moving
        document.addEventListener('keydown', changeDirection);

        // --- Add listeners for touch controls ---
        // We add a 'data-key' to simulate the keyboard event
        btnUp.dataset.key = 'ArrowUp';
        btnDown.dataset.key = 'ArrowDown';
        btnLeft.dataset.key = 'ArrowLeft';
        btnRight.dataset.key = 'ArrowRight';

        btnUp.addEventListener('click', changeDirection);
        btnDown.addEventListener('click', changeDirection);
        btnLeft.addEventListener('click', changeDirection);
        btnRight.addEventListener('click', changeDirection);
    }
    
    startButton.addEventListener('click', initSnakeGame);
}

// =======================================================
// 8. DINO RUN LOGIC (for dino.html) (UPDATED)
// =======================================================
if (document.getElementById('dino-game')) {
    const dino = document.getElementById('dino');
    const obstacle = document.getElementById('obstacle');
    const scoreDisplay = document.getElementById('dino-score');
    const restartBtn = document.getElementById('dino-restart-btn');
    let score = 0;
    let isJumping = false;
    let gameActive = false;
    let scoreInterval;
    let collisionCheck;

    /**
     * Helper function to draw the dino
     * @param {string} state - 'run' or 'crash'
     */
    function setDinoState(state) {
        let pixels = '';
        const grid = 5 * 5; // We defined the dino as a 5x5 grid in CSS

        // '1' = show pixel, '0' = hide (transparent div)
        // This pattern faces right
        const dinoRun = [
            '0','0','1','1','0',
            '0','1','1','1','0',
            '1','1','1','1','1',
            '0','0','1','1','0',
            '0','0','1','0','1'
        ];
        // A simple crash pattern for fun
        const dinoCrash = [
            '1','0','0','0','1',
            '0','1','0','1','0',
            '0','0','1','0','0',
            '0','1','0','1','0',
            '1','0','0','0','1'
        ];

        const pattern = (state === 'run') ? dinoRun : dinoCrash;

        for (let i = 0; i < grid; i++) {
            if (pattern[i] === '1') {
                pixels += '<div class="dino-pixel"></div>';
            } else {
                pixels += '<div></div>'; // Empty div to hold the grid space
            }
        }
        dino.innerHTML = pixels;
    }


    function jump() {
        if (isJumping || !gameActive) return;
        isJumping = true;
        dino.classList.add('dino-jump');
        setTimeout(() => {
            dino.classList.remove('dino-jump');
            isJumping = false;
        }, 500); // Must match animation-duration in CSS
    }
    
    // --- Add touch listener to the game area ---
    document.getElementById('dino-game').addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent screen from zooming
        if (!gameActive) {
            // Check if restart button is visible
            if (restartBtn.style.display === 'block') {
                startGame(); 
            } else {
                startGame(); // Start game on first tap
            }
        } else {
            jump();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scrolling
            if (!gameActive) {
                // If game is not active, but the restart button is visible,
                // it means the game has ended and we want to restart.
                if (restartBtn.style.display === 'block') {
                    startGame(); 
                } else if (!gameActive) {
                    startGame(); // Start the game if space is pressed and game isn't active
                }
            } else {
                jump();
            }
        }
    });

    function startGame() {
        if (gameActive) return; // Prevent multiple starts
        gameActive = true;
        score = 0;
        scoreDisplay.textContent = 'Score: 0';
        
        // Reset obstacle animation
        obstacle.style.animation = 'none'; // Clear previous animation
        void obstacle.offsetWidth; // Trigger reflow to apply 'none' immediately
        obstacle.style.animation = 'obstacle-move 2s linear infinite'; // Re-apply animation
        
        restartBtn.style.display = 'none';
        
        setDinoState('run'); // Set the pixel dino to its running state

        // Start scoring
        scoreInterval = setInterval(() => {
            score++;
            scoreDisplay.textContent = 'Score: ' + score;
        }, 100);

        // Start collision detection
        collisionCheck = setInterval(() => {
            if (!gameActive) {
                clearInterval(collisionCheck);
                clearInterval(scoreInterval);
                return;
            }

            const dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue('bottom'));
            let obstacleLeft = 0;
            try {
                 // getBoundingClientRect is more reliable
                 const obstacleRect = obstacle.getBoundingClientRect();
                 const gameRect = document.getElementById('dino-game').getBoundingClientRect();
                 obstacleLeft = obstacleRect.left - gameRect.left;
            } catch (e) {
                // Ignore errors if elements are not fully rendered
            }

            // Collision parameters (adjusted for smaller dino/obstacle)
            // obstacleLeft < 40 (dino's left edge passing obstacle's right edge)
            // obstacleLeft > 10 (dino's right edge passing obstacle's left edge)
            // dinoTop < 40 (dino's bottom is below obstacle's top)
            if (obstacleLeft < 40 && obstacleLeft > 10 && dinoTop < 40) { // Adjusted values
                gameActive = false;
                obstacle.style.animation = 'none'; // Stop obstacle
                clearInterval(scoreInterval);
                clearInterval(collisionCheck);
                
                setDinoState('crash'); // Show the crashed pixel dino
                restartBtn.style.display = 'block';

                // --- SAVE SCORE ---
                if (score > 0) {
                    saveScore('dino_run', score);
                }
                // ------------------
            }
        }, 10); // Check for collision every 10ms
    }
    
    restartBtn.addEventListener('click', startGame);
    
    // Initial setup: Show the dino and prompt to start
    setDinoState('run'); // Show the pixel dino at the start
}