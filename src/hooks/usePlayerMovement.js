import { useState, useEffect, useRef } from 'react';
import { isWalkable } from '../core/GameEngine';
import webSocketService from '../core/WebSocketService';

/**
 * Custom hook to handle player movement logic shared between maps.
 * @param {Object} initialPos - {x, y}
 * @param {string} character - 'maria', 'alex', etc.
 * @param {Array} matrix - The map grid
 * @param {Function} onCollideSpecial - Callback for special tiles (doors, exits)
 * @param {string} roomCode - The active room code
 */
export const usePlayerMovement = (initialPos, character, matrix, onCollideSpecial, roomCode, otherPlayers = {}, health = 100) => {
  const [playerPos, setPlayerPos] = useState(initialPos);
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  
  const moveTimer = useRef(null);
  const lastMoveRef = useRef(0);

  const handleManualMove = (direction) => {
    // No moverse si está muerto
    if (health <= 0) return;

    const now = Date.now();
    // Cooldown de 0.3 segundos (solicitado por el usuario)
    if (now - lastMoveRef.current < 300) return;
    lastMoveRef.current = now;
    
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
        let isOccupied = false;
        if (otherPlayers) {
          for (const id in otherPlayers) {
            if (otherPlayers[id].x === newX && otherPlayers[id].y === newY) {
              isOccupied = true;
              break;
            }
          }
        }

        if (!isOccupied) {
          setPlayerPos({ x: newX, y: newY });
          
          if (roomCode) {
              webSocketService.sendMessage('/app/game.action', {
                  playerId: character,
                  roomCode: roomCode,
                  x: newX,
                  y: newY,
                  action: mappedDir
              });
          }
        }
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
