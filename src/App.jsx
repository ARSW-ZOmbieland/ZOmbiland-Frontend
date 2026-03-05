import { useState, useEffect } from 'react';
import Login from './Login';
import GameRoom from './GameRoom';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated upon load
    fetch('http://localhost:8080/api/auth/user', {
      credentials: 'include' // Important for sending JSESSIONID cookie
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>Cargando...</div>;
  }

  if (user) {
    return (
      <div style={{ position: 'relative' }}>
        {/* User overlay widget */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          padding: '10px 20px',
          borderRadius: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          color: 'white',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <img src={user.imageUrl} alt="Profile" style={{ borderRadius: '50%', width: '40px', height: '40px', objectFit: 'cover' }} />
          <span style={{ fontWeight: 'bold' }}>{user.name}</span>
          <button
            onClick={() => {
              fetch('http://localhost:8080/logout', { method: 'POST', credentials: 'include' })
                .then(() => window.location.reload());
            }}
            style={{
              background: '#ff4d4d',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
            Salir
          </button>
        </div>

        {/* Main Interface */}
        <GameRoom />
      </div>
    );
  }

  return <Login />;
}

export default App;
