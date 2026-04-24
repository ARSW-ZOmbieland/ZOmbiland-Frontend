import React from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  // Disparo en 8 direcciones (mapeo tipo Numpad)
  const handleShootDirection = (dx, dy) => {
    // Calculamos el ángulo
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Al llamar a onAimChange con este ángulo especial, 
    // el sistema detectará que es un disparo desde móvil
    if (onAimChange) onAimChange(angle);
  };

  const handleCenterShoot = () => {
    // Disparo frontal (usa el ángulo actual de window)
    if (onAimChange) onAimChange(window.currentAimAngle || 0);
  };

  return (
    <div className="touch-controls-container">
      {/* PANEL DE MOVIMIENTO (IZQUIERDA) */}
      <div className="control-group move-group">
        <div className="d-pad">
          <button className="d-btn up" onTouchStart={(e) => { e.preventDefault(); onMove('arriba'); }}>▲</button>
          <div className="d-pad-horizontal">
            <button className="d-btn left" onTouchStart={(e) => { e.preventDefault(); onMove('izquierda'); }}>◀</button>
            <div className="d-pad-center"></div>
            <button className="d-btn right" onTouchStart={(e) => { e.preventDefault(); onMove('derecha'); }}>▶</button>
          </div>
          <button className="d-btn down" onTouchStart={(e) => { e.preventDefault(); onMove('abajo'); }}>▼</button>
        </div>
        <span className="control-label">Mover</span>
      </div>
      
      {/* PANEL DE DISPARO (DERECHA - Estilo Numpad 9 botones) */}
      <div className="control-group shoot-group">
        <div className="shoot-grid">
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, -1); }}>◤</button>
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(0, -1); }}>▲</button>
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, -1); }}>◥</button>
          
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, 0); }}>◀</button>
          <button className="s-btn center-fire" onTouchStart={(e) => { e.preventDefault(); handleCenterShoot(); }}>🔥</button>
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, 0); }}>▶</button>
          
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(-1, 1); }}>◣</button>
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(0, 1); }}>▼</button>
          <button className="s-btn" onTouchStart={(e) => { e.preventDefault(); handleShootDirection(1, 1); }}>◢</button>
        </div>
        <span className="control-label">Disparar</span>
      </div>
    </div>
  );
};

export default TouchControls;
