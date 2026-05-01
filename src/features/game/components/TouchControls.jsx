import React, { useState, useEffect, useRef } from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  const [moveStick, setMoveStick] = useState({ x: 0, y: 0, active: false });
  const [shootStick, setShootStick] = useState({ x: 0, y: 0, active: false });
  
  const moveInterval = useRef(null);
  const shootInterval = useRef(null);
  const activeMoveRef = useRef(null);
  const activeAimRef = useRef(0);

  // --- JOYSTICK IZQUIERDO: MOVIMIENTO ---
  const handleMoveTouch = (e, isEnd = false) => {
    if (isEnd) {
      setMoveStick({ x: 0, y: 0, active: false });
      activeMoveRef.current = null;
      if (moveInterval.current) clearInterval(moveInterval.current);
      return;
    }

    const touch = e.touches[0];
    const container = e.currentTarget.getBoundingClientRect();
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = container.width / 2;
    
    if (distance > maxRadius) {
      dx *= maxRadius / distance;
      dy *= maxRadius / distance;
    }

    setMoveStick({ x: dx, y: dy, active: true });

    // Determinar dirección cardinal
    let dir = null;
    if (distance > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? 'derecha' : 'izquierda';
        } else {
            dir = dy > 0 ? 'abajo' : 'arriba';
        }
    }

    if (dir !== activeMoveRef.current) {
        activeMoveRef.current = dir;
        if (moveInterval.current) clearInterval(moveInterval.current);
        if (dir) {
            onMove(dir);
            moveInterval.current = setInterval(() => onMove(dir), 200);
        }
    }
  };

  // --- JOYSTICK DERECHO: APUNTAR Y DISPARAR ---
  const handleShootTouch = (e, isEnd = false) => {
    if (isEnd) {
      setShootStick({ x: 0, y: 0, active: false });
      if (shootInterval.current) clearInterval(shootInterval.current);
      return;
    }

    const touch = Array.from(e.touches).find(t => {
        const rect = e.currentTarget.getBoundingClientRect();
        return t.clientX >= rect.left && t.clientX <= rect.right;
    }) || e.touches[0];

    const container = e.currentTarget.getBoundingClientRect();
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = container.width / 2;
    
    if (distance > maxRadius) {
      dx *= maxRadius / distance;
      dy *= maxRadius / distance;
    }

    setShootStick({ x: dx, y: dy, active: true });

    if (distance > 10) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        activeAimRef.current = angle;
        if (onAimChange) onAimChange(angle);
        window.currentAimAngle = angle;

        // Disparo automático si se aleja lo suficiente del centro
        if (distance > maxRadius * 0.4) {
            if (!shootInterval.current) {
                onShoot(angle);
                shootInterval.current = setInterval(() => {
                    onShoot(activeAimRef.current);
                }, 250);
            }
        } else {
            if (shootInterval.current) {
                clearInterval(shootInterval.current);
                shootInterval.current = null;
            }
        }
    }
  };

  return (
    <div className="touch-controls-container">
      {/* JOYSTICK MOVIMIENTO */}
      <div className="joystick-wrapper move-stick-wrapper">
        <div 
          className="joystick-base"
          onTouchStart={(e) => handleMoveTouch(e)}
          onTouchMove={(e) => handleMoveTouch(e)}
          onTouchEnd={(e) => handleMoveTouch(e, true)}
        >
          <div 
            className="joystick-handle move-handle" 
            style={{ transform: `translate(${moveStick.x}px, ${moveStick.y}px)` }}
          ></div>
        </div>
        <span className="control-label">Mover</span>
      </div>
      
      {/* JOYSTICK DISPARO */}
      <div className="joystick-wrapper shoot-stick-wrapper">
        <div 
          className="joystick-base shoot-base"
          onTouchStart={(e) => handleShootTouch(e)}
          onTouchMove={(e) => handleShootTouch(e)}
          onTouchEnd={(e) => handleShootTouch(e, true)}
        >
          <div 
            className="joystick-handle shoot-handle" 
            style={{ transform: `translate(${shootStick.x}px, ${shootStick.y}px)` }}
          ></div>
        </div>
        <span className="control-label">Apuntar / Disparar</span>
      </div>
    </div>
  );
};

export default TouchControls;
