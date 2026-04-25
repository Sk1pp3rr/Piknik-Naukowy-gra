import { useState, useEffect } from 'react';

type Question = {
  q: string;
  a: string[];
  c: number;
  level: string;
};

// Pula awaryjna (gdyby jednak plik nie zadziałał)
const fallbackQuestions: Question[] = [
  { level: "baby", q: "Co pływa po wodzie? (Awaryjne)", a: ["Statek", "Samolot", "Samochód", "Rower"], c: 0 },
  { level: "easy", q: "Fale morskie powstają głównie na skutek: (Awaryjne)", a: ["pływów", "wiatru", "prądów", "opadów"], c: 1 },
  { level: "medium", q: "Co to jest cofka? (Awaryjne)", a: ["gwałtowny odpływ wody", "podniesienie poziomu przy brzegu", "spadek ciśnienia", "prąd"], c: 1 },
  { level: "hard", q: "Pływaki Argo w ciężkich warunkach: (Awaryjne)", a: ["nie działają", "pływają i rejestrują dane", "toną", "zmieniają kierunek wiatru"], c: 1 }
];

export default function Quiz({ goBack }: { goBack: () => void }) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>(''); // Nowy stan do pokazywania błędów na ekranie!
  
  const [startTime, setStartTime] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  useEffect(() => {
    if (!selectedLevel) return;

    setLoading(true);
    setDebugMessage('Próbuję pobrać /quiz.txt...');
    console.log(`🕵️‍♂️ Szukam pytań dla poziomu: ${selectedLevel}`);

    // Fetchujemy plik. "/quiz.txt" oznacza, że Vite szuka go w folderze "public"
    fetch('/quiz.txt?t=' + Date.now())
      .then(res => {
        if (!res.ok) {
          throw new Error(`Serwer zwrócił błąd ${res.status}. Czy na pewno plik jest w folderze public?`);
        }
        return res.text();
      })
      .then(text => {
        setDebugMessage('Plik pobrany! Analizuję treść...');
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const loaded: Question[] = [];

        lines.forEach((line, index) => {
          const parts = line.split('|');
          if (parts.length >= 4) {
            loaded.push({
              q: parts[0].trim(),
              a: parts[1].split(',').map(ans => ans.trim()),
              c: parseInt(parts[2].trim()),
              level: parts[3].trim().replace(/\r/g, '').toLowerCase()
            });
          } else {
            console.warn(`Pomijam uszkodzoną linijkę nr ${index + 1}: ${line}`);
          }
        });

        console.log(`Z pliku wczytano łącznie pytań: ${loaded.length}`);

        // Filtrujemy
        let pool = loaded.filter(q => q.level === selectedLevel);
        
        if (pool.length === 0) {
          setDebugMessage(`Plik wczytany, ale brak w nim pytań dla poziomu: ${selectedLevel}! Używam awaryjnych.`);
          console.warn(`Brak pytań dla ${selectedLevel}. Plik ma tylko poziomy:`, [...new Set(loaded.map(l => l.level))]);
          pool = fallbackQuestions.filter(q => q.level === selectedLevel);
        }

        if (pool.length === 0) pool = fallbackQuestions; // Ostateczne zabezpieczenie

        setQuestions(pool.sort(() => 0.5 - Math.random()).slice(0, 5));
        setStartTime(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        // Jeśli fetch "wybuchnie" (brak pliku, zła nazwa)
        console.error("BŁĄD ODCZYTU PLIKU:", err);
        setDebugMessage(`Błąd: ${err.message}. Ładuję pulę awaryjną.`);
        
        let pool = fallbackQuestions.filter(q => q.level === selectedLevel);
        if (pool.length === 0) pool = fallbackQuestions;
        
        setQuestions(pool.sort(() => 0.5 - Math.random()).slice(0, 5));
        setStartTime(Date.now());
        
        setTimeout(() => setLoading(false), 3000); 
      });
  }, [selectedLevel]);

  const handleAnswer = (index: number) => {
    if (index === questions[currentIndex].c) {
      setScore(prev => prev + 1);
    }
    
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
      setIsFinished(true);
    }
  };

  // EKRAN: WYBÓR POZIOMU
  if (!selectedLevel) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Wybierz poziom trudności</h2>
        <button onClick={() => setSelectedLevel('baby')} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-8 rounded-full w-64 shadow-md transition transform hover:scale-105">👶 Mały Odkrywca</button>
        <button onClick={() => setSelectedLevel('easy')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full w-64 shadow-md transition transform hover:scale-105">🏖️ Plażowicz</button>
        <button onClick={() => setSelectedLevel('medium')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full w-64 shadow-md transition transform hover:scale-105">⚓ Wilk Morski</button>
        <button onClick={() => setSelectedLevel('hard')} className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full w-64 shadow-md transition transform hover:scale-105">🌐 Modelarz</button>
        <button onClick={goBack} className="mt-6 text-red-500 hover:text-red-400 font-bold underline">Wróć do Menu</button>
      </div>
    );
  }

  // EKRAN: ŁADOWANIE Z DIAGNOSTYKĄ
  if (loading) return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl text-blue-900 font-bold animate-pulse">Przeszukiwanie głębin...</h2>
      <p className="text-sm font-mono text-gray-500 bg-gray-100 p-2 rounded">{debugMessage}</p>
    </div>
  );

  // EKRAN: KONIEC
  if (isFinished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 bg-blue-50 p-8 rounded-3xl border-4 border-blue-200">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Koniec Misji!</h2>
        <div className="bg-white p-6 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4">
          <p className="text-lg text-gray-500 mb-1">Poziom: <span className="font-bold text-blue-800 uppercase">{selectedLevel}</span></p>
          <p className="text-xl text-blue-800 mb-2">Wynik: <span className="font-bold text-green-600 text-3xl block">{percent}%</span></p>
          <p className="text-xl text-blue-800">Czas: <span className="font-bold text-orange-500">{timeTaken} sekund</span></p>
        </div>
        <button className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl">
          Zapisz Wynik
        </button>
        <button onClick={goBack} className="mt-4 text-gray-500 hover:text-gray-700 font-bold underline">
          Zakończ bez zapisu
        </button>
      </div>
    );
  }

  // EKRAN: QUIZ
  const currentQ = questions[currentIndex];

  // ZABEZPIECZENIE: Jeśli pytania jeszcze się ładują/nie istnieją, poczekaj!
  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl text-blue-900 font-bold animate-pulse">Przygotowuję pytania...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {debugMessage.includes('Błąd') && (
        <div className="w-full bg-red-100 text-red-700 border border-red-400 p-2 text-xs mb-4 rounded font-mono">
          INFO: {debugMessage}
        </div>
      )}
      <div className="flex justify-between w-full mb-2 px-4">
        <span className="text-lg text-cyan-600 font-bold uppercase tracking-wider">
          Pytanie {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold uppercase">
          Poziom: {selectedLevel}
        </span>
      </div>
      <p className="text-2xl text-blue-900 font-bold mb-8 text-center min-h-[80px] flex items-center justify-center bg-white w-full rounded-2xl shadow-sm p-4 border-2 border-blue-100">
        {currentQ.q}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        {currentQ.a.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className="bg-cyan-50 hover:bg-cyan-500 hover:text-white text-blue-900 border-2 border-cyan-400 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm"
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