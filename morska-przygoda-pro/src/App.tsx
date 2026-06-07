import { useState, useEffect } from 'react'
import Quiz from './components/quiz'
import Puzzle from './components/puzzle'
import Wiry from './components/wiry'

type Screen = 'menu' | 'wiry' | 'puzzle' | 'quiz' | 'scoreboard' | 'name-entry';

type PendingScore = { 
  gameName: string; 
  scoreText: string; 
  numericScore: number; 
  timeValue: number | null; 
  rank: number; // Dodajemy pole rankingu
};
type SavedScore = { name: string; scoreText: string; num: number; time: number | null; };

const electronWindow = window as Window & {
  process?: { type?: string };
  require?: (module: string) => any;
};
const isElectron = typeof window !== 'undefined' && !!electronWindow.process?.type;
const ipcRenderer = isElectron ? electronWindow.require?.('electron')?.ipcRenderer : null;

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const [initials, setInitials] = useState('');
  const [scores, setScores] = useState<Record<string, SavedScore[]>>({});

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.on('open-admin-menu', () => setIsAdminMenuOpen(true));
      return () => { ipcRenderer.removeAllListeners('open-admin-menu'); };
    }
  }, []);

  useEffect(() => {
    const loaded = localStorage.getItem('morskieScoresPro');
    if (loaded) setScores(JSON.parse(loaded));
  }, []);

  // OBLICZANIE MIEJSCA W RANKINGU
  const calculateRank = (gameName: string, num: number, time: number | null) => {
    const gameScores = scores[gameName] || [];
    // Tworzymy tymczasową listę z nowym wynikiem
    const tempScores = [...gameScores, { name: 'TEMP', scoreText: '', num, time }];
    
    // Sortujemy identycznie jak w submitScore
    if (gameName.includes('QUIZ')) {
      tempScores.sort((a,b) => b.num !== a.num ? b.num - a.num : (a.time || 0) - (b.time || 0));
    } else if (gameName.includes('PUZZLE')) {
      tempScores.sort((a,b) => (a.time || 0) !== (b.time || 0) ? (a.time || 0) - (b.time || 0) : a.num - b.num);
    } else {
      tempScores.sort((a,b) => a.num - b.num);
    }

    // Znajdujemy indeks naszego tymczasowego wyniku
    return tempScores.findIndex(s => s.name === 'TEMP') + 1;
  };

  const handleSaveScoreRequest = (gameName: string, scoreText: string, numericScore: number, timeValue: number | null) => {
    const rank = calculateRank(gameName, numericScore, timeValue);
    setPendingScore({ gameName, scoreText, numericScore, timeValue, rank });
    setInitials('');
    setCurrentScreen('name-entry');
  };

  const submitScore = () => {
    if (!pendingScore) return;
    const name = initials.trim().toUpperCase() || 'AAA';
    const newScores = { ...scores };
    if (!newScores[pendingScore.gameName]) newScores[pendingScore.gameName] = [];
    
    newScores[pendingScore.gameName].push({
      name, scoreText: pendingScore.scoreText, num: pendingScore.numericScore, time: pendingScore.timeValue
    });

    // Sortowanie
    if (pendingScore.gameName.includes('QUIZ')) {
       newScores[pendingScore.gameName].sort((a,b) => b.num !== a.num ? b.num - a.num : (a.time || 0) - (b.time || 0));
    } else if (pendingScore.gameName.includes('PUZZLE')) {
       newScores[pendingScore.gameName].sort((a,b) => (a.time || 0) !== (b.time || 0) ? (a.time || 0) - (b.time || 0) : a.num - b.num);
    } else {
       newScores[pendingScore.gameName].sort((a,b) => a.num - b.num);
    }
    //ranking
    setScores(newScores);
    localStorage.setItem('morskieScoresPro', JSON.stringify(newScores));
    
    setPendingScore(null);
    setCurrentScreen('scoreboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <div className="flex flex-col items-center gap-4 no-scrollbar">
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
          <div className="bg-black p-12 rounded-3xl border-8 border-green-500 text-center font-mono shadow-[0_0_50px_rgba(34,197,94,0.3)] no-scrollbar">
            <h2 className="text-4xl text-green-400 font-bold mb-4 uppercase">Twoje Miejsce: {pendingScore?.rank}</h2>
            <h3 className="text-2xl text-yellow-400 mb-12">{pendingScore?.gameName} - {pendingScore?.scoreText}</h3>
            <p className="text-xl text-green-500 mb-6 uppercase tracking-widest">Wpisz Inicjały:</p>
            <input 
              type="text" 
              maxLength={3} 
              value={initials}
              onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              autoFocus
              className="bg-transparent border-b-4 border-green-500 text-green-400 text-center text-6xl w-48 mb-12 outline-none focus:border-green-300 tracking-[0.3em] uppercase"
            />
            <br />
            <button onClick={submitScore} className="bg-transparent border-4 border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold py-3 px-12 text-2xl uppercase transition">
              ZAPISZ
            </button>
          </div>
        );

      case 'scoreboard':
        return (
          <div className="bg-black p-8 rounded-3xl border-8 border-purple-600 font-mono shadow-[0_0_50px_rgba(147,51,234,0.3)] text-left w-full max-w-2xl max-h-[80vh] overflow-y-auto no-scrollbar">
            <h2 className="text-4xl text-fuchsia-500 font-bold mb-8 text-center border-b-4 border-dashed border-fuchsia-800 pb-4">=== TOP 5 ODDKRYWCÓW ===</h2>
            
            {Object.keys(scores).length === 0 ? (
              <p className="text-green-400 text-center text-xl animate-pulse">BRAK DANYCH... ZAGRAJ!</p>
            ) : (
              Object.keys(scores).sort().map(game => (
                <div key={game} className="mb-8">
                  <h3 className="text-2xl text-yellow-400 mb-4 bg-gray-900 inline-block px-4 py-1 border border-yellow-600 rounded">{'>'} {game} &lt;</h3>
                  <table className="w-full text-green-400 text-lg">
                    <thead>
                      <tr className="border-b-2 border-green-800 text-left text-cyan-400">
                        <th className="pb-2">MIEJSCE</th><th className="pb-2">IMIĘ</th><th className="pb-2">WYNIK</th><th className="pb-2">CZAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* WYŚWIETLAMY TYLKO TOP 5 DLA KAŻDEJ GRY */}
                      {scores[game].slice(0, 5).map((s, idx) => (
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
              <button onClick={() => setCurrentScreen('menu')} className="bg-transparent border-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold py-3 px-8 text-xl uppercase transition">
                POWRÓT
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans overflow-hidden">
      {isAdminMenuOpen && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-gray-900 border-4 border-red-600 p-12 rounded-3xl text-center max-w-md shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <h2 className="text-4xl text-red-500 font-black mb-8 tracking-tighter uppercase">Tryb Administratora</h2>
            <div className="flex flex-col gap-4">
              <button onClick={() => { if(isElectron) window.close(); }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl text-xl transition-all uppercase">Wyłącz Aplikację</button>
              <button onClick={() => { if(isElectron) ipcRenderer.send('toggle-fullscreen'); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-xl transition-all uppercase">Zwiń / Rozwiń Ekran</button>
              <button onClick={() => setIsAdminMenuOpen(false)} className="bg-transparent border-2 border-gray-600 text-gray-400 hover:text-white hover:border-white py-3 rounded-xl transition-all">Wróć do gry</button>
            </div>
          </div>
        </div>
      )} 

      <div className="ocean">
        <div className="wave"></div><div className="wave"></div><div className="wave"></div>
      </div>

      <div className={`w-full max-w-4xl flex justify-center relative z-10 transition-all duration-500 ${
          currentScreen === 'name-entry' || currentScreen === 'scoreboard' ? '' : 'bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center'
        }`}
      >
        {renderScreen()}
      </div>
    </div>
  )
}

export default App