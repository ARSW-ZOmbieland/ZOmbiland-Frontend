import React, { useState, useCallback } from 'react';
import GameMap from './GameMap';
import { WORLD_MAP_MATRIX, TILE_TYPES } from '../../../core/GameEngine';
import { usePlayerMovement } from '../../../hooks/usePlayerMovement';

const WorldMap = ({ onExit, character }) => {
  const [matrix] = useState(WORLD_MAP_MATRIX);

  const handleCollideSpecial = useCallback((x, y, cell) => {
    const cellID = typeof cell === 'object' ? cell.p : cell;
    // Exit gate check (typically at the end of the map)
    if (cellID === TILE_TYPES.BUNKER_DOOR && (x > 10 || y > 10)) {
      onExit();
    }
  }, [onExit]);

  const { playerPos, playerState } = usePlayerMovement(
    { x: 2, y: 1 }, 
    character, 
    matrix, 
    handleCollideSpecial
  );

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
