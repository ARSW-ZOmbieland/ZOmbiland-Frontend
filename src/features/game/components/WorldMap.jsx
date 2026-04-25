import React, { useState, useEffect, useCallback } from 'react';
import GameMap from './GameMap';
import TouchControls from './TouchControls';
import { TILE_TYPES } from '../../../core/GameEngine';
import { usePlayerMovement } from '../../../hooks/usePlayerMovement';
import { API_BASE_URL } from '../../../config/constants';
import webSocketService from '../../../core/WebSocketService';
// IA local elinidada para usar Sincronización de Servidor

const WorldMap = ({ onExit, character, roomCode, onRestart, isPaused, onPauseSync }) => {
  const [mapData, setMapData] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [zombies, setZombies] = useState([]);
  const [health, setHealth] = useState(100);
  const [lastExternalShot, setLastExternalShot] = useState(null);
  const [myAimAngle, setMyAimAngle] = useState(0);

  // Asset Preloading: Force browser to cache all GIFs at once
  useEffect(() => {
    const characters = ['andres', 'juanpablo', 'maria', 'tomas'];
    const directions = ['abajo', 'arriba', 'derecha', 'izquierda'];
    
    characters.forEach(charId => {
      directions.forEach(dir => {
        const img = new Image();
        img.src = `/personajes/${charId}/${dir}.gif`;
      });
      // Also idle
      const idle = new Image();
      idle.src = `/personajes/${charId}/no-seleccion.png`;
    });

    // Zombie preloading
    const zombieStates = [
        'abajo', 'arriba', 'derecha', 'izquierda',
        'ataque_adelante', 'ataque_atras', 'ataque_derecha', 'ataque_izquierda', 'ataque'
    ];
    zombieStates.forEach(state => {
        const img = new Image();
        img.src = `/zombies/comun/${state}.gif`;
    });
    
    console.log(">> Preloading assets for better performance (Players & Zombies)...");
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    
    // Configurar WebSockets para la sala
    webSocketService.connect(() => {
        // Obtenemos el mapa
        fetch(`${API_BASE_URL}/api/game/rooms/${roomCode}/map`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            setMapData(data);
            
            // Avisar que entramos al mapa con la posición de inicio
            webSocketService.sendMessage('/app/game.join', {
                playerId: character,
                roomCode: roomCode,
                x: data.startX,
                y: data.startY,
                action: 'abajo',
                health: 100
            });
        })
        .catch(err => console.error("Error fetching map", err));

        // Suscribirse a los movimientos y estados (incluyendo vida)
        const topic = `/topic/game.state.${roomCode}`;
        webSocketService.subscribe(topic, (message) => {
            if (message.action === 'PAUSE') {
                if (onPauseSync) onPauseSync(true);
                return;
            }
            if (message.action === 'RESUME') {
                if (onPauseSync) onPauseSync(false);
                return;
            }

            if (message.playerId === character) {
                // Actualizar vida propia desde el servidor
                if (message.health !== undefined) {
                    setHealth(message.health);
                }
            } else if (message.playerId) {
                // Si es un ataque externo, capturamos el evento para visualizarlo
                if (message.action === 'ATTACK') {
                    setLastExternalShot({
                        id: Date.now() + Math.random(),
                        ...message
                    });
                }
                
                setOtherPlayers(prev => ({
                    ...prev,
                    [message.playerId]: { ...prev[message.playerId], ...message }
                }));
            }
        });

        // Suscribirse a los zombies del servidor (Cada 0.5s)
        const zombieTopic = `/topic/game.zombies.${roomCode}`;
        webSocketService.subscribe(zombieTopic, (zombieList) => {
            if (Array.isArray(zombieList)) {
                setZombies(zombieList);
            }
        });

        // Suscribirse a actualizaciones del mapa (Ej: medkits recogidos)
        const mapUpdateTopic = `/topic/game.map.${roomCode}`;
        webSocketService.subscribe(mapUpdateTopic, (update) => {
            if (update && update.x !== undefined && update.y !== undefined) {
                setMapData(prev => {
                    if (!prev || !prev.matrix) return prev;
                    const newMatrix = [...prev.matrix];
                    newMatrix[update.y] = [...newMatrix[update.y]];
                    newMatrix[update.y][update.x] = update.tile;
                    return { ...prev, matrix: newMatrix };
                });
            }
        });

        // Sincronizar estado inicial de la sala para ver a quienes ya estaban quietos
        fetch(`${API_BASE_URL}/api/game/rooms/${roomCode}/state`, { credentials: 'include' })
        .then(res => res.json())
        .then(playersInfo => {
            if (Array.isArray(playersInfo)) {
                setOtherPlayers(prev => {
                const newState = { ...prev };
                playersInfo.forEach(p => {
                    if (p.playerId !== character) newState[p.playerId] = p;
                });
                return newState;
                });
            }
        })
        .catch(err => console.error(err));
    });

    return () => {
        webSocketService.disconnect();
    }

  }, [character, roomCode]);

  // Collisions
  const handleCollideSpecial = useCallback((x, y, cell) => {
    const cellID = typeof cell === 'object' ? cell.p : cell;
    if (cellID === TILE_TYPES.BUNKER_DOOR) {
      if (mapData && (x !== mapData.startX || y !== mapData.startY)) {
        onExit();
      }
    }
  }, [onExit, mapData]);

  const { playerPos, playerState, setPlayerPos, handleManualMove } = usePlayerMovement(
    { x: 1, y: 1 }, 
    character, 
    mapData ? mapData.matrix : [[0]], 
    handleCollideSpecial,
    roomCode,
    otherPlayers,
    health,
    isPaused
  );

  // IA local del zombie eliminada (ahora se maneja vía WebSocket arriba)

  // Update position once map is loaded
  useEffect(() => {
      if (mapData && setPlayerPos) {
          setPlayerPos({ x: mapData.startX, y: mapData.startY });
      }
  }, [mapData, setPlayerPos]);
 
  // Broadcast de Puntería (Aim Angle) - Throttled a 10Hz
  useEffect(() => {
    if (!roomCode || health <= 0) return;
    
    let lastSentAngle = -999;
    const interval = setInterval(() => {
        // Obtenemos el ángulo actual desde el componente a través de window (hack rápido y eficiente)
        const currentAngle = window.currentAimAngle || 0;
        
        if (Math.abs(currentAngle - lastSentAngle) > 2) { // Variación mínima para enviar
            webSocketService.sendMessage('/app/game.action', {
                playerId: character,
                roomCode: roomCode,
                x: playerPos.x,
                y: playerPos.y,
                aimAngle: currentAngle,
                action: playerState.direction, // Mantener dirección actual
                health: health
            });
            lastSentAngle = currentAngle;
        }
    }, 100); // 100ms = 10Hz
    
    return () => clearInterval(interval);
  }, [roomCode, character, playerPos, playerState.direction, health]);


  // Combat Handling
  const handleShoot = useCallback((targetX, targetY) => {
    if (health <= 0) return;
    
    webSocketService.sendMessage('/app/game.action', {
        playerId: character,
        roomCode: roomCode,
        x: playerPos.x,
        y: playerPos.y,
        targetX: targetX,
        targetY: targetY,
        action: 'ATTACK',
        health: health
    });
  }, [character, roomCode, playerPos, health]);

  const [mobileShotTrigger, setMobileShotTrigger] = useState(null);

  const handleMobileShoot = useCallback((angle) => {
    setMobileShotTrigger({ angle, timestamp: Date.now() });
  }, []);

  if (!mapData) {
    return <div style={{ color: '#32CD32', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', backgroundColor: '#000', fontSize: '2rem' }}>Generando mapa aleatorio...</div>;
  }

  return (
    <div className="game-view-cinematic" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%', 
      width: '100%',
      backgroundColor: '#000',
      position: 'relative'
    }}>
      <GameMap 
        matrix={mapData.matrix} 
        playerPos={playerPos} 
        playerSprite={{
          character,
          direction: playerState.direction,
          isMoving: playerState.isMoving,
          health: health
        }}
        otherPlayers={otherPlayers}
        zombies={zombies}
        onRestart={onRestart}
        onShoot={handleShoot}
        lastExternalShot={lastExternalShot}
        onAimChange={(angle) => { window.currentAimAngle = angle; }}
        isPaused={isPaused}
        mobileShotTrigger={mobileShotTrigger}
      />
      
      <TouchControls 
        onMove={handleManualMove} 
        onShoot={handleMobileShoot}
        onAimChange={(angle) => { window.currentAimAngle = angle; }}
      />
    </div>
  );
};

export default WorldMap;
