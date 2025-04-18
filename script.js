document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        solveBtn: document.getElementById('solve-btn'),
        stepBtn: document.getElementById('step-btn'),
        resetBtn: document.getElementById('reset-btn'),
        autoBtn: document.getElementById('auto-btn'),
        queensSlider: document.getElementById('queens-slider'),
        queensValue: document.getElementById('queens-value'),
        speedSlider: document.getElementById('speed-slider'),
        speedValue: document.getElementById('speed-value'),
        chessboardContainer: document.getElementById('chessboard-container'),
        statusMessage: document.getElementById('status-text'),
        statusIcon: document.getElementById('status-icon'),
        stepCounter: document.getElementById('step-counter'),
        totalSteps: document.getElementById('total-steps'),
        timeElapsed: document.getElementById('time-elapsed'),
        algorithmCode: document.getElementById('algorithm-code'),
        themeToggle: document.getElementById('theme-toggle')
    };

    // State management
    const state = {
        currentStep: 0,
        solutionSteps: [],
        autoRunInterval: null,
        startTime: 0,
        boardSize: 8,
        isSolving: false,
        theme: localStorage.getItem('theme') || 'light'
    };

    // Initialize application
    function init() {
        setupEventListeners();
        setTheme(state.theme);
        generateEmptyChessboard(state.boardSize);
        updateSpeedDisplay();
        updateBoardSizeDisplay();
        setupEventListeners();
    }

    // Event listeners setup
    function setupEventListeners() {
        elements.solveBtn.addEventListener('click', startSolving);
        elements.stepBtn.addEventListener('click', showNextStep);
        elements.resetBtn.addEventListener('click', resetVisualizer);
        elements.autoBtn.addEventListener('click', toggleAutoRun);
        elements.speedSlider.addEventListener('input', updateSpeedDisplay);
        elements.queensSlider.addEventListener('input', updateBoardSizeDisplay);
        elements.themeToggle.addEventListener('click', toggleTheme);
        setupTabs();
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') showNextStep();
            if (e.key === 'Escape') resetVisualizer();
            if (e.key === ' ') toggleAutoRun();
        });
    }

    function setupTabs() {
        // Get all tab buttons and contents
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the tab name from data attribute
                const tabName = button.dataset.tab;
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Show corresponding content
                const activeContent = document.getElementById(`${tabName}-tab`);
                if (activeContent) {
                    activeContent.classList.add('active');
                    
                    // Add animation
                    activeContent.style.animation = 'fadeIn 0.3s ease-out';
                    setTimeout(() => {
                        activeContent.style.animation = '';
                    }, 300);
                }
                
                // Update state
                state.activeTab = tabName;
                
                // Special handling for theory tab if needed
                if (tabName === 'theory') {
                    console.log('Theory content displayed');
                    // You can add any theory-specific logic here
                }
            });
        });
        
        // Activate the default tab (algorithm)
        const defaultTab = document.querySelector('.tab-btn[data-tab="algorithm"]');
        if (defaultTab) defaultTab.click();
    }

    function setupTheoryTab() {
        const theoryTabBtn = document.querySelector('.tab-btn[data-tab="theory"]');
        const theoryTabContent = document.getElementById('theory-tab');
        
        if (theoryTabBtn && theoryTabContent) {
            theoryTabBtn.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to theory tab
                theoryTabBtn.classList.add('active');
                theoryTabContent.classList.add('active');
                
                // Add animation
                theoryTabContent.style.animation = 'fadeIn 0.3s ease-out';
                setTimeout(() => theoryTabContent.style.animation = '', 300);
                
                // Update state
                state.activeTab = 'theory';
            });
        }
    }
    // Theme management
    function setTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        elements.themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function toggleTheme() {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    // UI Updates
    function updateSpeedDisplay() {
        elements.speedValue.textContent = `${elements.speedSlider.value}ms`;
    }

    function updateBoardSizeDisplay() {
        state.boardSize = parseInt(elements.queensSlider.value);
        elements.queensValue.textContent = state.boardSize;
    }

    function updateTimeElapsed() {
        elements.timeElapsed.textContent = Math.floor(performance.now() - state.startTime);
    }

    function updateStatus(message, type = 'info') {
        const iconMap = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-circle',
            error: 'fa-times-circle'
        };
        
        elements.statusMessage.textContent = message;
        elements.statusIcon.className = `fas ${iconMap[type]}`;
        elements.statusIcon.style.color = `var(--${type}-color)`;
    }

    // Chessboard functions
    function generateEmptyChessboard(size) {
        elements.chessboardContainer.innerHTML = '';
        const chessboard = document.createElement('div');
        chessboard.className = 'chessboard';
        
        for (let row = 0; row < size; row++) {
            const chessboardRow = document.createElement('div');
            chessboardRow.className = 'chessboard-row';
            
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = `chessboard-cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add subtle hover effect
                cell.addEventListener('mouseenter', () => {
                    if (!state.isSolving) {
                        cell.style.transform = 'scale(1.05)';
                    }
                });
                
                cell.addEventListener('mouseleave', () => {
                    cell.style.transform = '';
                });
                
                chessboardRow.appendChild(cell);
            }
            
            chessboard.appendChild(chessboardRow);
        }
        
        elements.chessboardContainer.appendChild(chessboard);
    }

    function updateChessboard(board, currentRow, currentCol) {
        const chessboard = document.querySelector('.chessboard');
        if (!chessboard) return;
        
        // Reset all cells first
        const cells = chessboard.querySelectorAll('.chessboard-cell');
        cells.forEach(cell => {
            cell.classList.remove('current', 'conflict');
            cell.innerHTML = '';
        });
        
        // Update cells based on board state
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const cell = chessboard.querySelector(`.chessboard-cell[data-row="${row}"][data-col="${col}"]`);
                if (!cell) continue;
                
                // Highlight current cell being processed
                if (row === currentRow && col === currentCol) {
                    cell.classList.add('current');
                }
                
                // Place queen if present
                if (board[row][col] === 1) {
                    const queen = document.createElement('div');
                    queen.className = 'queen';
                    queen.innerHTML = '<i class="fas fa-chess-queen"></i>';
                    cell.appendChild(queen);
                    
                    // Add subtle animation when placing queens
                    queen.style.animation = 'popIn 0.3s ease-out';
                }
            }
        }
    }

    // Algorithm visualization
    function updateAlgorithmCodeHighlight(stepIndex) {
        // Clear previous highlights
        const codeLines = elements.algorithmCode.innerHTML.split('\n');
        elements.algorithmCode.innerHTML = codeLines.join('\n');
        
        if (stepIndex < state.solutionSteps.length) {
            const step = state.solutionSteps[stepIndex];
            let lineToHighlight = -1;
            
            if (step.message.includes('Placing queen')) {
                lineToHighlight = 3; // Place queen line
            } else if (step.message.includes('Backtracking')) {
                lineToHighlight = 8; // Backtrack line
            } else if (step.message.includes('All queens placed')) {
                lineToHighlight = 1; // Base case line
            }
            
            if (lineToHighlight > -1) {
                const lines = elements.algorithmCode.innerHTML.split('\n');
                lines[lineToHighlight] = `<span class="highlight-line">${lines[lineToHighlight]}</span>`;
                elements.algorithmCode.innerHTML = lines.join('\n');
                
                // Scroll to highlighted line
                const highlightedLine = elements.algorithmCode.querySelector('.highlight-line');
                if (highlightedLine) {
                    highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    // Solving functions
    async function startSolving() {
        if (state.isSolving) return;
        
        state.boardSize = parseInt(elements.queensSlider.value);
        if (state.boardSize < 4 || state.boardSize > 12) {
            updateStatus('Please select board size between 4 and 12', 'warning');
            return;
        }
        
        resetVisualizer();
        state.isSolving = true;
        
        // Update UI for solving state
        updateStatus('Solving... Please wait', 'info');
        elements.solveBtn.innerHTML = '<span class="spinner"></span> Solving';
        elements.solveBtn.disabled = true;
        state.startTime = performance.now();
        
        try {
            const response = await fetch('/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ n: state.boardSize })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.error) {
                updateStatus(data.error, 'error');
            } else {
                state.solutionSteps = data.steps;
                elements.totalSteps.textContent = state.solutionSteps.length;
                elements.stepBtn.disabled = false;
                elements.autoBtn.disabled = false;
                updateTimeElapsed();
                updateStatus('Ready to visualize. Click "Next Step" or "Auto Run"', 'success');
                
                // Auto-start visualization for small boards
                if (state.boardSize <= 6) {
                    setTimeout(toggleAutoRun, 500);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            updateStatus('Failed to solve. Please try again.', 'error');
        } finally {
            elements.solveBtn.innerHTML = '<i class="fas fa-play"></i> Solve';
            elements.solveBtn.disabled = false;
            state.isSolving = false;
        }
    }

    function showNextStep() {
        if (state.currentStep >= state.solutionSteps.length) {
            updateStatus('All steps completed! Solution found.', 'success');
            elements.stepBtn.disabled = true;
            elements.autoBtn.disabled = true;
            return;
        }
        
        const step = state.solutionSteps[state.currentStep];
        updateChessboard(step.board, step.current_row, step.current_col);
        updateAlgorithmCodeHighlight(state.currentStep);
        updateStatus(step.message, step.is_solution ? 'success' : 'info');
        
        if (step.is_solution) {
            elements.stepBtn.disabled = true;
            elements.autoBtn.disabled = true;
            celebrateCompletion();
        }
        
        state.currentStep++;
        elements.stepCounter.textContent = state.currentStep;
        updateTimeElapsed();
    }

    function toggleAutoRun() {
        if (state.autoRunInterval) {
            clearInterval(state.autoRunInterval);
            state.autoRunInterval = null;
            elements.autoBtn.innerHTML = '<i class="fas fa-bolt"></i> Auto Run';
            elements.stepBtn.disabled = false;
        } else {
            elements.autoBtn.innerHTML = '<i class="fas fa-pause"></i> Stop';
            elements.stepBtn.disabled = true;
            const speed = parseInt(elements.speedSlider.value);
            
            state.autoRunInterval = setInterval(() => {
                if (state.currentStep >= state.solutionSteps.length) {
                    clearInterval(state.autoRunInterval);
                    state.autoRunInterval = null;
                    elements.autoBtn.innerHTML = '<i class="fas fa-bolt"></i> Auto Run';
                    return;
                }
                showNextStep();
            }, speed);
        }
    }

    function resetVisualizer() {
        // Clear any running interval
        if (state.autoRunInterval) {
            clearInterval(state.autoRunInterval);
            state.autoRunInterval = null;
            elements.autoBtn.innerHTML = '<i class="fas fa-bolt"></i> Auto Run';
        }
        
        // Reset state
        state.currentStep = 0;
        state.solutionSteps = [];
        state.startTime = 0;
        state.isSolving = false;
        
        // Reset UI
        generateEmptyChessboard(state.boardSize);
        updateStatus('Ready to solve. Select board size and click Solve.', 'info');
        elements.stepCounter.textContent = '0';
        elements.totalSteps.textContent = '0';
        elements.timeElapsed.textContent = '0';
        elements.stepBtn.disabled = true;
        elements.autoBtn.disabled = true;
        elements.solveBtn.innerHTML = '<i class="fas fa-play"></i> Solve';
        elements.solveBtn.disabled = false;
        
        // Reset code highlighting
        const codeLines = elements.algorithmCode.innerHTML.replace(/<span class="highlight-line">|<\/span>/g, '');
        elements.algorithmCode.innerHTML = codeLines;
    }

    // Special effects
    function celebrateCompletion() {
        // Add confetti effect
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
        // Pulse the chessboard
        const chessboard = document.querySelector('.chessboard');
        if (chessboard) {
            chessboard.style.animation = 'pulse 1s 2';
            setTimeout(() => chessboard.style.animation = '', 2000);
        }
    }

    // Initialize the app
    init();
});

// CSS animations to add to your style.css
/*
@keyframes popIn {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(67, 97, 238, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(67, 97, 238, 0); }
    100% { box-shadow: 0 0 0 0 rgba(67, 97, 238, 0); }
}

.spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
*/

