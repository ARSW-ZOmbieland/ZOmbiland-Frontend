import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const GameMap = memo(({ matrix, playerPos, playerSprite, otherPlayers = {}, zombies = [], onRestart, onShoot, lastExternalShot, onAimChange, isPaused, mobileShotTrigger, mobileAimAngle, ammo, isSafeZone = false, location = 'world', zoneData = { radius: 50 }, roomMode = 'TRADICIONAL' }) => {
  const [cooldown, setCooldown] = useState(15);
  const aimAngleRef = useRef(0); // High-frequency value in ref to avoid map re-renders
  const weaponImgRef = useRef(null); // Direct DOM ref for the weapon image
  const hoverTileRef = useRef(null); // Direct DOM ref for the highlight box
  const [bullets, setBullets] = useState([]);
  const [flashes, setFlashes] = useState([]);
  const virtualMouse = useRef({ x: 0, y: 0 }); 
  const isLocked = useRef(false);
  const [hitZombies, setHitZombies] = useState(new Set());
  const prevHealthRef = useRef(new Map());

  // FIX: En zona segura (Búnker) nadie puede estar muerto
  const isDead = isSafeZone ? false : (playerSprite.health <= 0);
  const playerHealth = isSafeZone ? 100 : (playerSprite.health || 100);

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
  const handleMouseMove = useCallback((e) => {
    if (isDead || isPaused) return;
    
    // Si el puntero está capturado (Pointer Lock)
    if (document.pointerLockElement) {
        // Actualizamos la posición virtual sumando el movimiento (con fallback a 0)
        const mx = e.movementX || 0;
        const my = e.movementY || 0;
        
        virtualMouse.current.x += mx;
        virtualMouse.current.y += my;
        
        // Mantener el puntero virtual dentro de un rango razonable (ej. 400px de radio)
        const dist = Math.sqrt(virtualMouse.current.x**2 + virtualMouse.current.y**2);
        if (dist > 400 && dist !== 0) {
            const ratio = 400 / dist;
            virtualMouse.current.x *= ratio;
            virtualMouse.current.y *= ratio;
        }
    } else {
        // Modo normal si no está bloqueado
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        virtualMouse.current.x = (e.clientX - rect.left - centerX) || 0;
        virtualMouse.current.y = (e.clientY - rect.top - centerY) || 0;
    }

    let angle = Math.atan2(virtualMouse.current.y, virtualMouse.current.x) * 180 / Math.PI;
    
    // Safety check for NaN or Infinity
    if (!isFinite(angle)) angle = 0;

    aimAngleRef.current = angle;
    
    // Direct DOM update for weapon image (Maximum performance)
    if (weaponImgRef.current) {
        const dir = getWeaponDirection(angle);
        const newSrc = `/assets/weapons/weapon direction/${dir}.png`;
        if (weaponImgRef.current.getAttribute('src') !== newSrc) {
            weaponImgRef.current.src = newSrc;
        }
    }

    if (onAimChange) onAimChange(angle);

    // Actualizar highlight de baldosa si es necesario (sin disparar re-render de todo si no cambia de baldosa)
    const currentA = (angle + 360) % 360;
    let ox = 0, oy = 0;
    if (currentA >= 337.5 || currentA < 22.5) { ox = 1; oy = 0; }
    else if (currentA >= 22.5 && currentA < 67.5) { ox = 1; oy = 1; }
    else if (currentA >= 67.5 && currentA < 112.5) { ox = 0; oy = 1; }
    else if (currentA >= 112.5 && currentA < 157.5) { ox = -1; oy = 1; }
    else if (currentA >= 157.5 && currentA < 202.5) { ox = -1; oy = 0; }
    else if (currentA >= 202.5 && currentA < 247.5) { ox = -1; oy = -1; }
    else if (currentA >= 247.5 && currentA < 292.5) { ox = 0; oy = -1; }
    else if (currentA >= 292.5 && currentA < 337.5) { ox = 1; oy = -1; }

    const nextX = Math.floor(playerPos.x) + ox;
    const nextY = Math.floor(playerPos.y) + oy;

    if (hoverTileRef.current) {
        hoverTileRef.current.style.left = `calc(${nextX} * var(--tile-size))`;
        hoverTileRef.current.style.top = `calc(${nextY} * var(--tile-size))`;
    }
  }, [isDead, isPaused, onAimChange, playerPos.x, playerPos.y]);

  // Sincronizar el ángulo del joystick móvil con el estado interno
  useEffect(() => {
    if (mobileAimAngle !== undefined) {
      aimAngleRef.current = mobileAimAngle;
      if (weaponImgRef.current) {
          const dir = getWeaponDirection(mobileAimAngle);
          weaponImgRef.current.src = `/assets/weapons/weapon direction/${dir}.png`;
      }
    }
  }, [mobileAimAngle]);

  // OPTIMIZADO: Actualizar la baldosa vecina solo cuando el personaje se mueve (La puntería ya se maneja en handleMouseMove)
  useEffect(() => {
    if (isDead || isPaused) return;

    const currentA = (aimAngleRef.current + 360) % 360;
    let ox = 0, oy = 0;
    if (currentA >= 337.5 || currentA < 22.5) { ox = 1; oy = 0; }
    else if (currentA >= 22.5 && currentA < 67.5) { ox = 1; oy = 1; }
    else if (currentA >= 67.5 && currentA < 112.5) { ox = 0; oy = 1; }
    else if (currentA >= 112.5 && currentA < 157.5) { ox = -1; oy = 1; }
    else if (currentA >= 157.5 && currentA < 202.5) { ox = -1; oy = 0; }
    else if (currentA >= 202.5 && currentA < 247.5) { ox = -1; oy = -1; }
    else if (currentA >= 247.5 && currentA < 292.5) { ox = 0; oy = -1; }
    else if (currentA >= 292.5 && currentA < 337.5) { ox = 1; oy = -1; }

    const nextX = Math.floor(playerPos.x) + ox;
    const nextY = Math.floor(playerPos.y) + oy;

    if (hoverTileRef.current) {
        hoverTileRef.current.style.left = `calc(${nextX} * var(--tile-size))`;
        hoverTileRef.current.style.top = `calc(${nextY} * var(--tile-size))`;
    }
  }, [playerPos.x, playerPos.y, isDead, isPaused]);

  // Disparo al hacer clic (Memoizado para rendimiento)
  const executeShot = React.useCallback((input) => {
    if (isDead || isPaused || ammo <= 0) return;
    
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
    }, 400); // Aumentado a 400ms para asegurar visibilidad
    
    setTimeout(() => {
        setFlashes(prev => prev.filter(f => f.id !== flashId));
    }, 200);

    // Notificar al servidor
    if (onShoot) {
        onShoot(targetX, targetY);
    }
  }, [isDead, isPaused, playerPos, onShoot, ammo]);

  // NUEVO: Escuchar disparos desde controles móviles (Con control de duplicados)
  useEffect(() => {
    if (mobileShotTrigger && !isPaused && !isDead) {
      aimAngleRef.current = mobileShotTrigger.angle;
      if (onAimChange) onAimChange(mobileShotTrigger.angle);
      
      // Ejecutar el disparo físico
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
    
    executeShot(aimAngleRef.current);
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
  }, [executeShot, playerPos, isDead, isPaused]);

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
      timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      setCooldown(15);
    }
    return () => clearInterval(timer);
  }, [isDead]);

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

  // Helper de seguridad contra NaN e Infinity para CSS
  const safe = (val, fallback = 0) => (isFinite(val) && val !== null) ? val : fallback;

  // Lógica de Centrado Absoluto en Pantalla con seguridad contra NaN
  const safeX = safe(playerPos.x);
  const safeY = safe(playerPos.y);

  const translateX = `calc(50vw - (${safeX} * var(--tile-size)) - (var(--tile-size) / 2))`;
  const translateY = `calc(50vh - (${safeY} * var(--tile-size)) - (var(--tile-size) / 2))`;

  // --- OPTIMIZATION: Memoize Viewport Calculation ---
  const visibleTiles = useMemo(() => {
    if (!matrix || matrix.length === 0) return [];
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Buffer ampliado para evitar desapariciones en los bordes (15 tiles a la redonda)
    const startX = Math.max(0, Math.floor(safeX - 15));
    const endX = Math.min(cols, Math.floor(safeX + 16));
    const startY = Math.max(0, Math.floor(safeY - 12));
    const endY = Math.min(rows, Math.floor(safeY + 14));

    const tiles = [];
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        tiles.push({ x, y, cell: matrix[y][x] });
      }
    }
    return tiles;
  }, [Math.floor(safeX), Math.floor(safeY), matrix]);


  // Entities are now rendered flatly to prevent DOM recreation when moving across tiles

  const renderFlatEntities = () => {
    const elements = [];

    // 1. Zombies
    if (zombies) {
      zombies.forEach(z => {
        elements.push(
          <div 
            key={`zombie-${z.id}`} 
            className={`player-sprite zombie-sprite ${hitZombies.has(z.id) ? 'zombie-hit-flash' : ''}`} 
            style={{ 
              position: 'absolute', 
              left: `calc(${safe(z.x)} * var(--tile-size))`, 
              top: `calc(${safe(z.y)} * var(--tile-size))`, 
              width: 'var(--tile-size)',
              height: 'var(--tile-size)',
              zIndex: Math.floor(safe(z.y)) * 10 + 11 
            }}
          >
            <SpriteZombie direction={z.direction} isAttacking={z.attacking} type={z.type} />
          </div>
        );
      });
    }

    // 2. Main Player
    const { character, direction, isMoving } = playerSprite;
    elements.push(
      <div 
        key="main-player" 
        className="player-sprite" 
        style={{ 
          position: 'absolute', 
          left: `calc(${safeX} * var(--tile-size))`, 
          top: `calc(${safeY} * var(--tile-size))`, 
          width: 'var(--tile-size)',
          height: 'var(--tile-size)',
          zIndex: Math.floor(safeY) * 10 + 12 
        }}
      >
        <HealthBar health={playerHealth} />
        <SpritePlayer 
          characterId={character} 
          direction={direction} 
          isMoving={isMoving} 
          isDead={isDead} 
        />
        {!isDead && !isPaused && (
          <div className="weapon-aim-indicator-player">
            <img 
              ref={weaponImgRef}
              src={`/assets/weapons/weapon direction/${getWeaponDirection(safe(aimAngleRef.current))}.png`} 
              alt="aim"
              className="weapon-aim-image"
            />
          </div>
        )}
      </div>
    );

    // 3. Other Players
    if (otherPlayers) {
      Object.values(otherPlayers).forEach(p => {
        if (p.location === location) {
          const h = isSafeZone ? 100 : (p.health !== undefined ? p.health : 100);
          const dead = isSafeZone ? false : (h <= 0);
          elements.push(
            <div 
              key={`other-${p.playerId}`} 
              className="player-sprite" 
              style={{ 
                position: 'absolute', 
                left: `calc(${safe(p.x)} * var(--tile-size))`, 
                top: `calc(${safe(p.y)} * var(--tile-size))`, 
                width: 'var(--tile-size)',
                height: 'var(--tile-size)',
                zIndex: Math.floor(safe(p.y)) * 10 + 12 
              }}
            >
              <HealthBar health={h} />
              <SpritePlayer characterId={p.playerId} direction={p.action || 'abajo'} isMoving={p.isMoving !== false} isDead={dead} aimAngle={safe(p.aimAngle)} />
            </div>
          );
        }
      });
    }

    return elements;
  };


  // --- PERFORMANCE FIX: Memoize Static Layers ---
  const groundLayer = useMemo(() => (
    <div className="ground-layer" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {visibleTiles.map(({ x, y, cell }) => {
            const groundID = typeof cell === 'object' ? cell.g : (cell < 10 ? cell : 0);
            return (
                <div 
                    key={`ground-${x}-${y}`} 
                    className="tile ground-tile" 
                    style={{ 
                        position: 'absolute', 
                        left: `calc(${x} * var(--tile-size))`, 
                        top: `calc(${y} * var(--tile-size))`, 
                        zIndex: 1 
                    }}
                >
                    <img src={GROUND_ASSETS[groundID] || GROUND_ASSETS[0]} alt="ground" className="tile-image" />
                </div>
            );
        })}
    </div>
  ), [visibleTiles]);

  const propsLayer = useMemo(() => (
    <div className="props-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {visibleTiles.map(({ x, y, cell }) => {
            const propID = typeof cell === 'object' ? cell.p : (cell >= 10 && cell !== 99 ? cell : null);
            const isHovered = !isDead && !isPaused && hoveredTile && hoveredTile.x === x && hoveredTile.y === y;
            if (!propID && !isHovered) return null;

            return (
                <div 
                    key={`prop-${x}-${y}`} 
                    style={{ 
                        position: 'absolute', 
                        left: `calc(${x} * var(--tile-size))`, 
                        top: `calc(${y} * var(--tile-size))`, 
                        width: 'var(--tile-size)',
                        height: 'var(--tile-size)',
                        zIndex: y * 10 + 5 
                    }}
                >
                    {propID && propID !== 99 && !(roomMode === 'TORNEO' && propID === 40 && location === 'world') && (
                        <img 
                            src={PROP_ASSETS[propID]} 
                            alt="prop" 
                            className={`tile-image ${propID >= 20 && propID <= 22 ? 'bush-prop' : ''} ${propID >= 30 && propID <= 34 ? 'tree-prop' : ''} ${propID >= 40 && propID <= 49 ? 'bunker-prop' : ''} ${propID >= 50 && propID <= 59 ? 'forest-prop' : ''} ${propID >= 60 && propID <= 69 ? 'city-building' : ''} ${propID >= 70 && propID <= 89 && propID !== 72 ? 'urban-prop' : ''} ${propID === 72 ? 'street-light-prop' : ''} ${propID === 90 ? 'barricade-prop' : ''} ${(propID === 100 || propID === 101) ? 'item-pickup-prop' : ''}`} 
                            style={{ 
                                position: 'absolute', 
                                zIndex: 1, 
                                top: 0, 
                                left: 0,
                                opacity: (propID >= 40 && propID <= 49 && Math.floor(safeX) === x && Math.floor(safeY) === y) ? 0 : 1 
                            }} 
                        />
                    )}
                </div>
            );
        })}
    </div>
  ), [visibleTiles, isDead, isPaused, roomMode, location, Math.floor(safeX), Math.floor(safeY)]);

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
          position: 'relative',
          willChange: 'transform'
        }}
      >
        {/* Layer 1: Ground (Optimized Static Render) */}
        {groundLayer}

        {/* Layer 2: Props (Dynamic Z-indexing) */}
        {propsLayer}

        {/* --- PERFORMANCE FIX: STANDALONE HIGHLIGHT LAYER --- */}
        <div 
          ref={hoverTileRef}
          className="tile-hover-highlight" 
          style={{ 
            position: 'absolute',
            width: 'var(--tile-size)',
            height: 'var(--tile-size)',
            zIndex: 20,
            pointerEvents: 'none',
            display: (isDead || isPaused) ? 'none' : 'block'
          }} 
        />
        
        {/* Layer 3: Entities (Dynamic Flat Render) */}
        <div className="entities-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {renderFlatEntities()}
        </div>
        {/* --- PERFORMANCE FIX: INDEPENDENT BULLET LAYER --- */}
        <div className="bullet-overlay-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }}>
            {bullets.map(b => (
              <div 
                key={b.id} 
                className="bullet-projectile"
                style={{
                    position: 'absolute',
                    left: `calc(${safe(b.startX) + 0.5} * var(--tile-size))`, 
                    top: `calc(${safe(b.startY) + 0.5} * var(--tile-size))`,
                    '--tx': (safe(b.endX) - safe(b.startX)) * 1,
                    '--ty': (safe(b.endY) - safe(b.startY)) * 1
                }}
              />
            ))}
            {flashes.map(f => (
              <div 
                key={f.id}
                className="muzzle-flash"
                style={{
                  position: 'absolute',
                  left: `calc(${(safe(f.x || safeX)) + 0.5} * var(--tile-size))`,
                  top: `calc(${(safe(f.y || safeY)) + 0.5} * var(--tile-size))`,
                  transform: `translate(-50%, -50%) rotate(${safe(f.angle !== undefined ? f.angle : aimAngleRef.current)}deg) translate(25px, 0)`
                }}
              />
            ))}
        </div>

        {/* --- TOURNAMENT ZONE LAYER --- */}
        {roomMode === 'TORNEO' && location === 'world' && (
            <div className="zone-overlay-layer" style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: 900,
                pointerEvents: 'none'
            }}>
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                        <mask id="zone-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <circle 
                                cx={`calc(32.5 * var(--tile-size))`} 
                                cy={`calc(32.5 * var(--tile-size))`} 
                                r={`calc(${safe(zoneData.radius, 50)} * var(--tile-size))`} 
                                fill="black" 
                            />
                        </mask>
                    </defs>
                    {/* Dark overlay outside the safe zone */}
                    <rect 
                        width="100%" 
                        height="100%" 
                        fill="rgba(255, 0, 0, 0.2)" 
                        mask="url(#zone-mask)"
                    />
                    {/* The glowing border of the zone */}
                    <circle 
                        cx={`calc(32.5 * var(--tile-size))`} 
                        cy={`calc(32.5 * var(--tile-size))`} 
                        r={`calc(${safe(zoneData.radius, 50)} * var(--tile-size))`} 
                        fill="none" 
                        stroke="rgba(255, 0, 0, 0.8)" 
                        strokeWidth="10"
                        style={{ filter: 'blur(4px)', transition: 'r 0.5s ease-out' }}
                    />
                    <circle 
                        cx={`calc(32.5 * var(--tile-size))`} 
                        cy={`calc(32.5 * var(--tile-size))`} 
                        r={`calc(${safe(zoneData.radius, 50)} * var(--tile-size))`} 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2"
                        style={{ transition: 'r 0.5s ease-out' }}
                    />
                </svg>
            </div>
        )}
        <div className="vision-vignette"></div>
      </div>
      
      {isDead && (
        <div className="death-overlay">
          <div className="death-message pop-in">HAS MUERTO</div>
          
          {roomMode === 'TORNEO' ? (
            <div className="eliminated-box fade-in">
              <h2 className="text-danger">ELIMINADO</h2>
              <p>No puedes reaparecer en modo Torneo.</p>
              <p>Espera a que termine la partida para ver los resultados.</p>
            </div>
          ) : (
            <div className="lobby-restart-btn">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <span>REAPARECIENDO EN</span>
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {cooldown}s
                </span>
              </div>
            </div>
          )}
          
          {roomMode !== 'TORNEO' && (
            <p style={{ color: '#ccc', marginTop: '20px', fontSize: '0.9rem' }}>
              Aparecerás en un lugar aleatorio del mapa.
            </p>
          )}

        </div>
      )}
    </div>
  );
});

export default GameMap;
