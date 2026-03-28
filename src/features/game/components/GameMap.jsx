import React, { memo } from 'react';
import './GameMap.css';
import { TILE_SIZE, VIEWPORT_TILES, GROUND_ASSETS, PROP_ASSETS } from '../../../config/constants';

const GameMap = memo(({ matrix, playerPos, playerSprite, otherPlayers = {}, zombies = [] }) => {
  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  const centerX = Math.floor(VIEWPORT_TILES / 2);
  const centerY = Math.floor(VIEWPORT_TILES / 2);

  const startX = Math.max(0, playerPos.x - centerX - 1);
  const endX = Math.min(cols, playerPos.x + centerX + 2);
  const startY = Math.max(0, playerPos.y - centerY - 1);
  const endY = Math.min(rows, playerPos.y + centerY + 2);

  const translateX = `calc((${centerX} - ${playerPos.x}) * var(--tile-size))`;
  const translateY = `calc((${centerY} - ${playerPos.y}) * var(--tile-size))`;

  const renderPlayer = (x, y) => {
    if (!playerSprite || !playerSprite.character) return null;
    if (playerPos.x !== x || playerPos.y !== y) return null;

    const { character, direction, isMoving } = playerSprite;
    const assetPath = isMoving ? `/personajes/${character}/${direction}.gif` : `/personajes/${character}/no-seleccion.png`;

    return (
      <div className="player-sprite" style={{ zIndex: y * 10 + 12 }}>
        <div className="player-indicator"></div>
        <img src={assetPath} alt="player" className="sprite-image" />
      </div>
    );
  };

  const renderZombies = (x, y) => {
    if (!zombies || zombies.length === 0) return null;
    
    return zombies.filter(z => Math.floor(z.x) === x && Math.floor(z.y) === y).map((z, i) => (
      <div key={`zombie-${i}`} className="player-sprite zombie-sprite" style={{ zIndex: y * 10 + 11 }}>
        <img 
          src={`/zombies/comun/${z.direction}.gif`} 
          alt="zombie" 
          className="sprite-image" 
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src=`/zombies/comun/abajo.gif`; 
          }}
        />
      </div>
    ));
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
          width: `calc(${cols} * var(--tile-size))`,
          height: `calc(${rows} * var(--tile-size))`,
          transform: `translate(${translateX}, ${translateY})`,
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
                left: `calc(${x} * var(--tile-size))`,
                top: `calc(${y} * var(--tile-size))`
              }}
            >
              {/* Layer 1: Ground */}
              <img src={GROUND_ASSETS[groundID] || GROUND_ASSETS[0]} alt="ground" className="tile-image" style={{ zIndex: 1 }} />
              
              {/* Layer 2: Prop */}
              {propID && propID !== 99 && (
                <img 
                  src={PROP_ASSETS[propID]} 
                  alt="prop" 
                  className={`tile-image ${propID >= 20 && propID <= 22 ? 'bush-prop' : ''} ${propID >= 30 && propID <= 34 ? 'tree-prop' : ''} ${propID >= 40 && propID <= 49 ? 'bunker-prop' : ''} ${propID >= 50 && propID <= 59 ? 'forest-prop' : ''} ${propID >= 60 && propID <= 69 ? 'city-building' : ''} ${propID >= 70 && propID <= 89 && propID !== 72 ? 'urban-prop' : ''} ${propID === 72 ? 'street-light-prop' : ''} ${propID === 90 ? 'barricade-prop' : ''}`} 
                  style={{ position: 'absolute', zIndex: y * 10 + 10, top: 0, left: 0 }} 
                />
              )}
              
              {/* Layer 3: Zombies */}
              {renderZombies(x, y)}

              {/* Layer 4: Player */}
              {renderPlayer(x, y)}
              
              {/* Layer 4: Other Players */}
              {Object.values(otherPlayers).filter(p => Math.floor(p.x) === x && Math.floor(p.y) === y).map(p => {
                const action = p.action || 'abajo';
                const pAsset = `/personajes/${p.playerId}/${action}.gif`;
                return (
                  <div key={p.playerId} className="player-sprite" style={{ zIndex: y * 10 + 11 }}>
                    <img src={pAsset} alt="other-player" className="sprite-image" onError={(e) => { e.target.onerror = null; e.target.src=`/personajes/${p.playerId}/no-seleccion.png`; }} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="vision-vignette"></div>
    </div>
  );
});

export default GameMap;
