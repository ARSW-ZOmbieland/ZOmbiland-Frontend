import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import GameRoom from './pages/Game/GameRoom';
import BunkerRoom from './features/game/components/BunkerRoom';
import WorldMap from './features/game/components/WorldMap';
import './App.css';
import { API_BASE_URL } from './config/constants';
import ErrorBoundary from './components/ErrorBoundary';
import { useAssetPreload } from './hooks/useAssetPreload';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { progress, isLoaded: assetsLoaded } = useAssetPreload();
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, BUNKER_START, WORLD_MAP, BUNKER_END
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Player Stats for HUD
  const [stats, setStats] = useState({
    health: 100,
    stamina: 100,
    medkits: 1,
    weapons: 1
  });

  const handleTeleport = () => {
    setGameState('WORLD_MAP');
  };

  const handleWorldExit = () => {
    setGameState('BUNKER_END');
  };

  const handleStartGame = (character, code) => {
    setSelectedCharacter(character);
    setRoomCode(code);
    setGameState('BUNKER_START');
  };

  const handleRestart = () => {
    setGameState('LOBBY');
  };

  const handleLogout = () => {
    // Direct redirect to backend logout for clean session handling
    window.location.href = `${API_BASE_URL}/logout`;
  };

  useEffect(() => {
    // Check if user is authenticated upon load
    fetch(`${API_BASE_URL}/api/auth/user`, {
      credentials: 'include'
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        setAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setAuthLoading(false);
      });

    // Global Pause Handler (Esc or Enter)
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        const isCurrentlyPlaying = gameState === 'BUNKER_START' || gameState === 'WORLD_MAP';
        if (isCurrentlyPlaying) {
          setIsPaused(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  if (authLoading || !assetsLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#05050A', color: 'white' }}>
        <h2 className="title-glow">Cargando ZOmbiland...</h2>
        {!assetsLoaded && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#32CD32', fontSize: '1.2rem', marginBottom: '10px' }}>Almacenando Texturas en Caché: {progress}%</p>
            <div style={{ width: '300px', height: '10px', backgroundColor: '#333', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#32CD32', transition: 'width 0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Support for different user object structures
  const userName = user?.displayName || user?.name || 'Sobreviviente';
  const userPhoto = user?.photoURL || user?.imageUrl || '/assets/props/police/police_radio.png';

  if (user) {
    const isPlaying = gameState === 'BUNKER_START' || gameState === 'WORLD_MAP';

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
        {/* User overlay widget */}
        <div className="user-overlay">
          <img src={userPhoto} alt={userName} className="user-photo" />
          <div className="user-info">
            <strong>{userName}</strong>
            {selectedCharacter && <div style={{ color: '#32CD32', fontSize: '0.8rem' }}>Superviviente: {selectedCharacter}</div>}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Salir
          </button>
        </div>

        {/* HUD Layer removed by user request ('ESTE QUITALO') */}

        {/* Game Flow Integration */}
        {gameState === 'LOBBY' && (
          <GameRoom onConfirm={handleStartGame} />
        )}
        
        {/* Pause System Overlay */}
        {isPaused && (
          <div className="pause-overlay-premium">
            <div className="pause-content">
              <h1 className="pause-title">PAUSA</h1>
              <div className="pause-buttons">
                <button className="game-btn btn-resume" onClick={() => setIsPaused(false)}>
                  Reanudar
                </button>
                <button className="game-btn btn-exit" onClick={() => { setIsPaused(false); handleRestart(); }}>
                   Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}

        {(gameState === 'BUNKER_START' && !isPaused) && (
          <ErrorBoundary>
            <BunkerRoom onTeleport={handleTeleport} character={selectedCharacter} roomCode={roomCode} onRestart={handleRestart} isPaused={isPaused} />
          </ErrorBoundary>
        )}

        {(gameState === 'WORLD_MAP' && !isPaused) && (
          <ErrorBoundary>
            <WorldMap onExit={handleWorldExit} character={selectedCharacter} roomCode={roomCode} onRestart={handleRestart} isPaused={isPaused} />
          </ErrorBoundary>
        )}
        
        {/* Renderizado de fondo cuando está pausado para que no parpadee a negro */}
        {isPaused && gameState === 'BUNKER_START' && (
            <BunkerRoom onTeleport={handleTeleport} character={selectedCharacter} roomCode={roomCode} onRestart={handleRestart} isPaused={isPaused} />
        )}
        {isPaused && gameState === 'WORLD_MAP' && (
            <WorldMap onExit={handleWorldExit} character={selectedCharacter} roomCode={roomCode} onRestart={handleRestart} isPaused={isPaused} />
        )}

        {gameState === 'BUNKER_END' && (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#000',
            color: 'white',
            textAlign: 'center'
          }}>
            <h1 className="title-glow" style={{ fontSize: '4rem', color: '#32CD32' }}>¡REFUGIO ALCANZADO!</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Has sobrevivido al exterior y llegado al búnker final.</p>
            <button className="game-btn create-btn" onClick={handleRestart}>Volver al Menú</button>
          </div>
        )}
      </div>
    );
  }

  return <Login />;
}

export default App;
