import React, { memo } from 'react';
import './GameMap.css';
import { TILE_SIZE, VIEWPORT_TILES, GROUND_ASSETS, PROP_ASSETS } from '../../../config/constants';

const GameMap = memo(({ matrix, playerPos, playerSprite }) => {
  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  const centerX = Math.floor(VIEWPORT_TILES / 2);
  const centerY = Math.floor(VIEWPORT_TILES / 2);

  const startX = Math.max(0, playerPos.x - centerX - 1);
  const endX = Math.min(cols, playerPos.x + centerX + 2);
  const startY = Math.max(0, playerPos.y - centerY - 1);
  const endY = Math.min(rows, playerPos.y + centerY + 2);

  const translateX = (centerX - playerPos.x) * TILE_SIZE;
  const translateY = (centerY - playerPos.y) * TILE_SIZE;

  const renderPlayer = (x, y) => {
    if (!playerSprite || !playerSprite.character) return null;
    if (playerPos.x !== x || playerPos.y !== y) return null;

    const { character, direction, isMoving } = playerSprite;
    const assetPath = isMoving ? `/personajes/${character}/${direction}.gif` : `/personajes/${character}/no-seleccion.png`;

    return (
      <div className="player-sprite" style={{ zIndex: 10 }}>
        <img src={assetPath} alt="player" className="sprite-image" />
      </div>
    );
  };

  const visibleTiles = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      visibleTiles.push({ x, y, cell: matrix[y][x] });
    }
  }

  return (
    <div className="game-viewport">
      <div 
        className="game-map-container" 
        style={{ 
          width: `${cols * TILE_SIZE}px`,
          height: `${rows * TILE_SIZE}px`,
          transform: `translate(${translateX}px, ${translateY}px)`,
          position: 'relative'
        }}
      >
        {visibleTiles.map(({ x, y, cell }) => {
          // Compatibility with both plain IDs and layered objects
          const groundID = typeof cell === 'object' ? cell.g : (cell < 10 ? cell : 0);
          const propID = typeof cell === 'object' ? cell.p : (cell >= 10 ? cell : null);

          return (
            <div 
              key={`${x}-${y}`} 
              className="tile"
              style={{
                position: 'absolute',
                left: `${x * TILE_SIZE}px`,
                top: `${y * TILE_SIZE}px`
              }}
            >
              {/* Layer 1: Ground */}
              <img src={GROUND_ASSETS[groundID] || GROUND_ASSETS[0]} alt="ground" className="tile-image" style={{ zIndex: 1 }} />
              
              {/* Layer 2: Prop */}
              {propID && (
                <img src={PROP_ASSETS[propID]} alt="prop" className="tile-image" style={{ position: 'absolute', zIndex: 5, top: 0, left: 0 }} />
              )}
              
              {/* Layer 3: Player */}
              {renderPlayer(x, y)}
            </div>
          );
        })}
      </div>
      <div className="vision-vignette"></div>
    </div>
  );
});

export default GameMap;
