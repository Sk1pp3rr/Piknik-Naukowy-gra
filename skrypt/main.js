// ================== ZARZĄDZANIE TIMERAMI ==================
let globalIntervals = [];
function clearAllIntervals() { 
    globalIntervals.forEach(clearInterval); 
    globalIntervals = []; 
}
function registerInterval(intId) { 
    globalIntervals.push(intId); 
}

// ================== NAWIGACJA ==================
function showScreen(id) {
    clearAllIntervals();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ================== SYSTEM WYNIKÓW ARCADE ==================
let pendingScore = null;

function saveScore(gameName, scoreText, numericScore, timeValue = null) {
    pendingScore = { gameName, scoreText, numericScore, timeValue };
    document.getElementById('arcade-score-display').innerText = `${gameName} - ${scoreText}`;
    document.getElementById('arcade-initials').value = '';
    showScreen('screen-name-entry');
    setTimeout(() => document.getElementById('arcade-initials').focus(), 100);
}

function submitScore() {
    let name = document.getElementById('arcade-initials').value.trim();
    if (name.length === 0) name = "AAA";
    
    let scores = JSON.parse(localStorage.getItem('morskieScoresArcade')) || {};
    if (!scores[pendingScore.gameName]) scores[pendingScore.gameName] = [];
    
    scores[pendingScore.gameName].push({ 
        name: name, 
        scoreText: pendingScore.scoreText, 
        num: pendingScore.numericScore, 
        time: pendingScore.timeValue 
    });
    
    // Sortowanie
    if(pendingScore.gameName.includes('QUIZ')) {
        scores[pendingScore.gameName].sort((a,b) => {
            if (b.num !== a.num) return b.num - a.num; 
            return a.time - b.time;
        });
    } else if(pendingScore.gameName.includes('PUZZLE')) {
        scores[pendingScore.gameName].sort((a,b) => {
            if (a.time !== b.time) return a.time - b.time;
            return a.num - b.num;
        });
    } else {
        scores[pendingScore.gameName].sort((a,b) => a.num - b.num);
    }
    
    scores[pendingScore.gameName] = scores[pendingScore.gameName].slice(0, 5);
    localStorage.setItem('morskieScoresArcade', JSON.stringify(scores));
    
    openScoreboard();
}

function openScoreboard() {
    showScreen('screen-scoreboard');
    const container = document.getElementById('leaderboard-content');
    let scores = JSON.parse(localStorage.getItem('morskieScoresArcade')) || {};
    container.innerHTML = '';

    const games = Object.keys(scores).sort();
    
    if (games.length === 0) {
        container.innerHTML = `<p style="color:#555; text-align:center;">NO DATA... PLAY A GAME!</p>`;
        return;
    }

    games.forEach(g => {
        let html = `<h3 style="color:#f0f; border-bottom: 1px solid #f0f; display:inline-block; margin-top:20px;">> ${g} <</h3>`;
        html += `<table class="arcade-table"><tr><th>RANK</th><th>NAME</th><th>SCORE</th><th>TIME</th></tr>`;
        scores[g].forEach((s, idx) => {
            let timeStr = (s.time !== null && s.time !== undefined) ? `${s.time}s` : '---';
            html += `<tr><td>#${idx+1}</td><td>${s.name}</td><td>${s.scoreText}</td><td>${timeStr}</td></tr>`;
        });
        html += `</table>`;
        container.innerHTML += html;
    });
}