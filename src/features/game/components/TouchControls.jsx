import React, { useState, useEffect, useRef } from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  const [activeMove, setActiveMove] = useState(null);
  const moveInterval = useRef(null);

  // Lógica de movimiento continuo
  useEffect(() => {
    if (activeMove) {
      // Primer movimiento inmediato
      onMove(activeMove);
      
      // Intervalo para repetición (ajustado al cooldown del hook)
      moveInterval.current = setInterval(() => {
        onMove(activeMove);
      }, 210); 
    } else {
      if (moveInterval.current) clearInterval(moveInterval.current);
    }
    
    return () => {
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, [activeMove, onMove]);

  const handlePointerDown = (e, action, type) => {
    e.preventDefault();
    if (type === 'move') {
      setActiveMove(action);
    } else if (type === 'shoot') {
      action();
    }
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    setActiveMove(null);
  };

  const handleShootDirection = (dx, dy) => {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (onShoot) onShoot(angle);
  };

  const handleCenterShoot = () => {
    if (onShoot) onShoot(window.currentAimAngle || 0);
  };

  return (
    <div className="touch-controls-container">
      {/* PANEL DE MOVIMIENTO (IZQUIERDA) */}
      <div className="control-group move-group">
        <div className="d-pad">
          <button 
            className={`d-btn up ${activeMove === 'arriba' ? 'active' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, 'arriba', 'move')}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >▲</button>
          <div className="d-pad-horizontal">
            <button 
              className={`d-btn left ${activeMove === 'izquierda' ? 'active' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, 'izquierda', 'move')}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >◀</button>
            <div className="d-pad-center"></div>
            <button 
              className={`d-btn right ${activeMove === 'derecha' ? 'active' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, 'derecha', 'move')}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >▶</button>
          </div>
          <button 
            className={`d-btn down ${activeMove === 'abajo' ? 'active' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, 'abajo', 'move')}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >▼</button>
        </div>
        <span className="control-label">Mover</span>
      </div>
      
      {/* PANEL DE DISPARO (DERECHA) */}
      <div className="control-group shoot-group">
        <div className="shoot-grid">
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(-1, -1), 'shoot')}>◤</button>
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(0, -1), 'shoot')}>▲</button>
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(1, -1), 'shoot')}>◥</button>
          
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(-1, 0), 'shoot')}>◀</button>
          <button className="s-btn center-fire" onPointerDown={(e) => handlePointerDown(e, handleCenterShoot, 'shoot')}>🔥</button>
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(1, 0), 'shoot')}>▶</button>
          
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(-1, 1), 'shoot')}>◣</button>
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(0, 1), 'shoot')}>▼</button>
          <button className="s-btn" onPointerDown={(e) => handlePointerDown(e, () => handleShootDirection(1, 1), 'shoot')}>◢</button>
        </div>
        <span className="control-label">Disparar</span>
      </div>
    </div>
  );
};

export default TouchControls;
