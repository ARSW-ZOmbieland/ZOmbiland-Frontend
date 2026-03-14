import React from 'react';
import './GameMap.css';

const GROUND_ASSETS = {
  0: '/assets/tiles/ground/ground_clean.png',
  1: '/assets/tiles/ground/ground_stone.png',
  2: '/assets/tiles/ground/ground_dirty.png',
  3: '/assets/tiles/ground/ground_cracked.png',
  4: '/assets/tiles/ground/ground_blood.png',
  5: '/assets/tiles/ground/ground_heavy_blood.png',
  6: '/assets/tiles/ground/ground_dark.png',
};

const PROP_ASSETS = {
  10: '/bunker/puertarefugio.png',
  11: '/assets/props/barricades/barricade_concrete.png',
  12: '/assets/environment/trees/tree_dead_01.png',
  13: '/assets/vehicles/car_burned.png',
  14: '/assets/props/barricades/barricade_military.png',
};

const TILE_SIZE = 70;
const VIEWPORT_TILES = 9;

const GameMap = ({ matrix, playerPos, playerSprite }) => {
  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  const centerX = Math.floor(VIEWPORT_TILES / 2);
  const centerY = Math.floor(VIEWPORT_TILES / 2);

  // Viewport culling range
  const startX = Math.max(0, playerPos.x - centerX - 1);
  const endX = Math.min(cols, playerPos.x + centerX + 2);
  const startY = Math.max(0, playerPos.y - centerY - 1);
  const endY = Math.min(rows, playerPos.y + centerY + 2);

  const translateX = (centerX - playerPos.x) * TILE_SIZE;
  const translateY = (centerY - playerPos.y) * TILE_SIZE;

  // Render the player separately on top
  const renderPlayerSprite = () => {
    if (!playerSprite || !playerSprite.character) return null;
    const { character, direction, isMoving } = playerSprite;
    const assetPath = isMoving ? `/personajes/${character}/${direction}.gif` : `/personajes/${character}/no-seleccion.png`;

    return (
      <div 
        className="player-sprite" 
        style={{ 
          zIndex: 20, 
          position: 'absolute',
          left: `${playerPos.x * TILE_SIZE}px`,
          top: `${playerPos.y * TILE_SIZE}px`,
          width: `${TILE_SIZE}px`,
          height: `${TILE_SIZE}px`,
          pointerEvents: 'none',
          transition: 'all 0.1s linear'
        }}
      >
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
          // Handle both simple ID (bunker) and layered object (world)
          const groundID = typeof cell === 'object' ? cell.g : (cell < 10 ? cell : 0);
          const propID = typeof cell === 'object' ? cell.p : (cell >= 10 ? cell : null);

          return (
            <div 
              key={`${x}-${y}`} 
              className="tile"
              style={{
                position: 'absolute',
                left: `${x * TILE_SIZE}px`,
                top: `${y * TILE_SIZE}px`,
                backgroundColor: 'transparent',
                border: 'none',
                overflow: 'visible'
              }}
            >
              {/* Layer 1: Ground */}
              <img 
                src={GROUND_ASSETS[groundID] || GROUND_ASSETS[0]} 
                alt="ground" 
                className="tile-image" 
                style={{ position: 'absolute', zIndex: 1 }} 
              />
              
              {/* Layer 2: Prop */}
              {propID && (
                <img 
                  src={PROP_ASSETS[propID]} 
                  alt="prop" 
                  className="tile-image" 
                  style={{ position: 'absolute', zIndex: 5 }} 
                />
              )}
            </div>
          );
        })}

        {/* Layer 3: Player */}
        {renderPlayerSprite()}
      </div>
      <div className="vision-vignette"></div>
    </div>
  );
};

export default GameMap;
