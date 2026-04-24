import React, { memo, useState, useEffect, useRef } from 'react';
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

const GameMap = memo(({ matrix, playerPos, playerSprite, otherPlayers = {}, zombies = [], onRestart, onShoot, lastExternalShot, onAimChange, isPaused, mobileShotTrigger }) => {
  const [cooldown, setCooldown] = useState(90);
  const [aimAngle, setAimAngle] = useState(0);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [bullets, setBullets] = useState([]);
  const [flashes, setFlashes] = useState([]);
  const virtualMouse = useRef({ x: 0, y: 0 }); // Posición virtual para el modo capturado
  const isLocked = useRef(false);
  const [hitZombies, setHitZombies] = useState(new Set());
  const prevHealthRef = React.useRef(new Map());
  const isDead = playerSprite.health <= 0;

  // Efecto visual de "Flash" al recibir daño (Transient)
  useEffect(() => {
    const newHits = new Set();
    zombies.forEach(z => {
      const prevHealth = prevHealthRef.current.get(z.id) || 100;
      if (z.health < prevHealth) {
        newHits.add(z.id);
      }
      prevHealthRef.current.set(z.id, z.health);
    });

    if (newHits.size > 0) {
      setHitZombies(prev => {
        const next = new Set(prev);
        newHits.forEach(id => next.add(id));
        return next;
      });

      // Limpiar el flash después de 300ms
      setTimeout(() => {
        setHitZombies(prev => {
          const next = new Set(prev);
          newHits.forEach(id => next.delete(id));
          return next;
        });
      }, 300);
    }
  }, [zombies]);
  // Seguimiento del Mouse para apuntar (Relativo + Absoluto)
  const handleMouseMove = React.useCallback((e) => {
    if (isDead || isPaused) return;
    
    // Si el puntero está capturado (Pointer Lock)
    if (document.pointerLockElement) {
        // Actualizamos la posición virtual sumando el movimiento
        virtualMouse.current.x += e.movementX;
        virtualMouse.current.y += e.movementY;
        
        // Mantener el puntero virtual dentro de un rango razonable (ej. 400px de radio)
        const dist = Math.sqrt(virtualMouse.current.x**2 + virtualMouse.current.y**2);
        if (dist > 400) {
            const ratio = 400 / dist;
            virtualMouse.current.x *= ratio;
            virtualMouse.current.y *= ratio;
        }
    } else {
        // Modo normal si no está bloqueado (aunque el usuario quiere bloqueo siempre)
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        virtualMouse.current.x = e.clientX - rect.left - centerX;
        virtualMouse.current.y = e.clientY - rect.top - centerY;
    }

    const angle = Math.atan2(virtualMouse.current.y, virtualMouse.current.x) * 180 / Math.PI;
    setAimAngle(angle);
    if (onAimChange) onAimChange(angle);
  }, [isDead, isPaused, onAimChange]);

  // NUEVO: Efecto reactivo para actualizar la baldosa vecina (hoveredTile) cuando el personaje se mueva o cambie el ángulo
  useEffect(() => {
    if (isDead || isPaused) return;

    // Calcular la baldosa vecina EXACTAMENTE con la misma lógica de 45 grados
    const a = (aimAngle + 360) % 360;
    let ox = 0, oy = 0;
    
    if (a >= 337.5 || a < 22.5) { ox = 1; oy = 0; }
    else if (a >= 22.5 && a < 67.5) { ox = 1; oy = 1; }
    else if (a >= 67.5 && a < 112.5) { ox = 0; oy = 1; }
    else if (a >= 112.5 && a < 157.5) { ox = -1; oy = 1; }
    else if (a >= 157.5 && a < 202.5) { ox = -1; oy = 0; }
    else if (a >= 202.5 && a < 247.5) { ox = -1; oy = -1; }
    else if (a >= 247.5 && a < 292.5) { ox = 0; oy = -1; }
    else if (a >= 292.5 && a < 337.5) { ox = 1; oy = -1; }

    setHoveredTile({
      x: Math.floor(playerPos.x) + ox,
      y: Math.floor(playerPos.y) + oy
    });
  }, [aimAngle, playerPos.x, playerPos.y, isDead, isPaused]);

  // Disparo al hacer clic (Memoizado para rendimiento)
  const executeShot = React.useCallback((input) => {
    if (isDead || isPaused) return;
    
    let angle;
    if (typeof input === 'number') {
        angle = input;
    } else {
        // Soporte para backward compatibility o casos específicos
        const dx = input.x - playerPos.x;
        const dy = input.y - playerPos.y;
        angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // Sincronizar con el ángulo que usa la pistola visual
    const a = (angle + 360) % 360;
    let snappedAngle;
    if (a >= 337.5 || a < 22.5) snappedAngle = 0;
    else if (a >= 22.5 && a < 67.5) snappedAngle = Math.PI / 4;
    else if (a >= 67.5 && a < 112.5) snappedAngle = Math.PI / 2;
    else if (a >= 112.5 && a < 157.5) snappedAngle = 3 * Math.PI / 4;
    else if (a >= 157.5 && a < 202.5) snappedAngle = Math.PI;
    else if (a >= 202.5 && a < 247.5) snappedAngle = -3 * Math.PI / 4;
    else if (a >= 247.5 && a < 292.5) snappedAngle = -Math.PI / 2;
    else if (a >= 292.5 && a < 337.5) snappedAngle = -Math.PI / 4;
    else snappedAngle = 0;
    
    // El destino es la dirección del clic pero SIEMPRE a RANGO MÁXIMO (6.0)
    const targetX = playerPos.x + Math.cos(snappedAngle) * 6.0;
    const targetY = playerPos.y + Math.sin(snappedAngle) * 6.0;

    // Crear bala visual
    const bulletId = Date.now();
    const newBullet = { 
        id: bulletId, 
        startX: playerPos.x, 
        startY: playerPos.y, 
        endX: targetX, 
        endY: targetY 
    };
    
    setBullets(prev => [...prev.slice(-10), newBullet]);
    
    // Muzzle Flash
    const flashId = Date.now() + 1;
    const flashAngleDeg = snappedAngle * (180 / Math.PI);
    setFlashes(prev => [...prev.slice(-10), { id: flashId, x: playerPos.x, y: playerPos.y, angle: flashAngleDeg }]);
    
    setTimeout(() => {
        setBullets(prev => prev.filter(b => b.id !== bulletId));
    }, 200);
    
    setTimeout(() => {
        setFlashes(prev => prev.filter(f => f.id !== flashId));
    }, 100);

    // Notificar al servidor
    if (onShoot) {
        onShoot(targetX, targetY);
    }
  }, [isDead, isPaused, playerPos, onShoot]);

  // NUEVO: Escuchar disparos desde controles móviles (Después de definir executeShot)
  useEffect(() => {
    if (mobileShotTrigger && !isPaused && !isDead) {
      setAimAngle(mobileShotTrigger.angle);
      if (onAimChange) onAimChange(mobileShotTrigger.angle);
      executeShot(mobileShotTrigger.angle);
    }
  }, [mobileShotTrigger, isPaused, isDead, executeShot, onAimChange]);

  const handleMouseDown = (e) => {
    if (isDead || !onRestart) return;
    
    // Solicitar Pointer Lock al presionar el ratón (Más fiable que click)
    const viewport = e.currentTarget;
    if (!isPaused && viewport.requestPointerLock) {
        viewport.requestPointerLock();
    }
    
    executeShot(aimAngle);
  };

  // --- NUEVA LÓGICA DE DISPARO POR TECLADO NUMÉRICO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (isDead || isPaused) return;
        
        const key = e.key;
        let dx = 0, dy = 0;
        
        // Mapeo Numpad (8 direcciones)
        switch (key) {
            case '8': case 'Numpad8': dy = -1; break; // Arriba
            case '2': case 'Numpad2': dy = 1; break;  // Abajo
            case '4': case 'Numpad4': dx = -1; break; // Izquierda
            case '6': case 'Numpad6': dx = 1; break;  // Derecha
            case '7': case 'Numpad7': dx = -1; dy = -1; break; // Diagonal UL
            case '9': case 'Numpad9': dx = 1; dy = -1; break;  // Diagonal UR
            case '1': case 'Numpad1': dx = -1; dy = 1; break;  // Diagonal DL
            case '3': case 'Numpad3': dx = 1; dy = 1; break;   // Diagonal DR
            default: return; // Ignorar otras teclas
        }
        
        // El disparo por teclado usa coordenadas, lo convertimos a ángulo
        executeShot({ x: playerPos.x + dx * 6, y: playerPos.y + dy * 6 });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeShot, playerPos, isDead, isPaused, aimAngle]);

  // Manejar cambios en el estado de Pointer Lock y Liberación por Pausa
  useEffect(() => {
    const handleLockChange = () => {
        isLocked.current = !!document.pointerLockElement;
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    
    // Si se pausa o muere, liberar el puntero automáticamente
    if ((isPaused || isDead) && document.pointerLockElement) {
        document.exitPointerLock();
    }

    return () => {
        document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, [isPaused, isDead]);

  useEffect(() => {
    if (lastExternalShot && lastExternalShot.playerId !== playerSprite.character) {
        const bulletId = lastExternalShot.id;
        
        setBullets(prev => [...prev.slice(-10), {
            id: bulletId,
            startX: lastExternalShot.x,
            startY: lastExternalShot.y,
            endX: lastExternalShot.targetX,
            endY: lastExternalShot.targetY
        }]);
        
        // Remote flash calculations
        const flashId = bulletId + "_flash";
        const rAngle = Math.atan2(lastExternalShot.targetY - lastExternalShot.y, lastExternalShot.targetX - lastExternalShot.x) * 180 / Math.PI;
        
        setFlashes(prev => [...prev.slice(-10), { id: flashId, x: lastExternalShot.x, y: lastExternalShot.y, angle: rAngle }]);
        
        setTimeout(() => setBullets(prev => prev.filter(b => b.id !== bulletId)), 200);
        setTimeout(() => setFlashes(prev => prev.filter(f => f.id !== flashId)), 100);
    }
  }, [lastExternalShot, playerSprite.character]);

  useEffect(() => {
    let timer;
    if (isDead) {
      if (cooldown > 0) {
        timer = setInterval(() => {
          setCooldown(prev => Math.max(0, prev - 1));
        }, 1000);
      } else {
        if (onRestart) onRestart();
      }
    }
    return () => clearInterval(timer);
  }, [isDead, cooldown, onRestart]);

  // Helper para obtener la imagen de la pistola según el ángulo
  const getWeaponDirection = (angle) => {
    const a = (angle + 360) % 360; // Normalizar a [0, 360)
    if (a >= 337.5 || a < 22.5) return 'derecha';
    if (a >= 22.5 && a < 67.5) return 'abajo_derecha';
    if (a >= 67.5 && a < 112.5) return 'abajo';
    if (a >= 112.5 && a < 157.5) return 'abajo_izquierda';
    if (a >= 157.5 && a < 202.5) return 'izquierda';
    if (a >= 202.5 && a < 247.5) return 'arriba_izquierda';
    if (a >= 247.5 && a < 292.5) return 'arriba';
    if (a >= 292.5 && a < 337.5) return 'arriba_derecha';
    return 'derecha';
  };

  if (!matrix || matrix.length === 0 || !playerPos) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;
  const centerXValue = Math.floor(VIEWPORT_TILES / 2);
  const centerYValue = Math.floor(VIEWPORT_TILES / 2);

  // Lógica de Centrado Absoluto en Pantalla
  const translateX = `calc(50vw - (${playerPos.x} * var(--tile-size)) - (var(--tile-size) / 2))`;
  const translateY = `calc(50vh - (${playerPos.y} * var(--tile-size)) - (var(--tile-size) / 2))`;

  // Buffer de renderizado más amplio para evitar bordes cortados en pantallas panorámicas (20 tiles de radio)
  const startX = Math.max(0, Math.floor(playerPos.x - 20));
  const endX = Math.min(cols, Math.floor(playerPos.x + 21));
  const startY = Math.max(0, Math.floor(playerPos.y - 15));
  const endY = Math.min(rows, Math.floor(playerPos.y + 16));

  // --- PERFORMANCE FIX: PRE-INDEX ENTITIES BY POSITION ---
  const entityMap = React.useMemo(() => {
    const map = new Map();
    
    // Index Zombies
    if (zombies) {
      zombies.forEach(z => {
        const key = `${Math.floor(z.x)}-${Math.floor(z.y)}`;
        if (!map.has(key)) map.set(key, { zombies: [], players: [] });
        map.get(key).zombies.push(z);
      });
    }

    // Index Other Players
    if (otherPlayers) {
      Object.values(otherPlayers).forEach(p => {
        const key = `${Math.floor(p.x)}-${Math.floor(p.y)}`;
        if (!map.has(key)) map.set(key, { zombies: [], players: [] });
        map.get(key).players.push(p);
      });
    }
    
    return map;
  }, [zombies, otherPlayers]);

  const renderCellEntities = (x, y) => {
    const key = `${x}-${y}`;
    const cellEntities = entityMap.get(key);
    const elements = [];

    // 1. Zombies
    if (cellEntities && cellEntities.zombies.length > 0) {
      cellEntities.zombies.forEach(z => {
        elements.push(
          <div key={`zombie-${z.id}`} className={`player-sprite zombie-sprite ${hitZombies.has(z.id) ? 'zombie-hit-flash' : ''}`} style={{ zIndex: y * 10 + 11 }}>
            <SpriteZombie direction={z.direction} isAttacking={z.attacking} />
          </div>
        );
      });
    }

    // 2. Main Player
    if (Math.floor(playerPos.x) === x && Math.floor(playerPos.y) === y) {
      const { character, direction, isMoving, health } = playerSprite;
      elements.push(
        <div key="main-player" className="player-sprite" style={{ zIndex: y * 10 + 12 }}>
          <HealthBar health={health || 100} />
          <SpritePlayer 
            characterId={character} 
            direction={direction} 
            isMoving={isMoving} 
            isDead={isDead} 
            aimAngle={aimAngle}
          />
        </div>
      );
    }

    // 3. Other Players
    if (cellEntities && cellEntities.players.length > 0) {
      cellEntities.players.forEach(p => {
        elements.push(
          <div key={`other-${p.playerId}`} className="player-sprite" style={{ zIndex: y * 10 + 12 }}>
            <HealthBar health={p.health !== undefined ? p.health : 100} />
            <SpritePlayer characterId={p.playerId} direction={p.action || 'abajo'} isMoving={true} isDead={p.health <= 0} aimAngle={p.aimAngle || 0} />
          </div>
        );
      });
    }

    return elements;
  };

  const visibleTiles = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      visibleTiles.push({ x, y, cell: matrix[y][x] });
    }
  }

  return (
    <div 
      className="game-viewport" 
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'crosshair' }}
    >
      <div 
        className={`game-map-container ${isDead ? 'is-dead' : ''}`} 
        style={{ 
          width: `calc(${cols} * var(--tile-size))`,
          height: `calc(${rows} * var(--tile-size))`,
          transform: `translate(${translateX}, ${translateY})`,
          position: 'relative'
        }}
      >
        {/* Pass 1: Unified Map Render (Ground + Props + Entities + Aim) */}
        {visibleTiles.map(({ x, y, cell }) => {
          const groundID = typeof cell === 'object' ? cell.g : (cell < 10 ? cell : 0);
          const propID = typeof cell === 'object' ? cell.p : (cell >= 10 && cell !== 99 ? cell : null);
          const isHovered = !isDead && !isPaused && hoveredTile && hoveredTile.x === x && hoveredTile.y === y;
          
          return (
            <React.Fragment key={`tile-group-${x}-${y}`}>
              {/* Ground */}
              <div className="tile ground-tile" style={{ position: 'absolute', left: `calc(${x} * var(--tile-size))`, top: `calc(${y} * var(--tile-size))`, zIndex: 1 }}>
                <img src={GROUND_ASSETS[groundID] || GROUND_ASSETS[0]} alt="ground" className="tile-image" />
              </div>
              
              {/* Entities and Props */}
              <div className="entity-tile" style={{ position: 'absolute', left: `calc(${x} * var(--tile-size))`, top: `calc(${y} * var(--tile-size))`, zIndex: y * 10 + 5, pointerEvents: 'none' }}>
                {propID && propID !== 99 && (
                  <img src={PROP_ASSETS[propID]} alt="prop" className={`tile-image ${propID >= 20 && propID <= 22 ? 'bush-prop' : ''} ${propID >= 30 && propID <= 34 ? 'tree-prop' : ''} ${propID >= 40 && propID <= 49 ? 'bunker-prop' : ''} ${propID >= 50 && propID <= 59 ? 'forest-prop' : ''} ${propID >= 60 && propID <= 69 ? 'city-building' : ''} ${propID >= 70 && propID <= 89 && propID !== 72 ? 'urban-prop' : ''} ${propID === 72 ? 'street-light-prop' : ''} ${propID === 90 ? 'barricade-prop' : ''}`} style={{ position: 'absolute', zIndex: 1, top: 0, left: 0 }} />
                )}
                {renderCellEntities(x, y)}
              </div>

              {/* Aim Layer */}
              {isHovered && (
                <div style={{ position: 'absolute', left: `calc(${x} * var(--tile-size))`, top: `calc(${y} * var(--tile-size))`, zIndex: y * 10 + 20 }}>
                  <div className="weapon-aim-indicator">
                    <img 
                      src={`/assets/weapons/weapon direction/${getWeaponDirection(aimAngle)}.png`} 
                      alt="aim"
                      className="weapon-aim-image"
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* --- PERFORMANCE FIX: INDEPENDENT BULLET LAYER --- */}
        <div className="bullet-overlay-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }}>
            {bullets.map(b => (
              <div 
                key={b.id} 
                className="bullet-projectile"
                style={{
                    position: 'absolute',
                    left: `calc(${b.startX + 0.5} * var(--tile-size))`, // Center logic
                    top: `calc(${b.startY + 0.5} * var(--tile-size))`,
                    '--tx': (b.endX - b.startX) * 1, // Normalized to tile units
                    '--ty': (b.endY - b.startY) * 1
                }}
              />
            ))}
            {flashes.map(f => (
              <div 
                key={f.id}
                className="muzzle-flash"
                style={{
                  position: 'absolute',
                  left: `calc(${(f.x || playerPos.x) + 0.5} * var(--tile-size))`,
                  top: `calc(${(f.y || playerPos.y) + 0.5} * var(--tile-size))`,
                  transform: `translate(-50%, -50%) rotate(${f.angle !== undefined ? f.angle : aimAngle}deg) translate(25px, 0)`
                }}
              />
            ))}
        </div>
      </div>
      <div className="vision-vignette"></div>
      
      {isDead && (
        <div className="death-overlay">
          <div className="death-message">HAS MUERTO</div>
          <button className="game-btn lobby-restart-btn is-active" onClick={() => onRestart && onRestart()}>
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
