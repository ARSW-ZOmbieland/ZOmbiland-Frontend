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

  useEffect(() => {
    const handleKeyDown = (e) => {
      let newX = playerPos.x;
      let newY = playerPos.y;
      let newDir = playerState.direction;

      const keys = {
        ArrowUp: { dy: -1, dir: 'arriba' },
        ArrowDown: { dy: 1, dir: 'abajo' },
        ArrowLeft: { dx: -1, dir: 'izquierda' },
        ArrowRight: { dx: 1, dir: 'derecha' }
      };

      const move = keys[e.key];
      if (!move) return;

      if (move.dy) newY += move.dy;
      if (move.dx) newX += move.dx;
      newDir = move.dir;

      // Special mapping for Maria's front sprite
      const mappedDir = (character === 'maria' && newDir === 'abajo') ? 'adelante' : newDir;

      if (newX !== playerPos.x || newY !== playerPos.y) {
        setPlayerState({ direction: mappedDir, isMoving: true });
        
        clearTimeout(moveTimer.current);
        moveTimer.current = setTimeout(() => {
          setPlayerState(prev => ({ ...prev, isMoving: false }));
        }, 2000); // The 2-second idle delay

        if (isWalkable(matrix, newX, newY)) {
          setPlayerPos({ x: newX, y: newY });
        } else if (onCollideSpecial) {
          onCollideSpecial(newX, newY, matrix[newY]?.[newX]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(moveTimer.current);
    };
  }, [playerPos, playerState.direction, character, matrix, onCollideSpecial]);

  return { playerPos, playerState, setPlayerPos };
};
