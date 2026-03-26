import React, { useState, useEffect, useRef } from 'react';
import GameMap from './GameMap';
import { INITIAL_BUNKER_MATRIX, isWalkable, TILE_TYPES } from '../logic/GameEngine';

const BunkerRoom = ({ onTeleport, character }) => {
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  const [matrix] = useState(INITIAL_BUNKER_MATRIX);
  const moveTimer = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      let newX = playerPos.x;
      let newY = playerPos.y;
      let newDir = playerState.direction;

      if (e.key === 'ArrowUp') { newY--; newDir = 'arriba'; }
      if (e.key === 'ArrowDown') { newY++; newDir = 'abajo'; }
      if (e.key === 'ArrowLeft') { newX--; newDir = 'izquierda'; }
      if (e.key === 'ArrowRight') { newX++; newDir = 'derecha'; }

      const mappedDir = (character === 'maria' && newDir === 'abajo') ? 'adelante' : newDir;

      if (newX !== playerPos.x || newY !== playerPos.y) {
        setPlayerState({ direction: mappedDir, isMoving: true });
        
        clearTimeout(moveTimer.current);
        moveTimer.current = setTimeout(() => {
          setPlayerState(prev => ({ ...prev, isMoving: false }));
        }, 200);

        if (isWalkable(matrix, newX, newY)) {
          setPlayerPos({ x: newX, y: newY });
        } else if (matrix[newY]?.[newX] === TILE_TYPES.BUNKER_DOOR) {
          onTeleport();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(moveTimer.current);
    };
  }, [playerPos, matrix, onTeleport, playerState.direction, character]);

  return (
    <div className="game-view-cinematic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#000' }}>
      <GameMap 
        matrix={matrix} 
        playerPos={playerPos} 
        playerSprite={{
          character,
          direction: playerState.direction,
          isMoving: playerState.isMoving
        }}
      />
    </div>
  );
};

export default BunkerRoom;
