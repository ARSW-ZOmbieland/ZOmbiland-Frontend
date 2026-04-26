import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import GameRoom from './pages/Game/GameRoom';
import BunkerRoom from './features/game/components/BunkerRoom';
import WorldMap from './features/game/components/WorldMap';
import './App.css';
import { API_BASE_URL } from './config/constants';
import ErrorBoundary from './components/ErrorBoundary';
import { useAssetPreload } from './hooks/useAssetPreload';
import webSocketService from './core/WebSocketService';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { progress, isLoaded: assetsLoaded } = useAssetPreload();
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, BUNKER_START, WORLD_MAP, BUNKER_END
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [victoryStats, setVictoryStats] = useState(null);

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

  const handleWorldExit = (kills) => {
    setVictoryStats(kills);
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

  // 1. Check authentication ONLY ONCE on mount
  useEffect(() => {
    setAuthLoading(true);
    fetch(`${API_BASE_URL}/api/auth/user`, {
      credentials: 'include',
      redirect: 'manual' // More graceful than 'error'
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
  }, []); // Empty dependency array = only runs once

  // 2. Global Pause Handler (Esc or Enter) - Runs when gameState or isPaused changes
  useEffect(() => {

    // Global Pause Handler (Esc or Enter)
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        const isCurrentlyPlaying = gameState === 'BUNKER_START' || gameState === 'WORLD_MAP';
        if (isCurrentlyPlaying) {
          const nextPausedState = !isPaused;
          setIsPaused(nextPausedState);
          
          // Enviar sincronización MANUAL (Solo en eventos locales)
          if (roomCode) {
            webSocketService.sendMessage('/app/game.action', {
                playerId: selectedCharacter,
                roomCode: roomCode,
                action: nextPausedState ? 'PAUSE' : 'RESUME'
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, isPaused, roomCode, selectedCharacter]); // Correct dependencies for the key listener

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
        {selectedCharacter && isPlaying && (
          <div className="room-code-badge pop-in">
            REFUGIO: <span>{roomCode}</span>
          </div>
        )}

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
                <button className="game-btn btn-resume" onClick={() => {
                  setIsPaused(false);
                  if (roomCode) {
                    webSocketService.sendMessage('/app/game.action', {
                        playerId: selectedCharacter,
                        roomCode: roomCode,
                        action: 'RESUME'
                    });
                  }
                }}>
                  Reanudar
                </button>
                <button className="game-btn btn-exit" onClick={() => { 
                  setIsPaused(false); 
                  if (roomCode) {
                    webSocketService.sendMessage('/app/game.action', {
                        playerId: selectedCharacter,
                        roomCode: roomCode,
                        action: 'RESUME'
                    });
                  }
                  handleRestart(); 
                }}>
                   Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}

        {(gameState === 'BUNKER_START') && (
          <ErrorBoundary>
            <BunkerRoom 
              onTeleport={handleTeleport} 
              character={selectedCharacter} 
              roomCode={roomCode} 
              onRestart={handleRestart} 
              isPaused={isPaused} 
              onPauseSync={setIsPaused} 
            />
          </ErrorBoundary>
        )}

        {(gameState === 'WORLD_MAP') && (
          <ErrorBoundary>
            <WorldMap 
              onExit={handleWorldExit} 
              character={selectedCharacter} 
              roomCode={roomCode} 
              onRestart={handleRestart} 
              isPaused={isPaused} 
              onPauseSync={setIsPaused} 
            />
          </ErrorBoundary>
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
            textAlign: 'center',
            padding: '20px'
          }}>
            <h1 className="title-glow pop-in" style={{ fontSize: '4rem', color: '#32CD32', marginBottom: '10px' }}>¡REFUGIO ALCANZADO!</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.8 }}>Has sobrevivido al exterior y llegado al búnker final.</p>
            
            {victoryStats && (
                <div className="victory-stats-panel pop-in" style={{ 
                    backgroundColor: 'rgba(50, 205, 50, 0.1)', 
                    padding: '25px', 
                    borderRadius: '20px', 
                    border: '2px solid #32CD32',
                    marginBottom: '40px',
                    minWidth: '320px',
                    boxShadow: '0 0 20px rgba(50, 205, 50, 0.2)'
                }}>
                    <h3 style={{ color: '#32CD32', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '3px', fontSize: '1.4rem' }}>Zombies Eliminados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>Chasqueadores: <span style={{ color: '#fff', fontWeight: 'bold' }}>{victoryStats.chasqueador}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>Lloronas: <span style={{ color: '#fff', fontWeight: 'bold' }}>{victoryStats.llorona}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>Tankes: <span style={{ color: '#fff', fontWeight: 'bold' }}>{victoryStats.tanke}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>Hunters: <span style={{ color: '#fff', fontWeight: 'bold' }}>{victoryStats.hunter}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>Comunes: <span style={{ color: '#fff', fontWeight: 'bold' }}>{victoryStats.comun}</span></div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            marginTop: '15px', 
                            paddingTop: '15px', 
                            borderTop: '2px solid rgba(50, 205, 50, 0.4)', 
                            color: '#32CD32', 
                            fontWeight: 'bold',
                            fontSize: '1.4rem',
                            textShadow: '0 0 10px rgba(50, 205, 50, 0.3)'
                        }}>
                            TOTAL ELIMINADOS: 
                            <span>
                                {victoryStats.chasqueador + victoryStats.llorona + victoryStats.tanke + victoryStats.hunter + victoryStats.comun}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <button className="lobby-restart-btn" onClick={handleRestart}>
                VOLVER AL MENÚ
            </button>
          </div>
        )}
      </div>
    );
  }

  return <Login />;
}

export default App;
