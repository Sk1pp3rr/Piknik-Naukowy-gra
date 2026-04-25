import { useState, useEffect } from 'react'
import Quiz from './components/quiz'
import Puzzle from './components/puzzle'
import Wiry from './components/wiry'

type Screen = 'menu' | 'wiry' | 'puzzle' | 'quiz' | 'scoreboard' | 'name-entry';

// Definiujemy jak wygląda wynik
type PendingScore = { gameName: string; scoreText: string; numericScore: number; timeValue: number | null; };
type SavedScore = { name: string; scoreText: string; num: number; time: number | null; };

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  
  // Stany dla wyników
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const [initials, setInitials] = useState('');
  const [scores, setScores] = useState<Record<string, SavedScore[]>>({});

  // Wczytywanie wyników z pamięci przeglądarki (localStorage) przy starcie
  useEffect(() => {
    const loaded = localStorage.getItem('morskieScoresPro');
    if (loaded) setScores(JSON.parse(loaded));
  }, []);

  // Funkcja, którą przekażemy do gier. Odpala ekran wpisywania imienia.
  const handleSaveScoreRequest = (gameName: string, scoreText: string, numericScore: number, timeValue: number | null) => {
    setPendingScore({ gameName, scoreText, numericScore, timeValue });
    setInitials('');
    setCurrentScreen('name-entry');
  };

  // Zapis do tabeli
  const submitScore = () => {
    if (!pendingScore) return;
    const name = initials.trim().toUpperCase() || 'AAA';
    
    const newScores = { ...scores };
    if (!newScores[pendingScore.gameName]) newScores[pendingScore.gameName] = [];
    
    newScores[pendingScore.gameName].push({
      name, scoreText: pendingScore.scoreText, num: pendingScore.numericScore, time: pendingScore.timeValue
    });

    // Inteligentne sortowanie!
    if (pendingScore.gameName.includes('QUIZ')) {
       // Quiz: Najpierw %, potem krótki czas
       newScores[pendingScore.gameName].sort((a,b) => b.num !== a.num ? b.num - a.num : (a.time || 0) - (b.time || 0));
    } else if (pendingScore.gameName.includes('PUZZLE')) {
       // Puzzle: Najpierw krótki czas, potem mało ruchów
       newScores[pendingScore.gameName].sort((a,b) => (a.time || 0) !== (b.time || 0) ? (a.time || 0) - (b.time || 0) : a.num - b.num);
    } else {
       // Wiry: Krótka trasa = lepiej
       newScores[pendingScore.gameName].sort((a,b) => a.num - b.num);
    }

    // Zostawiamy tylko TOP 5
    newScores[pendingScore.gameName] = newScores[pendingScore.gameName].slice(0, 5);
    
    setScores(newScores);
    localStorage.setItem('morskieScoresPro', JSON.stringify(newScores)); // Zapis na "dysk" przeglądarki
    
    setPendingScore(null);
    setCurrentScreen('scoreboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-bold text-blue-900 border-b-4 border-dashed border-cyan-400 pb-4 mb-4 uppercase drop-shadow-md">
              Bałtycka Akademia Odkrywców
            </h1>
            <p className="text-xl text-blue-800 mb-6 font-medium">Wybierz przygodę, aby rozpocząć naukową misję!</p>
            <button onClick={() => setCurrentScreen('wiry')} className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64">🌀 Wypuść Pływak</button>
            <button onClick={() => setCurrentScreen('puzzle')} className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64">🧩 Morskie Puzzle</button>
            <button onClick={() => setCurrentScreen('quiz')} className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64">❓ Quiz Oceaniczny</button>
            <button onClick={() => setCurrentScreen('scoreboard')} className="mt-8 bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl">🏆 HALL OF FAME 🏆</button>
            <h2 className="text-sm text-gray-600 mt-12 italic">
              Pracownia Modelowania Procesów Fizycznych w Morzu i Atmosferze, Zakład Dynamiki Morza IOPAN
            </h2>
          </div>
        );

      case 'wiry':
        return <Wiry goBack={() => setCurrentScreen('menu')} onSaveScore={handleSaveScoreRequest} />;
      case 'puzzle':
        return <Puzzle goBack={() => setCurrentScreen('menu')} onSaveScore={handleSaveScoreRequest} />;
      case 'quiz':
        return <Quiz goBack={() => setCurrentScreen('menu')} onSaveScore={handleSaveScoreRequest} />;
      
      case 'name-entry':
        return (
          <div className="bg-black p-12 rounded-3xl border-8 border-green-500 text-center font-mono shadow-[0_0_50px_rgba(34,197,94,0.3)]">
            <h2 className="text-4xl text-green-400 font-bold mb-4 animate-pulse">NEW HIGH SCORE!</h2>
            <h3 className="text-2xl text-yellow-400 mb-12">{pendingScore?.gameName} - {pendingScore?.scoreText}</h3>
            <p className="text-xl text-green-500 mb-6 uppercase tracking-widest">Enter Your Initials:</p>
            <input 
              type="text" 
              maxLength={3} 
              value={initials}
              onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              autoFocus
              className="bg-transparent border-b-4 border-green-500 text-green-400 text-center text-6xl w-48 mb-12 outline-none focus:border-green-300 tracking-[0.3em] uppercase"
            />
            <br />
            <button onClick={submitScore} className="bg-transparent border-4 border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold py-3 px-12 text-2xl uppercase transition shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              SAVE
            </button>
          </div>
        );

      case 'scoreboard':
        return (
          <div className="bg-black p-8 rounded-3xl border-8 border-purple-600 font-mono shadow-[0_0_50px_rgba(147,51,234,0.3)] text-left w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-4xl text-fuchsia-500 font-bold mb-8 text-center border-b-4 border-dashed border-fuchsia-800 pb-4">=== HALL OF FAME ===</h2>
            
            {Object.keys(scores).length === 0 ? (
              <p className="text-green-400 text-center text-xl animate-pulse">NO DATA... PLAY A GAME!</p>
            ) : (
              Object.keys(scores).sort().map(game => (
                <div key={game} className="mb-8">
                  <h3 className="text-2xl text-yellow-400 mb-4 bg-gray-900 inline-block px-4 py-1 border border-yellow-600 rounded">{'>'} {game} &lt;</h3>
                  <table className="w-full text-green-400 text-lg">
                    <thead>
                      <tr className="border-b-2 border-green-800 text-left text-cyan-400">
                        <th className="pb-2">RANK</th><th className="pb-2">NAME</th><th className="pb-2">SCORE</th><th className="pb-2">TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores[game].map((s, idx) => (
                        <tr key={idx} className={`border-b border-gray-800 ${idx === 0 ? 'text-yellow-300 font-bold' : ''}`}>
                          <td className="py-2">#{idx + 1}</td>
                          <td className="py-2 tracking-widest">{s.name}</td>
                          <td className="py-2">{s.scoreText}</td>
                          <td className="py-2">{s.time ? `${s.time}s` : '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
            
            <div className="text-center mt-12">
              <button onClick={() => setCurrentScreen('menu')} className="bg-transparent border-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold py-3 px-8 text-xl uppercase transition shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                WRÓĆ
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* Kontener z naszymi TRZEMA falami */}
      <div className="ocean">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div className={`w-full max-w-3xl flex justify-center relative z-10 transition-all duration-500 ${
          currentScreen === 'name-entry' || currentScreen === 'scoreboard' 
          ? '' 
          : 'bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center'
        }`}
      >
        {renderScreen()}
      </div>
    </div>
  )
}

export default App