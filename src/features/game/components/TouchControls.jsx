import React, { useState, useEffect, useRef } from 'react';
import './TouchControls.css';

const TouchControls = ({ onMove, onShoot, onAimChange }) => {
  const [moveStick, setMoveStick] = useState({ x: 0, y: 0, active: false });
  const [shootStick, setShootStick] = useState({ x: 0, y: 0, active: false });
  
  const moveInterval = useRef(null);
  const shootInterval = useRef(null);
  const activeMoveRef = useRef(null);
  const activeAimRef = useRef(0);

  // Identificadores de puntero para soporte multitouch real
  const movePointerId = useRef(null);
  const shootPointerId = useRef(null);

  // Evitar que el menú contextual aparezca al mantener presionado en móviles
  useEffect(() => {
    const handleContextMenu = (e) => {
        // Prevenir context menu en los joysticks
        if (e.target.closest('.joystick-wrapper')) {
            e.preventDefault();
        }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // --- JOYSTICK IZQUIERDO: MOVIMIENTO ---
  const handleMoveStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    movePointerId.current = e.pointerId;
    handleMoveActive(e);
  };

  const handleMoveActive = (e) => {
    if (movePointerId.current !== e.pointerId) return;

    const container = e.currentTarget.getBoundingClientRect();
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
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

  const handleMoveEnd = (e) => {
    if (movePointerId.current !== e.pointerId) return;
    
    // Solo liberamos captura si aún la tenemos (para evitar errores DOM)
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}
    movePointerId.current = null;

    setMoveStick({ x: 0, y: 0, active: false });
    activeMoveRef.current = null;
    if (moveInterval.current) clearInterval(moveInterval.current);
  };

  // --- JOYSTICK DERECHO: APUNTAR Y DISPARAR ---
  const handleShootStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    shootPointerId.current = e.pointerId;
    handleShootActive(e);
  };

  const handleShootActive = (e) => {
    if (shootPointerId.current !== e.pointerId) return;

    const container = e.currentTarget.getBoundingClientRect();
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
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

  const handleShootEnd = (e) => {
    if (shootPointerId.current !== e.pointerId) return;
    
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}
    shootPointerId.current = null;

    setShootStick({ x: 0, y: 0, active: false });
    if (shootInterval.current) clearInterval(shootInterval.current);
  };

  return (
    <div className="touch-controls-container">
      {/* JOYSTICK MOVIMIENTO */}
      <div className="joystick-wrapper move-stick-wrapper">
        <div 
          className="joystick-base"
          onPointerDown={handleMoveStart}
          onPointerMove={handleMoveActive}
          onPointerUp={handleMoveEnd}
          onPointerCancel={handleMoveEnd}
          onContextMenu={(e) => e.preventDefault()}
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
          onPointerDown={handleShootStart}
          onPointerMove={handleShootActive}
          onPointerUp={handleShootEnd}
          onPointerCancel={handleShootEnd}
          onContextMenu={(e) => e.preventDefault()}
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
