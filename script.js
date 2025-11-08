// =======================================================
// 0. THEME SWITCHER LOGIC (NEW)
// =======================================================
// Runs first to set theme before page load
(function() {
    // Check localStorage for a saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

window.setTheme = function(theme) {
    // Set the theme on the <html> tag
    document.documentElement.setAttribute('data-theme', theme);
    // Save the theme choice to localStorage
    localStorage.setItem('theme', theme);
}

// =======================================================
// 1. MODAL/ACCOUNT LOGIC
// =======================================================
// We check if 'accountModal' exists, so this logic doesn't
// error on a page without it (though both pages have it).
const modal = document.getElementById('accountModal');
if (modal) {
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

    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    window.handleAccount = function(event) {
        event.preventDefault(); // Stop form from submitting
        const formType = modalTitle.textContent.includes('Login') ? 'Login' : 'Sign Up';
        alert(`Attempting ${formType}... (Success in demo!)\n\nIn a real app, this would contact the server.`);
        closeModal();
    }
}

// =======================================================
// 2. TIC-TAC-TOE LOGIC
// =======================================================
// Only run this code if the TTT board is on the page
if (document.getElementById('tictactoe-board')) {
    const tttStatus = document.getElementById('tictactoe-status');
    const tttBoard = document.getElementById('tictactoe-board');
    const tttResetBtn = document.getElementById('tictactoe-reset-btn');

    let tttPlayer = 'X';
    let tttState = Array(9).fill('');
    let tttActive = true;
    const tttConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    const tttMsgTurn = () => `It's ${tttPlayer}'s turn!`;
    const tttMsgWin = () => `Player ${tttPlayer} has won! 🎉`;
    const tttMsgDraw = () => `Game ended in a draw! 🤷‍♂️`;

    function tttUpdateStatus(message) { tttStatus.innerHTML = message; }
    function tttRenderBoard() {
        tttBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            if (tttState[i]) { cell.innerHTML = tttState[i]; cell.classList.add(tttState[i].toLowerCase()); }
            cell.addEventListener('click', tttHandleClick);
            tttBoard.appendChild(cell);
        }
    }
    function tttHandleClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        if (tttState[index] !== '' || !tttActive) return;
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
            if (tttState[a] && tttState[a] === tttState[b] && tttState[a] === tttState[c]) {
                won = true;
                [a, b, c].forEach(idx => tttBoard.children[idx].style.backgroundColor = 'var(--secondary-color)');
                break;
            }
        }
        if (won) { tttUpdateStatus(tttMsgWin()); tttActive = false; } 
        else if (!tttState.includes('')) { tttUpdateStatus(tttMsgDraw()); tttActive = false; } 
        else { tttChangePlayer(); }
    }
    function tttRestartGame() {
        tttActive = true;
        tttPlayer = 'X';
        tttState = Array(9).fill('');
        tttRenderBoard();
        tttUpdateStatus(tttMsgTurn());
    }
    tttResetBtn.addEventListener('click', tttRestartGame);
    tttRenderBoard();
}

// =======================================================
// 3. ROCK, PAPER, SCISSORS LOGIC
// =======================================================
if (document.getElementById('rps-result')) {
    const rpsResult = document.getElementById('rps-result');
    const rpsPlayerScore = document.getElementById('rps-player-score');
    const rpsCompScore = document.getElementById('rps-comp-score');
    const rpsChoices = ['rock', 'paper', 'scissors'];
    let pScore = 0;
    let cScore = 0;

    function getComputerChoice() { return rpsChoices[Math.floor(Math.random() * 3)]; }
    function getEmoji(choice) {
        if (choice === 'rock') return '👊';
        if (choice === 'paper') return '✋';
        if (choice === 'scissors') return '✌️';
        return '';
    }

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

        rpsResult.innerHTML = result;
        rpsPlayerScore.textContent = pScore;
        rpsCompScore.textContent = cScore;
    }

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
// 4. MEMORY CARD GAME LOGIC
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
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    function createBoard() {
        cards = shuffle([...memoryIcons, ...memoryIcons]);
        memoryBoard.innerHTML = '';
        cards.forEach((icon, index) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('memory-card');
            cardElement.dataset.icon = icon;
            cardElement.dataset.index = index;
            cardElement.innerHTML = '?';
            cardElement.addEventListener('click', flipCard);
            memoryBoard.appendChild(cardElement);
        });
        updateMemoryStatus();
    }
    function flipCard(event) {
        const card = event.target;
        if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        card.innerHTML = card.dataset.icon;
        flippedCards.push(card);
        if (flippedCards.length === 2) {
            lockBoard = true;
            moves++;
            checkForMatch();
        }
    }
    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.icon === card2.dataset.icon;
        isMatch ? disableCards(card1, card2) : unflipCards(card1, card2);
    }
    function disableCards(card1, card2) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        resetBoard();
    }
    function unflipCards(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.innerHTML = '?';
            card2.innerHTML = '?';
            resetBoard();
        }, 1000);
    }
    function resetBoard() {
        [flippedCards, lockBoard] = [[], false];
        updateMemoryStatus();
        if (matchedPairs === memoryIcons.length) {
            memoryStatus.innerHTML = `🏆 You won in ${moves} moves!`;
        }
    }
    function updateMemoryStatus() {
        memoryStatus.innerHTML = `Moves: ${moves} | Pairs Left: ${memoryIcons.length - matchedPairs}`;
    }
    window.initMemoryGame = function() {
        [flippedCards, matchedPairs, moves, lockBoard] = [[], 0, 0, false];
        createBoard();
    }
    initMemoryGame();
}

// =======================================================
// 5. WHAC-A-MOLE LOGIC (NEW)
// =======================================================
if (document.getElementById('wam-grid')) {
    const wamGrid = document.getElementById('wam-grid');
    const wamScore = document.getElementById('wam-score');
    const wamStartBtn = document.getElementById('wam-start-btn');
    let wamCurrentScore = 0;
    let moleTimerId = null;
    let gameActive = false;

    // Create the 9 squares
    for (let i = 0; i < 9; i++) {
        const square = document.createElement('div');
        square.classList.add('wam-square');
        square.id = 'wam-' + i;
        wamGrid.appendChild(square);
        square.addEventListener('mousedown', () => {
            if (gameActive && square.classList.contains('mole')) {
                wamCurrentScore++;
                wamScore.textContent = 'Score: ' + wamCurrentScore;
                square.classList.remove('mole');
            }
        });
    }
    
    function randomSquare() {
        // Clear all squares
        document.querySelectorAll('.wam-square').forEach(sq => sq.classList.remove('mole'));
        // Add mole to a random one
        let randomPos = Math.floor(Math.random() * 9);
        document.getElementById('wam-' + randomPos).classList.add('mole');
    }
    
    wamStartBtn.addEventListener('click', () => {
        if (gameActive) return;
        gameActive = true;
        wamCurrentScore = 0;
        wamScore.textContent = 'Score: 0';
        wamStartBtn.disabled = true;
        moleTimerId = setInterval(randomSquare, 800);
        
        // Game duration: 20 seconds
        setTimeout(() => {
            clearInterval(moleTimerId);
            gameActive = false;
            wamStartBtn.disabled = false;
            alert('Game Over! Your final score is: ' + wamCurrentScore);
            document.querySelectorAll('.wam-square').forEach(sq => sq.classList.remove('mole'));
        }, 20000);
    });
}

// =======================================================
// 6. COOKIE CLICKER LOGIC (NEW)
// =======================================================
if (document.getElementById('cookie-clicker')) {
    const cookieImg = document.getElementById('cookie-img');
    const cookieScore = document.getElementById('cookie-score');
    const cookieCps = document.getElementById('cookie-cps');
    const autoClickerBtn = document.getElementById('upgrade-auto-clicker');

    let score = 0;
    let cookiesPerSecond = 0;
    let autoClickerCost = 15;

    cookieImg.addEventListener('click', () => {
        score++;
        updateScore();
    });

    autoClickerBtn.addEventListener('click', () => {
        if (score >= autoClickerCost) {
            score -= autoClickerCost;
            cookiesPerSecond++;
            autoClickerCost = Math.ceil(autoClickerCost * 1.5); // Increase cost
            
            autoClickerBtn.textContent = `Auto-Clicker (Cost: ${autoClickerCost})`;
            updateScore();
        } else {
            alert('Not enough cookies!');
        }
    });

    function updateScore() {
        cookieScore.textContent = `${Math.floor(score)} Cookies`;
        cookieCps.textContent = `per second: ${cookiesPerSecond}`;
    }

    // Game loop for auto-clickers
    setInterval(() => {
        score += cookiesPerSecond;
        updateScore();
    }, 1000);
}