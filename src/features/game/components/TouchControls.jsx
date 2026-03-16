import React from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove }) => {
  return (
    <div className="touch-controls">
      <div className="d-pad">
        <button 
          className="d-btn up" 
          onTouchStart={(e) => { e.preventDefault(); onMove('arriba'); }}
          onMouseDown={(e) => { e.preventDefault(); onMove('arriba'); }}
        >
          ▲
        </button>
        <div className="d-pad-horizontal">
          <button 
            className="d-btn left" 
            onTouchStart={(e) => { e.preventDefault(); onMove('izquierda'); }}
            onMouseDown={(e) => { e.preventDefault(); onMove('izquierda'); }}
          >
            ◀
          </button>
          <div className="d-pad-center"></div>
          <button 
            className="d-btn right" 
            onTouchStart={(e) => { e.preventDefault(); onMove('derecha'); }}
            onMouseDown={(e) => { e.preventDefault(); onMove('derecha'); }}
          >
            ▶
          </button>
        </div>
        <button 
          className="d-btn down" 
          onTouchStart={(e) => { e.preventDefault(); onMove('abajo'); }}
          onMouseDown={(e) => { e.preventDefault(); onMove('abajo'); }}
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default TouchControls;
