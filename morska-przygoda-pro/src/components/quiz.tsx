import { useState, useEffect, useRef } from 'react';

// Typujemy nasze dane
type Question = {
  q: string;
  a: string[];
  c: number;
  level: string;
};

const numOfQuestions = 10;

const fallbackQuestions: Question[] = [
  { level: "baby", q: "Co pływa po wodzie? (Awaryjne)", a: ["Statek", "Samolot", "Samochód", "Rower"], c: 0 },
  { level: "easy", q: "Fale morskie powstają głównie na skutek: (Awaryjne)", a: ["pływów", "wiatru", "prądów", "opadów"], c: 1 },
  { level: "medium", q: "Co to jest cofka? (Awaryjne)", a: ["gwałtowny odpływ wody", "podniesienie poziomu przy brzegu", "spadek ciśnienia", "prąd"], c: 1 },
  { level: "hard", q: "Pływaki Argo w ciężkich warunkach: (Awaryjne)", a: ["nie działają", "pływają i rejestrują dane", "toną", "zmieniają kierunek wiatru"], c: 1 }
];

export default function Quiz({ goBack, onSaveScore }: { goBack: () => void, onSaveScore: (g: string, t: string, n: number, tm: number | null) => void }) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>('');
  
  const [isRevealing, setIsRevealing] = useState(false);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);

  const [startTime, setStartTime] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  // --- SYSTEM PADA Oparty o czyste ID (HTML) ---
  const [cursorIndex, setCursorIndex] = useState(0);
  
  // Przechowujemy tylko stan ekranu
  const padStateRef = useRef({ 
    cursorIndex, selectedLevel, isFinished, isRevealing, loading 
  });
  
  useEffect(() => { 
    padStateRef.current = { cursorIndex, selectedLevel, isFinished, isRevealing, loading }; 
  }, [cursorIndex, selectedLevel, isFinished, isRevealing, loading]);

  const lastNavTime = useRef(0);
  const navCooldown = 250;

  useEffect(() => {
    let loopId: number;
    let wasAPressed = false;

    const pollGamepad = () => {
      const pad = Array.from(navigator.getGamepads()).find(p => p !== null); 
      if (pad) {
        const now = Date.now();
        const state = padStateRef.current;
        const deadzone = 0.4; 
        
        const up = pad.buttons[12]?.pressed || pad.axes[1] < -deadzone;
        const down = pad.buttons[13]?.pressed || pad.axes[1] > deadzone;
        const left = pad.buttons[14]?.pressed || pad.axes[0] < -deadzone;
        const right = pad.buttons[15]?.pressed || pad.axes[0] > deadzone;

        // NAWIGACJA
        if (now - lastNavTime.current > navCooldown && !state.isRevealing && !state.loading) {
          
          if (!state.selectedLevel) {
            // EKRAN: Wybór Poziomu (Indeksy 0-4 pionowo)
            if (down && state.cursorIndex < 4) { setCursorIndex(c => c + 1); lastNavTime.current = now; }
            if (up && state.cursorIndex > 0) { setCursorIndex(c => c - 1); lastNavTime.current = now; }
          
          } else if (!state.isFinished) {
            // EKRAN: Pytania (Indeksy 0,1,2,3 - Grid 2x2. Indeks 4 - Przerwij)
            if (down) {
              if (state.cursorIndex === 0 || state.cursorIndex === 1) setCursorIndex(c => c + 2);
              else if (state.cursorIndex === 2 || state.cursorIndex === 3) setCursorIndex(4);
              lastNavTime.current = now;
            }
            if (up) {
              if (state.cursorIndex === 4) setCursorIndex(2);
              else if (state.cursorIndex === 2 || state.cursorIndex === 3) setCursorIndex(c => c - 2);
              lastNavTime.current = now;
            }
            if (right && (state.cursorIndex === 0 || state.cursorIndex === 2)) { setCursorIndex(c => c + 1); lastNavTime.current = now; }
            if (left && (state.cursorIndex === 1 || state.cursorIndex === 3)) { setCursorIndex(c => c - 1); lastNavTime.current = now; }
            
          } else {
            // EKRAN: Zakończenie (Indeksy 0,1 pionowo)
            if (down && state.cursorIndex < 1) { setCursorIndex(1); lastNavTime.current = now; }
            if (up && state.cursorIndex > 0) { setCursorIndex(0); lastNavTime.current = now; }
          }
        }

        // AKCJA = SYMULACJA KLIKNIĘCIA PO ID HTML (TYLKO PRZYCISK A)
        const isAPressed = pad.buttons[0]?.pressed;

        if (isAPressed && !wasAPressed && !state.isRevealing && !state.loading) {
           const btn = document.getElementById(`quiz-btn-${state.cursorIndex}`);
           if (btn) btn.click();
        }

        wasAPressed = isAPressed;
      }
      loopId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();
    return () => cancelAnimationFrame(loopId);
  }, []); 

  // --- LOGIKA GRY ---
  const selectLevelAndReset = (lvl: string) => {
    setSelectedLevel(lvl);
    setCursorIndex(0); 
  };

  useEffect(() => {
    if (!selectedLevel) return;
    setLoading(true);
    setDebugMessage('Szukam pliku w folderze public (./quiz.txt)...');

    fetch('./quiz.txt?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error(`Błąd serwera: ${res.status}`);
        return res.text();
      })
      .then(text => {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const loaded: Question[] = [];

        lines.forEach(line => {
          const parts = line.split('|');
          if (parts.length >= 4) {
            loaded.push({
              q: parts[0].trim(),
              a: parts[1].split(',').map(ans => ans.trim()),
              c: parseInt(parts[2].trim()),
              level: parts[3].trim().replace(/\r/g, '').toLowerCase()
            });
          }
        });

        let pool = loaded.filter(q => q.level === selectedLevel);
        if (pool.length === 0) pool = fallbackQuestions.filter(q => q.level === selectedLevel);
        if (pool.length === 0) pool = fallbackQuestions;

        setQuestions(pool.sort(() => 0.5 - Math.random()).slice(0, numOfQuestions));
        setStartTime(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setDebugMessage(`❌ BŁĄD: ${err.message}`);
        let pool = fallbackQuestions.filter(q => q.level === selectedLevel);
        if (pool.length === 0) pool = fallbackQuestions;
        setQuestions(pool.sort(() => 0.5 - Math.random()).slice(0, numOfQuestions));
        setStartTime(Date.now());
        setTimeout(() => setLoading(false), 3000); 
      });
  }, [selectedLevel]);

  const handleAnswer = (index: number) => {
    if (isRevealing || questions.length === 0) return;
    
    const currentQ = questions[currentIndex];
    if (!currentQ) return; 

    setSelectedAnswerIdx(index);
    setIsRevealing(true);

    const isCorrect = index === currentQ.c;
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setCursorIndex(0); 
      } else {
        setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
        setIsFinished(true);
        setCursorIndex(0); 
      }
      setIsRevealing(false);
      setSelectedAnswerIdx(null);
    }, 4000);
  };

  const getButtonClass = (index: number) => {
    const baseClass = "font-semibold py-4 px-6 rounded-xl transition-all duration-300 border-2 ";
    const currentQ = questions[currentIndex];
    
    if (!isRevealing) {
      if (cursorIndex === index) {
        return baseClass + "bg-cyan-500 text-white border-yellow-400 ring-4 ring-yellow-400 scale-105 shadow-lg z-10";
      }
      return baseClass + "bg-cyan-50 text-blue-900 border-cyan-400 shadow-sm";
    }

    const isCorrectAnswer = index === currentQ?.c;
    const isSelectedAnswer = index === selectedAnswerIdx;

    if (isCorrectAnswer) return baseClass + "bg-green-500 text-white border-green-300 shadow-[0_0_20px_#4ade80,inset_0_0_10px_#4ade80] scale-105 z-10";
    if (isSelectedAnswer && !isCorrectAnswer) return baseClass + "bg-red-600 text-white border-red-400 shadow-[0_0_20px_#f87171,inset_0_0_10px_#f87171] scale-95";
    
    return baseClass + "bg-gray-100 text-gray-400 border-gray-200 opacity-20 scale-90 pointer-events-none";
  };

  // EKRAN WYBORU POZIOMU
  if (!selectedLevel) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Wybierz poziom trudności</h2>
        
        <button 
          id="quiz-btn-0"
          onMouseEnter={() => setCursorIndex(0)} 
          onClick={() => selectLevelAndReset('baby')} 
          className={`font-bold py-3 px-8 rounded-full w-72 transition-all uppercase tracking-wider 
            ${cursorIndex === 0 ? 'bg-cyan-400 text-white ring-4 ring-yellow-400 scale-110 shadow-lg' : 'bg-cyan-300 text-blue-900 shadow-sm'}`}
        >
          Mały Odkrywca
        </button>
        
        <button 
          id="quiz-btn-1"
          onMouseEnter={() => setCursorIndex(1)} 
          onClick={() => selectLevelAndReset('easy')} 
          className={`font-bold py-3 px-8 rounded-full w-72 transition-all uppercase tracking-wider 
            ${cursorIndex === 1 ? 'bg-cyan-600 text-white ring-4 ring-yellow-400 scale-110 shadow-lg' : 'bg-cyan-500 text-white shadow-sm'}`}
        >
          Plażowicz
        </button>
        
        <button 
          id="quiz-btn-2"
          onMouseEnter={() => setCursorIndex(2)} 
          onClick={() => selectLevelAndReset('medium')} 
          className={`font-bold py-3 px-8 rounded-full w-72 transition-all uppercase tracking-wider 
            ${cursorIndex === 2 ? 'bg-blue-600 text-white ring-4 ring-yellow-400 scale-110 shadow-lg' : 'bg-blue-500 text-white shadow-sm'}`}
        >
          Wilk Morski
        </button>
        
        <button 
          id="quiz-btn-3"
          onMouseEnter={() => setCursorIndex(3)} 
          onClick={() => selectLevelAndReset('hard')} 
          className={`font-bold py-3 px-8 rounded-full w-72 transition-all uppercase tracking-wider 
            ${cursorIndex === 3 ? 'bg-blue-800 text-white ring-4 ring-yellow-400 scale-110 shadow-lg' : 'bg-blue-700 text-white shadow-sm'}`}
        >
          Modelarz
        </button>
        
        <button 
          id="quiz-btn-4"
          onMouseEnter={() => setCursorIndex(4)} 
          onClick={goBack} 
          className={`mt-6 font-bold py-2 px-6 rounded-full transition-all uppercase 
            ${cursorIndex === 4 ? 'bg-gray-200 text-red-600 ring-4 ring-yellow-400 scale-105' : 'text-red-500 underline'}`}
        >
          Wróć do Menu
        </button>
      </div>
    );
  }

  // EKRAN ŁADOWANIA
  if (loading) return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl text-blue-900 font-bold animate-pulse">Przeszukiwanie głębin...</h2>
      <p className="text-sm font-mono text-gray-500 bg-gray-100 p-2 rounded">{debugMessage}</p>
    </div>
  );

  // EKRAN WYGRANEJ
  if (isFinished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 p-8 w-full animate-fadeIn">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Koniec Misji!</h2>
        
        <div className="bg-white/80 p-6 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4 border-2 border-white">
          <p className="text-lg text-gray-500 mb-1">Poziom: <span className="font-bold text-blue-800 uppercase">{selectedLevel === 'baby' ? 'mały odkrywca' : selectedLevel}</span></p>
          <p className="text-xl text-blue-800 mb-2">Wynik: <span className="font-bold text-green-600 text-3xl block">{percent}%</span></p>
          <p className="text-xl text-blue-800">Czas: <span className="font-bold text-orange-500">{timeTaken} s</span></p>
        </div>
        
        <button 
          id="quiz-btn-0"
          onMouseEnter={() => setCursorIndex(0)} 
          onClick={() => onSaveScore(`QUIZ (${selectedLevel === 'baby' ? 'BABY' : selectedLevel?.toUpperCase()})`, `${percent}%`, percent, timeTaken)} 
          className={`w-full max-w-sm font-extrabold py-4 px-8 rounded-full shadow-lg transition-all text-xl uppercase tracking-wider 
            ${cursorIndex === 0 ? 'bg-yellow-400 text-blue-900 ring-4 ring-blue-500 scale-105' : 'bg-yellow-300 text-blue-900'}`}
        >
          Zapisz Wynik
        </button>
        
        <button 
          id="quiz-btn-1"
          onMouseEnter={() => setCursorIndex(1)} 
          onClick={goBack} 
          className={`mt-4 font-bold py-3 px-8 rounded-full transition-all uppercase 
            ${cursorIndex === 1 ? 'bg-gray-200 text-gray-800 ring-4 ring-yellow-400 scale-105' : 'text-gray-500 underline'}`}
        >
          Wróć do Menu
        </button>
      </div>
    );
  }

  // EKRAN PYTAŃ (GRA)
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="flex flex-col items-center w-full relative">
      {debugMessage.includes('❌') && (
        <div className="w-full bg-red-100 text-red-700 border border-red-400 p-2 text-xs mb-4 rounded font-mono">
          {debugMessage}
        </div>
      )}
      
      <div className="flex justify-between w-full mb-4 px-4">
        <span className="text-lg text-cyan-600 font-bold uppercase tracking-wider">Pytanie {currentIndex + 1} / {questions.length}</span>
        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold uppercase border border-blue-200 shadow-sm">
          Poziom: {selectedLevel === 'baby' ? 'mały odkrywca' : selectedLevel}
        </span>
      </div>
      
      <p className="text-2xl text-blue-900 font-bold mb-8 text-center min-h-[80px] flex items-center justify-center bg-white/80 backdrop-blur-sm w-full rounded-2xl shadow-sm p-4 border border-white">
        {currentQ.q}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8 relative">
        {isRevealing && <div className="absolute inset-0 z-20"></div>}
        
        {currentQ.a.map((answer, index) => (
          <button 
            id={`quiz-btn-${index}`}
            key={index} 
            onMouseEnter={() => !isRevealing && setCursorIndex(index)} 
            onClick={() => handleAnswer(index)} 
            className={getButtonClass(index)}
          >
            {answer}
          </button>
        ))}
      </div>
      
      <button 
        id="quiz-btn-4"
        onMouseEnter={() => !isRevealing && setCursorIndex(4)} 
        onClick={goBack} 
        className={`font-bold py-2 px-6 rounded-full transition-all uppercase 
          ${cursorIndex === 4 && !isRevealing ? 'bg-gray-200 text-red-600 ring-4 ring-yellow-400 scale-105' : 'text-red-400 underline'}`}
      >
        Przerwij Quiz
      </button>
    </div>
  );
}