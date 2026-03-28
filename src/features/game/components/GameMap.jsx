import React, { memo, useState, useEffect } from 'react';
import './GameMap.css';
import SpritePlayer from './SpritePlayer';
import SpriteZombie from './SpriteZombie';
import { TILE_SIZE, VIEWPORT_TILES, GROUND_ASSETS, PROP_ASSETS } from '../../../config/constants';

const HealthBar = ({ health }) => {
  const color = health > 50 ? '#00ff00' : health > 20 ? '#ffff00' : '#ff0000';
  return (
    <div className="health-bar-container">
      <div 
        className="health-bar-fill" 
        style={{ width: `${health}%`, backgroundColor: color }}
      ></div>
    </div>
  );
};

const GameMap = memo(({ matrix, playerPos, playerSprite, otherPlayers = {}, zombies = [], onRestart }) => {
  const [cooldown, setCooldown] = useState(90);
  const isDead = playerSprite.health <= 0;

  useEffect(() => {
    let timer;
    if (isDead) {
      if (cooldown > 0) {
        timer = setInterval(() => {
          setCooldown(prev => Math.max(0, prev - 1));
        }, 1000);
      } else {
        // Requisito: Reinicio automático al terminar el tiempo
        if (onRestart) onRestart();
      }
    }
    return () => clearInterval(timer);
  }, [isDead, cooldown, onRestart]);
  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  const centerX = Math.floor(VIEWPORT_TILES / 2);
  const centerY = Math.floor(VIEWPORT_TILES / 2);

  // Math: (CenterIndex - PlayerWorldCoordinate) * TileSize
  // This ensures that when player is at (playerPos.x, playerPos.y), that tile lands exactly in the center of the viewport.
  const translateX = `calc((${centerX} - ${playerPos.x}) * var(--tile-size))`;
  const translateY = `calc((${centerY} - ${playerPos.y}) * var(--tile-size))`;

  // Visibility Range: Render tiles around the player to save performance
  // Increased buffer (+6 on each side) to handle large buildings (4x width) and prevent popping/cropping
  const startX = Math.max(0, Math.floor(playerPos.x - centerX - 6));
  const endX = Math.min(cols, Math.floor(playerPos.x + centerX + 7));
  const startY = Math.max(0, Math.floor(playerPos.y - centerY - 6));
  const endY = Math.min(rows, Math.floor(playerPos.y + centerY + 7));

  const renderPlayer = (x, y) => {
    if (!playerSprite || !playerSprite.character) return null;
    if (Math.floor(playerPos.x) !== x || Math.floor(playerPos.y) !== y) return null;

    const { character, direction, isMoving, health } = playerSprite;
    const isDead = health <= 0;

    return (
      <div className="player-sprite" style={{ zIndex: y * 10 + 12 }}>
        <HealthBar health={health || 100} />
        <div className="player-indicator"></div>
        <SpritePlayer 
          characterId={character} 
          direction={direction} 
          isMoving={isMoving} 
          isDead={isDead} 
        />
      </div>
    );
  };

  const renderZombies = (x, y) => {
    if (!zombies || zombies.length === 0) return null;
    
    return zombies.filter(z => Math.floor(z.x) === x && Math.floor(z.y) === y).map((z, i) => {
      return (
        <div key={`zombie-${i}`} className="player-sprite zombie-sprite" style={{ zIndex: y * 10 + 11 }}>
          <SpriteZombie 
            direction={z.direction} 
            isAttacking={z.attacking} 
          />
        </div>
      );
    });
  };

  const visibleTiles = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      visibleTiles.push({ x, y, cell: matrix[y][x] });
    }
  }

  // Moved isDead up to state area

  return (
    <div className="game-viewport">
      <div 
        className={`game-map-container ${isDead ? 'is-dead' : ''}`} 
        style={{ 
          width: `calc(${cols} * var(--tile-size))`,
          height: `calc(${rows} * var(--tile-size))`,
          transform: `translate(${translateX}, ${translateY})`,
          position: 'relative'
        }}
      >
        {visibleTiles.map(({ x, y, cell }) => {
          // ... (rest of tile rendering)
          const groundID = typeof cell === 'object' ? cell.g : (cell < 10 ? cell : 0);
          const propID = typeof cell === 'object' ? cell.p : (cell >= 10 ? cell : null);

          return (
            <div 
              key={`${x}-${y}`} 
              className="tile"
              style={{
                position: 'absolute',
                left: `calc(${x} * var(--tile-size))`,
                top: `calc(${y} * var(--tile-size))`,
                zIndex: y
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
                const otherIsDead = p.health <= 0;
                return (
                  <div key={p.playerId} className="player-sprite" style={{ zIndex: y * 10 + 11 }}>
                    <HealthBar health={p.health !== undefined ? p.health : 100} />
                    <SpritePlayer 
                      characterId={p.playerId} 
                      direction={p.action || 'abajo'} 
                      isMoving={true} 
                      isDead={otherIsDead} 
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="vision-vignette"></div>
      
      {isDead && (
        <div className="death-overlay">
          <div className="death-message">HAS MUERTO</div>
          <div className="death-subtext">Debe pasar un tiempo de recuperación antes de reintentar</div>
          
          <button 
            className="game-btn lobby-restart-btn is-active"
            onClick={() => onRestart && onRestart()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span>Volver al Menú</span>
              <span className="countdown-timer-red" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Salida automática en: {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
});

export default GameMap;
