import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import GameRoom from './pages/Game/GameRoom';
import BunkerRoom from './features/game/components/BunkerRoom';
import WorldMap from './features/game/components/WorldMap';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, BUNKER_START, WORLD_MAP, BUNKER_END
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleTeleport = () => {
    setGameState('WORLD_MAP');
  };

  const handleWorldExit = () => {
    setGameState('BUNKER_END');
  };

  const handleStartGame = (character) => {
    setSelectedCharacter(character);
    setGameState('BUNKER_START');
  };

  const handleRestart = () => {
    setGameState('LOBBY');
  };

  useEffect(() => {
    // Check if user is authenticated upon load
    fetch('http://localhost:8080/api/auth/user', {
      credentials: 'include'
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#05050A', color: 'white' }}>
        <h2 className="title-glow">Cargando...</h2>
      </div>
    );
  }

  // Support for different user object structures
  const userName = user?.displayName || user?.name || 'Sobreviviente';
  const userPhoto = user?.photoURL || user?.imageUrl || '/assets/props/police/police_radio.png';

  if (user) {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
        {/* User overlay widget */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
          background: 'rgba(0,0,0,0.8)',
          padding: '10px 20px',
          borderRadius: '12px',
          border: '1px solid #32CD32',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <img src={userPhoto} alt={userName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ color: 'white', fontSize: '0.9rem' }}>
            <strong>{userName}</strong>
            {selectedCharacter && <div style={{ color: '#32CD32', fontSize: '0.8rem' }}>Superviviente: {selectedCharacter}</div>}
          </div>
          <button
            onClick={() => {
              fetch('http://localhost:8080/logout', { method: 'POST', credentials: 'include' })
                .then(() => window.location.reload());
            }}
            style={{
              background: '#8B0000',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
            Salir
          </button>
        </div>

        {/* Game Flow Integration */}
        {gameState === 'LOBBY' && (
          <GameRoom onConfirm={handleStartGame} />
        )}

        {gameState === 'BUNKER_START' && (
          <BunkerRoom onTeleport={handleTeleport} character={selectedCharacter} />
        )}

        {gameState === 'WORLD_MAP' && (
          <WorldMap onExit={handleWorldExit} character={selectedCharacter} />
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
