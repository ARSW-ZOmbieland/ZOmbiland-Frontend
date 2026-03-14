import React, { useState, useCallback } from 'react';
import GameMap from './GameMap';
import { INITIAL_BUNKER_MATRIX, TILE_TYPES } from '../../../core/GameEngine';
import { usePlayerMovement } from '../../../hooks/usePlayerMovement';

const BunkerRoom = ({ onTeleport, character }) => {
  const [matrix] = useState(INITIAL_BUNKER_MATRIX);

  const handleCollideSpecial = useCallback((x, y, cell) => {
    const cellID = typeof cell === 'object' ? cell.p : cell;
    if (cellID === TILE_TYPES.BUNKER_DOOR) {
      onTeleport();
    }
  }, [onTeleport]);

  const { playerPos, playerState } = usePlayerMovement(
    { x: 1, y: 1 }, 
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

export default BunkerRoom;
