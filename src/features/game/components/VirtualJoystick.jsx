import React, { useRef, useState, useEffect, useCallback } from 'react';
import './VirtualJoystick.css';

const VirtualJoystick = ({ onMove, onEnd, color = '#32CD32', label = '' }) => {
  const baseRef = useRef(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (e) => {
    setIsDragging(true);
    handleMove(e);
  };

  const handleMove = useCallback((e) => {
    if (!isDragging || !baseRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2;
    const limitedDistance = Math.min(distance, maxDistance);
    
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * limitedDistance;
    const y = Math.sin(angle) * limitedDistance;

    setStickPos({ x, y });

    if (onMove) {
      // Normalizamos dx y dy entre -1 y 1
      onMove(dx / maxDistance, dy / maxDistance, angle * (180 / Math.PI));
    }
  }, [isDragging, onMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
    if (onEnd) onEnd();
  }, [onEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="joystick-wrapper">
      {label && <span className="joystick-label">{label}</span>}
      <div 
        className="joystick-base" 
        ref={baseRef}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        style={{ borderColor: color + '44' }}
      >
        <div 
          className="joystick-stick"
          style={{ 
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}`
          }}
        />
      </div>
    </div>
  );
};

export default VirtualJoystick;
