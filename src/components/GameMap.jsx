import React from 'react';
import './GameMap.css';

const TILE_ASSETS = {
  0: '/assets/tiles/ground/ground_clean.png',
  1: '/assets/tiles/ground/ground_stone.png',
  2: '/assets/tiles/ground/ground_dirty.png',
  10: '/assets/props/bunker/bunker_door.png',
  11: '/assets/props/barricades/barricade_concrete.png',
};

const TILE_SIZE = 70;
const VIEWPORT_TILES = 9;

const GameMap = ({ matrix, playerPos, playerSprite, zombies = [] }) => {
  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  const centerX = Math.floor(VIEWPORT_TILES / 2);
  const centerY = Math.floor(VIEWPORT_TILES / 2);

  // VIEW CULLING: Calculate the range of tiles to render
  // We add a buffer of 1 tile to ensure smooth movement at the edges
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
    
    let assetPath = '';
    if (isMoving) {
      assetPath = `/personajes/${character}/${direction}.gif`;
    } else {
      assetPath = `/personajes/${character}/no-seleccion.png`;
    }

    return (
      <div className="player-sprite">
        <img src={assetPath} alt="player" className="sprite-image" />
      </div>
    );
  };

  const renderZombies = (x, y) => {
    if (!zombies) return null;
    return zombies.filter(z => Math.floor(z.x) === x && Math.floor(z.y) === y).map((z, i) => (
      <div key={`zombie-${i}`} className="player-sprite zombie-sprite">
        <img 
          src={`/zombies/comun/${z.direction}.gif`} 
          alt="zombie" 
          className="sprite-image" 
          onError={(e) => { e.target.onerror = null; e.target.src=`/zombies/comun/abajo.gif`; }}
        />
      </div>
    ));
  };

  // Create the visible subset of tiles
  const visibleTiles = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      visibleTiles.push({
        x,
        y,
        cell: matrix[y][x]
      });
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
        {visibleTiles.map(({ x, y, cell }) => (
          <div 
            key={`${x}-${y}`} 
            className="tile"
            style={{
              position: 'absolute',
              left: `${x * TILE_SIZE}px`,
              top: `${y * TILE_SIZE}px`
            }}
          >
            {TILE_ASSETS[cell] && (
              <img src={TILE_ASSETS[cell]} alt={`tile-${cell}`} className="tile-image" />
            )}
            {renderZombies(x, y)}
            {renderPlayer(x, y)}
          </div>
        ))}
      </div>
      <div className="vision-vignette"></div>
    </div>
  );
};

export default GameMap;
