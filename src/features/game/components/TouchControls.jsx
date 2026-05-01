import React, { useState, useEffect, useRef } from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  const [activeMove, setActiveMove] = useState(null);
  const moveInterval = useRef(null);

  // Sincronizar mira al disparar o tocar
  const updateAim = (angle) => {
    if (onAimChange) onAimChange(angle);
    // Guardar en window para el disparo central
    window.currentAimAngle = angle;
  };

  useEffect(() => {
    if (activeMove) {
      console.log(">> MOVING:", activeMove);
      onMove(activeMove);
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

  const handleStart = (e, action, type) => {
    if (type === 'move') {
      // Intentamos preventDefault para evitar scroll, pero si falla no bloqueamos
      try { if (e.cancelable) e.preventDefault(); } catch(err) {}
      setActiveMove(action);
    } else if (type === 'shoot') {
      action();
    }
  };

  const handleEnd = (e) => {
    try { if (e.cancelable) e.preventDefault(); } catch(err) {}
    setActiveMove(null);
  };

  const handleShootDirection = (dx, dy) => {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    updateAim(angle);
    if (onShoot) onShoot(angle);
  };

  const handleCenterShoot = () => {
    const angle = window.currentAimAngle || 0;
    updateAim(angle);
    if (onShoot) onShoot(angle);
  };

  return (
    <div className="touch-controls-container">
      {/* PANEL DE MOVIMIENTO */}
      <div className="control-group move-group">
        <div className="d-pad">
          <button 
            className={`d-btn up ${activeMove === 'arriba' ? 'active' : ''}`}
            onPointerDown={(e) => handleStart(e, 'arriba', 'move')}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            onPointerCancel={handleEnd}
          >▲</button>
          <div className="d-pad-horizontal">
            <button 
              className={`d-btn left ${activeMove === 'izquierda' ? 'active' : ''}`}
              onPointerDown={(e) => handleStart(e, 'izquierda', 'move')}
              onPointerUp={handleEnd}
              onPointerLeave={handleEnd}
              onPointerCancel={handleEnd}
            >◀</button>
            <div className="d-pad-center"></div>
            <button 
              className={`d-btn right ${activeMove === 'derecha' ? 'active' : ''}`}
              onPointerDown={(e) => handleStart(e, 'derecha', 'move')}
              onPointerUp={handleEnd}
              onPointerLeave={handleEnd}
              onPointerCancel={handleEnd}
            >▶</button>
          </div>
          <button 
            className={`d-btn down ${activeMove === 'abajo' ? 'active' : ''}`}
            onPointerDown={(e) => handleStart(e, 'abajo', 'move')}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            onPointerCancel={handleEnd}
          >▼</button>
        </div>
        <span className="control-label">Mover</span>
      </div>
      
      {/* PANEL DE DISPARO */}
      <div className="control-group shoot-group">
        <div className="shoot-grid">
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, -1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(-1, -1); }}
          >◤</button>
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(0, -1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(0, -1); }}
          >▲</button>
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, -1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(1, -1); }}
          >◥</button>
          
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, 0); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(-1, 0); }}
          >◀</button>
          <button className="s-btn center-fire" 
            onTouchStart={(e) => { e.preventDefault(); handleCenterShoot(); }}
            onMouseDown={(e) => { e.preventDefault(); handleCenterShoot(); }}
          >🔥</button>
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, 0); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(1, 0); }}
          >▶</button>
          
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, 1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(-1, 1); }}
          >◣</button>
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(0, 1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(0, 1); }}
          >▼</button>
          <button className="s-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, 1); }}
            onMouseDown={(e) => { e.preventDefault(); handleShootDirection(1, 1); }}
          >◢</button>
        </div>
        <span className="control-label">Disparar</span>
      </div>
    </div>
  );
};

export default TouchControls;
