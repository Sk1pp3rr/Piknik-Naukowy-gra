// ================== GRA 2: PUZZLE ==================
let puzzlePos = [], puzzleCorrect = [], selectedTile = null;
let puzzleMoves = 0, puzzleStartTime = 0, puzzleActive = false;
let currentPuzzleLevel = '';
let currentShuffleAmount = 'full';

const myImages = [
    'puzzle1.jpg',
    'puzzle2.jpg',
    'puzzle3.jpg'
];
let currentImageUrl = '';

function openPuzzleMenu() { showScreen('screen-puzzle-menu'); }

function openPuzzle(levelName, shuffleAmount) {
    currentPuzzleLevel = levelName;
    currentShuffleAmount = shuffleAmount;
    currentImageUrl = myImages[Math.floor(Math.random() * myImages.length)];
    
    showScreen('screen-puzzle');
    document.getElementById('btn-puzzle-start').style.display = 'inline-block';
    puzzleActive = false; puzzleMoves = 0;
    document.getElementById('puzzle-moves').innerText = '0';
    document.getElementById('puzzle-timer').innerText = '0s';
    
    puzzlePos = []; puzzleCorrect = []; selectedTile = null;
    for(let r=0; r<3; r++) { 
        for(let c=0; c<4; c++) { 
            puzzleCorrect.push({r, c}); 
            puzzlePos.push({r, c}); 
        } 
    }
    renderPuzzle();
}

function startPuzzle() {
    document.getElementById('btn-puzzle-start').style.display = 'none';
    puzzleActive = true;
    puzzleStartTime = Date.now();
    
    if (currentShuffleAmount === 'full') {
        for(let i = puzzlePos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [puzzlePos[i], puzzlePos[j]] = [puzzlePos[j], puzzlePos[i]];
        }
    } else {
        let swaps = parseInt(currentShuffleAmount);
        for(let i=0; i<swaps; i++) {
            let a = Math.floor(Math.random() * puzzlePos.length);
            let b = Math.floor(Math.random() * puzzlePos.length);
            if (a !== b) { 
                [puzzlePos[a], puzzlePos[b]] = [puzzlePos[b], puzzlePos[a]]; 
            } else { 
                i--; 
            }
        }
    }
    
    let tInt = setInterval(() => { 
        document.getElementById('puzzle-timer').innerText = Math.floor((Date.now() - puzzleStartTime)/1000) + 's'; 
    }, 1000);
    registerInterval(tInt);
    
    renderPuzzle();
}

function renderPuzzle() {
    const board = document.getElementById('puzzle-board'); 
    board.innerHTML = '';
    
    puzzlePos.forEach((pos, index) => {
        let div = document.createElement('div'); 
        div.className = 'tile';
        if(puzzleActive) div.classList.add('active');
        if(selectedTile === index) div.classList.add('selected');
        
        div.style.backgroundPosition = `-${pos.c * 100}px -${pos.r * 100}px`;
        div.style.backgroundImage = `url('${currentImageUrl}')`;
        
        if(puzzleActive) {
            div.onclick = () => {
                if(selectedTile === null) { 
                    selectedTile = index; 
                } else {
                    let temp = puzzlePos[selectedTile]; 
                    puzzlePos[selectedTile] = puzzlePos[index]; 
                    puzzlePos[index] = temp;
                    selectedTile = null; 
                    puzzleMoves++; 
                    document.getElementById('puzzle-moves').innerText = puzzleMoves;
                    checkPuzzleWin();
                }
                renderPuzzle();
            };
        }
        board.appendChild(div);
    });
}

function checkPuzzleWin() {
    let win = true;
    for(let i=0; i<puzzlePos.length; i++){ 
        if(puzzlePos[i].r !== puzzleCorrect[i].r || puzzlePos[i].c !== puzzleCorrect[i].c) { 
            win = false; break; 
        } 
    }
    if(win) {
        puzzleActive = false;
        clearAllIntervals();
        let finalTime = Math.floor((Date.now() - puzzleStartTime)/1000);
        setTimeout(() => saveScore(`PUZZLE (${currentPuzzleLevel})`, `${puzzleMoves} RUCHOW`, puzzleMoves, finalTime), 300);
    }
}