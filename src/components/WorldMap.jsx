import React, { useState, useEffect, useRef } from 'react';
import GameMap from './GameMap';
import { WORLD_MAP_MATRIX, isWalkable, TILE_TYPES } from '../logic/GameEngine';

const WorldMap = ({ onExit, character }) => {
  // Start near the entrance (1,1)
  const [playerPos, setPlayerPos] = useState({ x: 2, y: 1 });
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  const [matrix] = useState(WORLD_MAP_MATRIX);
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

        const cell = matrix[newY]?.[newX];
        const cellID = typeof cell === 'object' ? cell.p : cell;

        if (isWalkable(matrix, newX, newY)) {
          setPlayerPos({ x: newX, y: newY });
        } else if (cellID === TILE_TYPES.BUNKER_DOOR && (newX > 10 || newY > 10)) {
            // If it's the exit door at the far end (48,48)
            onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(moveTimer.current);
    };
  }, [playerPos, matrix, onExit, playerState.direction, character]);

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

export default WorldMap;
