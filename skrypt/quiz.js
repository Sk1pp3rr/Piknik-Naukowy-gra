// ================== GRA 3: QUIZ ==================
const fallbackQuestions = [
    {level:"baby", q:"Co pływa po wodzie?", a:["Statek","Samolot","Samochód","Rower"], c:0},
    {level:"baby", q:"Kto mieszka w muszli?", a:["Ryba","Krab","Słoń","Ptak"], c:1},
    {level:"easy", q:"Fale morskie powstają głównie na skutek:", a:["pływów","wiatru","prądów","opadów"], c:1},
    {level:"easy", q:"Bałtyk jest morzem:", a:["otwartym","półzamkniętym","tropikalnym","oceanem"], c:1},
    {level:"medium", q:"Co to jest cofka?", a:["gwałtowny odpływ wody","podniesienie poziomu przy brzegu","spadek ciśnienia","prąd"], c:1},
    {level:"hard", q:"Zjawisko cofki jest szczególnie groźne dla:", a:["statków w porcie","plażowiczów","rybaków przy brzegu","wszystkich powyższych"], c:3}
];

let quizQueue = [], currentQ = 0, quizScore = 0, quizStartTime = 0, currentQuizLevel = '';

function openQuizMenu() { 
    showScreen('screen-quiz-menu'); 
}

async function startQuiz(level) {
    currentQuizLevel = level.toUpperCase();
    let loadedQuestions = [];
    
    console.log("🕵️‍♂️ Próbuję załadować plik quiz.txt...");

    try {
        const response = await fetch('quiz.txt?t=' + Date.now());
        if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            
            lines.forEach((line, index) => {
                const parts = line.split('|');
                if(parts.length === 4) { 
                    loadedQuestions.push({ 
                        q: parts[0].trim(), 
                        a: parts[1].split(',').map(ans => ans.trim()), 
                        c: parseInt(parts[2].trim()), 
                        level: parts[3].trim().replace(/\r/g, '').toLowerCase() 
                    }); 
                } else {
                    console.warn(`⚠️ Błąd struktury w linijce ${index + 1}: ${line}`);
                }
            });
            console.log(`🎯 Pomyślnie wczytano ${loadedQuestions.length} pytań z pliku.`);
        } else {
            console.error(`❌ Serwer nie znalazł pliku (Błąd ${response.status}).`);
        }
    } catch (e) { 
        console.error("❌ Błąd sieci (brak serwera) - ładuję bazę z kodu."); 
    }

    if (loadedQuestions.length === 0) {
        loadedQuestions = fallbackQuestions;
    }

    let pool = loadedQuestions.filter(q => q.level === level.toLowerCase());
    
    if(pool.length === 0) {
        pool = fallbackQuestions.filter(q => q.level === level.toLowerCase()); 
    }
    
    quizQueue = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
    currentQ = 0; 
    quizScore = 0; 
    
    showScreen('screen-quiz');
    quizStartTime = Date.now();
    renderQuestion();
}

function renderQuestion() {
    if(currentQ >= quizQueue.length) {
        let finalTime = Math.floor((Date.now() - quizStartTime) / 1000);
        let p = Math.round((quizScore/quizQueue.length)*100);
        setTimeout(() => saveScore(`QUIZ (${currentQuizLevel})`, `${p}% POPRAWNIE`, p, finalTime), 200);
        return;
    }
    
    let q = quizQueue[currentQ];
    document.getElementById('quiz-progress').innerText = `Pytanie ${currentQ + 1}/${quizQueue.length}`;
    document.getElementById('quiz-question').innerText = q.q;
    
    let answersDiv = document.getElementById('quiz-answers'); 
    answersDiv.innerHTML = '';
    
    q.a.forEach((ans, idx) => {
        let btn = document.createElement('button'); 
        btn.innerText = ans;
        btn.onclick = () => { 
            if(idx === q.c) quizScore++; 
            currentQ++; 
            renderQuestion(); 
        };
        answersDiv.appendChild(btn);
    });
}