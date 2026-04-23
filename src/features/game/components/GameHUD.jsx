import React from 'react';
import './GameHUD.css';

const GameHUD = ({ character, health, roomCode }) => {
  const isHealthy = health > 60;
  const isWarning = health <= 60 && health > 30;
  const isDanger = health <= 30;

  const getHealthColor = () => {
    if (isHealthy) return '#32CD32'; // LimeGreen
    if (isWarning) return '#FFD700'; // Gold
    return '#FF0000'; // Red
  };

  return (
    <div className="game-hud">
      <div className="hud-left">
        <div className="player-avatar-container">
          <img 
            src={`/personajes/${character}/no-seleccion.png`} 
            alt="avatar" 
            className="player-avatar" 
          />
        </div>
        <div className="player-stats">
          <span className="player-name">{character.toUpperCase()}</span>
          <div className="main-health-container">
            <div className="health-label">HP: {health}%</div>
            <div className="health-track">
              <div 
                className={`health-fill ${isDanger ? 'pulse-danger' : ''}`} 
                style={{ width: `${health}%`, backgroundColor: getHealthColor() }}
              >
                <div className="health-inner-highlight"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hud-right">
        <div className="room-info">
          <span className="room-label">SALA:</span>
          <span className="room-id">{roomCode}</span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
