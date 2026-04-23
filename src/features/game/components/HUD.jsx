import React, { useState, useEffect } from 'react';
import './HUD.css';

const HUD = ({ health = 100, stamina = 100, medkits = 2, weapons = 1, roomCode }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-hud">
      {/* Top Center: Room Code */}
      {roomCode && (
        <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', padding: '5px 15px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #32CD32', borderRadius: '8px', color: '#fff', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 10px rgba(50, 205, 50, 0.4)' }}>
          <span style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Código Sala:</span>
          <strong style={{ fontSize: '1.5rem', color: '#32CD32', letterSpacing: '2px' }}>{roomCode}</strong>
        </div>
      )}

      {/* Left Panel: Inventory */}
      <div className="hud-panel left-panel">
        <div className="hud-item inventory-item">
          <div className="icon-wrapper medkit-icon">
            <img src="/assets/props/police/police_radio.png" alt="Medkit" /> {/* Using existing assets as placeholders */}
          </div>
          <div className="counter-stack">
            <span className="label">BOTIQUÍN</span>
            <span className="count">{medkits}</span>
          </div>
        </div>
        <div className="hud-item inventory-item">
          <div className="icon-wrapper weapon-icon">
            <img src="/assets/props/barricades/barricade_military.png" alt="Weapon" />
          </div>
          <div className="counter-stack">
            <span className="label">ARMA</span>
            <span className="count">{weapons}</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Status & Timer */}
      <div className="hud-panel right-panel">
        <div className="timer-display">
          <span className="time-val">{formatTime(time)}</span>
        </div>
        
        <div className="status-bars">
          <div className="bar-wrapper">
            <div className="bar-label">SALUD</div>
            <div className="bar-container health-bg">
              <div className="bar-fill health-fill" style={{ width: `${health}%` }}></div>
            </div>
          </div>
          
          <div className="bar-wrapper">
            <div className="bar-label">ESTAMINA</div>
            <div className="bar-container stamina-bg">
              <div className="bar-fill stamina-fill" style={{ width: `${stamina}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
