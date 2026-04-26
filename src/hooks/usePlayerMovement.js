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
export const usePlayerMovement = (initialPos, character, matrix, onCollideSpecial, roomCode, otherPlayers = {}, health = 100, isPaused = false, ammo = 30, location = 'world', isParalyzed = false) => {
  const [playerPos, setPlayerPos] = useState(initialPos);
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  
  const moveTimer = useRef(null);
  const lastMoveRef = useRef(0);

  const handleManualMove = (direction) => {
    // No moverse si está muerto o pausado
    if (health <= 0 || isPaused) return;

    const now = Date.now();
    // Cooldown optimizado para mejor respuesta (200ms)
    if (now - lastMoveRef.current < 200) return;
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

    // Siempre permitir girar, incluso si el movimiento está bloqueado (parálisis)
    setPlayerState({ direction: mappedDir, isMoving: true });
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => {
      setPlayerState(prev => ({ ...prev, isMoving: false }));
    }, 1000);

    if (newX !== playerPos.x || newY !== playerPos.y) {
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

        if (!isOccupied && !isParalyzed) {
          setPlayerPos({ x: newX, y: newY });
          
          if (roomCode) {
              webSocketService.sendMessage('/app/game.action', {
                  playerId: character,
                  roomCode: roomCode,
                  x: newX,
                  y: newY,
                  action: mappedDir,
                  health: health,
                  location: location
              });
          }
        }
      } else if (onCollideSpecial) {
        onCollideSpecial(newX, newY, matrix[newY]?.[newX]);
      }
    } else {
      // Si solo giró (sin moverse), también enviamos el estado al servidor para que otros vean el giro
      if (roomCode) {
        webSocketService.sendMessage('/app/game.action', {
            playerId: character,
            roomCode: roomCode,
            x: playerPos.x,
            y: playerPos.y,
            action: mappedDir,
            health: health,
            location: location
        });
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
        W: 'arriba',
        s: 'abajo',
        S: 'abajo',
        a: 'izquierda',
        A: 'izquierda',
        d: 'derecha',
        D: 'derecha'
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
  }, [playerPos, character, matrix, onCollideSpecial, isPaused]);

  return { playerPos, playerState, setPlayerPos, handleManualMove };
};
