import { useState, useEffect, useRef } from 'react';
import { isWalkable } from '../core/GameEngine';

/**
 * Custom hook to handle player movement logic shared between maps.
 * @param {Object} initialPos - {x, y}
 * @param {string} character - 'maria', 'alex', etc.
 * @param {Array} matrix - The map grid
 * @param {Function} onCollideSpecial - Callback for special tiles (doors, exits)
 */
export const usePlayerMovement = (initialPos, character, matrix, onCollideSpecial) => {
  const [playerPos, setPlayerPos] = useState(initialPos);
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  
  const moveTimer = useRef(null);

  const handleManualMove = (direction) => {
    let newX = playerPos.x;
    let newY = playerPos.y;
    let dx = 0;
    let dy = 0;

    switch (direction) {
      case 'arriba': dy = -1; break;
      case 'abajo': dy = 1; break;
      case 'izquierda': dx = -1; break;
      case 'derecha': dx = 1; break;
      default: return;
    }

    newX += dx;
    newY += dy;

    // Special mapping for character sprites
    const mappedDir = (character === 'maria' && direction === 'abajo') ? 'adelante' : direction;

    if (newX !== playerPos.x || newY !== playerPos.y) {
      setPlayerState({ direction: mappedDir, isMoving: true });
      
      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => {
        setPlayerState(prev => ({ ...prev, isMoving: false }));
      }, 2000);

      if (isWalkable(matrix, newX, newY)) {
        setPlayerPos({ x: newX, y: newY });
      } else if (onCollideSpecial) {
        onCollideSpecial(newX, newY, matrix[newY]?.[newX]);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keys = {
        ArrowUp: 'arriba',
        ArrowDown: 'abajo',
        ArrowLeft: 'izquierda',
        ArrowRight: 'derecha',
        w: 'arriba',
        s: 'abajo',
        a: 'izquierda',
        d: 'derecha'
      };

      const dir = keys[e.key];
      if (dir) {
        handleManualMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (moveTimer.current) clearTimeout(moveTimer.current);
    };
  }, [playerPos, character, matrix, onCollideSpecial]);

  return { playerPos, playerState, setPlayerPos, handleManualMove };
};
