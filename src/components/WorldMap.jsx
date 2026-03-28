import React, { useState, useEffect, useRef } from 'react';
import GameMap from './GameMap';
import { WORLD_MAP_MATRIX, isWalkable, TILE_TYPES } from '../logic/GameEngine';
import { useZombieAI } from '../hooks/useZombieAI';

const WorldMap = ({ onExit, character }) => {
  // Start near the entrance (1,1)
  const [playerPos, setPlayerPos] = useState({ x: 2, y: 1 });
  const [playerState, setPlayerState] = useState({
    direction: 'abajo',
    isMoving: false
  });
  const [matrix] = useState(WORLD_MAP_MATRIX);
  const moveTimer = useRef(null);

  // IA del zombie
  const { zombiePos, direction: zombieDir } = useZombieAI(
    playerPos, 
    matrix, 
    { x: 3, y: 1 }, // Spawning at 3,1 for testing (player starts at 2,1)
    {} // En esta versión simplificada no hay otherPlayers por ahora
  );

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
        } else if (matrix[newY]?.[newX] === TILE_TYPES.BUNKER_DOOR && (newX > 10 || newY > 10)) {
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
        zombies={[{ x: zombiePos.x, y: zombiePos.y, direction: zombieDir }]}
      />
    </div>
  );
};

export default WorldMap;
