import { useState, useEffect } from 'react';

// Typujemy nasze dane
type Question = {
  q: string;
  a: string[];
  c: number;
  level: string;
};

const numOfQuestions = 10; // Ilość pytań na jedną grę

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
  
  // Stany do obsługi neonowego cooldownu
  const [isRevealing, setIsRevealing] = useState(false);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);

  const [startTime, setStartTime] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  useEffect(() => {
    if (!selectedLevel) return;

    setLoading(true);
    setDebugMessage('Szukam pliku w folderze public (./quiz.txt)...');

    // Używamy ścieżki z kropką (./) dla poprawności w Electronie!
    fetch('./quiz.txt?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error(`Błąd serwera: ${res.status}. Pliku nie ma w folderze głównym!`);
        return res.text();
      })
      .then(text => {
        setDebugMessage('Plik wczytany! Analizuję treść...');
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
        
        if (pool.length === 0) {
          setDebugMessage(`Plik jest, ale brak pytań dla poziomu: ${selectedLevel}. Używam awaryjnych.`);
          pool = fallbackQuestions.filter(q => q.level === selectedLevel);
        }
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
    // Blokujemy możliwość klikania innych odpowiedzi w trakcie pauzy
    if (isRevealing) return;

    // Zapisujemy, co kliknął gracz i włączamy tryb ujawniania
    setSelectedAnswerIdx(index);
    setIsRevealing(true);

    const isCorrect = index === questions[currentIndex].c;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Ustawiamy timer na 4 sekundy (4000 ms), zanim przejdziemy dalej
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
        setIsFinished(true);
      }
      
      // Resetujemy stany przed nowym pytaniem
      setIsRevealing(false);
      setSelectedAnswerIdx(null);
    }, 4000);
  };

  const getButtonClass = (index: number) => {
    const baseClass = "font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform border-2 ";
    const currentQ = questions[currentIndex];
    
    // Zwykły styl przed sprawdzeniem
    if (!isRevealing) {
      return baseClass + "bg-cyan-50 hover:bg-cyan-500 hover:text-white text-blue-900 border-cyan-400 hover:scale-105 shadow-sm";
    }

    // Tryb sprawdzania odpowiedzi (COOLDOWN)
    const isCorrectAnswer = index === currentQ.c;
    const isSelectedAnswer = index === selectedAnswerIdx;

    if (isCorrectAnswer) {
      // PRAWIDŁOWA ODPOWIEDŹ -> ZIELONY NEON
      return baseClass + "bg-green-500 text-white border-green-300 shadow-[0_0_20px_#4ade80,inset_0_0_10px_#4ade80] scale-105 z-10";
    }
    
    if (isSelectedAnswer && !isCorrectAnswer) {
      // BŁĘDNA ODPOWIEDŹ ZAZNACZONA PRZEZ GRACZA -> CZERWONY NEON
      return baseClass + "bg-red-600 text-white border-red-400 shadow-[0_0_20px_#f87171,inset_0_0_10px_#f87171] scale-95";
    }

    // RESZTA ODPOWIEDZI (WYGASZENIE)
    return baseClass + "bg-gray-100 text-gray-400 border-gray-200 opacity-20 scale-90 pointer-events-none";
  };

  if (!selectedLevel) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Wybierz poziom trudności</h2>
        <button onClick={() => setSelectedLevel('baby')} className="bg-cyan-400 hover:bg-cyan-300 text-white font-bold py-3 px-8 rounded-full w-72 shadow-md transition transform hover:scale-105">👶 Mały Odkrywca (B. Łatwy)</button>
        <button onClick={() => setSelectedLevel('easy')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full w-72 shadow-md transition transform hover:scale-105">🏖️ Plażowicz (Łatwy)</button>
        <button onClick={() => setSelectedLevel('medium')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full w-72 shadow-md transition transform hover:scale-105">⚓ Wilk Morski (Średni)</button>
        <button onClick={() => setSelectedLevel('hard')} className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full w-72 shadow-md transition transform hover:scale-105">🌐 Modelarz (Trudny)</button>
        <button onClick={goBack} className="mt-6 text-red-500 hover:text-red-400 font-bold underline">Wróć do Menu</button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl text-blue-900 font-bold animate-pulse">Przeszukiwanie głębin... 🌊</h2>
      <p className="text-sm font-mono text-gray-500 bg-gray-100 p-2 rounded">{debugMessage}</p>
    </div>
  );

  if (isFinished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 p-8 w-full">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Koniec Misji! 🎉</h2>
        <div className="bg-white/80 p-6 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4 border-2 border-white">
          <p className="text-lg text-gray-500 mb-1">Poziom: <span className="font-bold text-blue-800 uppercase">{selectedLevel === 'baby' ? 'mały odkrywca' : selectedLevel}</span></p>
          <p className="text-xl text-blue-800 mb-2">Wynik: <span className="font-bold text-green-600 text-3xl block">{percent}%</span></p>
          <p className="text-xl text-blue-800">Czas: <span className="font-bold text-orange-500">{timeTaken} s</span></p>
        </div>
        <button 
          onClick={() => onSaveScore(`QUIZ (${selectedLevel === 'baby' ? 'BABY' : selectedLevel?.toUpperCase()})`, `${percent}%`, percent, timeTaken)} 
          className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl"
        >
          Zapisz Wynik
        </button>
        <button onClick={goBack} className="mt-4 text-gray-500 hover:text-gray-700 font-bold underline">
          Wróć do Menu
        </button>
      </div>
    );
  }

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
        <span className="text-lg text-cyan-600 font-bold uppercase tracking-wider">
          Pytanie {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold uppercase border border-blue-200 shadow-sm">
          Poziom: {selectedLevel === 'baby' ? 'mały odkrywca' : selectedLevel}
        </span>
      </div>
      
      <p className="text-2xl text-blue-900 font-bold mb-8 text-center min-h-[80px] flex items-center justify-center bg-white/80 backdrop-blur-sm w-full rounded-2xl shadow-sm p-4 border border-white">
        {currentQ.q}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8 relative">
        {/* Przezroczysta nakładka blokująca podwójne kliknięcie */}
        {isRevealing && <div className="absolute inset-0 z-20"></div>}
        
        {currentQ.a.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={getButtonClass(index)}
          >
            {answer}
          </button>
        ))}
      </div>
      
      <button onClick={goBack} className="text-red-400 hover:text-red-600 font-bold underline transition-colors">
        Przerwij Quiz
      </button>
    </div>
  );
}