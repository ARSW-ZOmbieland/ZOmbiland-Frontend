import React, { useRef } from 'react';
import './TouchControls.css';
import VirtualJoystick from './VirtualJoystick';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  const lastShotTime = useRef(0);

  // Mapear movimiento del joystick izquierdo a comandos de dirección
  const handleJoystickMove = (dx, dy) => {
    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return;

    let direction = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'derecha' : 'izquierda';
    } else {
      direction = dy > 0 ? 'abajo' : 'arriba';
    }

    if (onMove) onMove(direction);
  };

  // Mapear joystick derecho a puntería y disparo automático
  const handleAimMove = (dx, dy, angle) => {
    if (onAimChange) onAimChange(angle);

    // Si el joystick se mueve lo suficiente, disparamos automáticamente (ráfaga)
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0.5) {
      const now = Date.now();
      if (now - lastShotTime.current > 250) { // Cadencia de disparo
        if (onShoot) {
          // El ángulo es el que determina el disparo en la mecánica actual
          onShoot(angle); 
        }
        lastShotTime.current = now;
      }
    }
  };

  return (
    <div className="touch-controls-container">
      <div className="joystick-left">
        <VirtualJoystick 
          onMove={handleJoystickMove} 
          label="Mover"
          color="#32CD32"
        />
      </div>
      
      <div className="joystick-right">
        <VirtualJoystick 
          onMove={handleAimMove} 
          label="Disparar"
          color="#ff4444"
        />
      </div>
    </div>
  );
};

export default TouchControls;
