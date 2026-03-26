import React, { useState, useEffect, useCallback } from 'react';
import GameMap from './GameMap';
import TouchControls from './TouchControls';
import { TILE_TYPES } from '../../../core/GameEngine';
import { usePlayerMovement } from '../../../hooks/usePlayerMovement';
import { API_BASE_URL } from '../../../config/constants';
import webSocketService from '../../../core/WebSocketService';

const WorldMap = ({ onExit, character, roomCode }) => {
  const [mapData, setMapData] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState({});

  useEffect(() => {
    if (!roomCode) return;
    
    // Configurar WebSockets para la sala
    webSocketService.connect(() => {
        // Obtenemos el mapa
        fetch(`${API_BASE_URL}/api/game/rooms/${roomCode}/map`)
        .then(res => res.json())
        .then(data => {
            setMapData(data);
            
            // Avisar que entramos al mapa con la posición de inicio
            webSocketService.sendMessage('/app/game.join', {
                playerId: character,
                roomCode: roomCode,
                x: data.startX,
                y: data.startY,
                action: 'abajo'
            });
        })
        .catch(err => console.error("Error fetching map", err));

        // Suscribirse a los movimientos
        const topic = `/topic/game.state.${roomCode}`;
        webSocketService.subscribe(topic, (message) => {
            if (message.playerId && message.playerId !== character) {
                setOtherPlayers(prev => ({
                ...prev,
                [message.playerId]: message
                }));
            }
        });

        // Sincronizar estado inicial
        fetch(`${API_BASE_URL}/api/game/rooms/${roomCode}/state`)
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
    otherPlayers
  );

  // Update position once map is loaded
  useEffect(() => {
      if (mapData && setPlayerPos) {
          setPlayerPos({ x: mapData.startX, y: mapData.startY });
      }
  }, [mapData, setPlayerPos]);


  if (!mapData) {
    return <div style={{ color: '#32CD32', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', backgroundColor: '#000', fontSize: '2rem' }}>Generando mapa aleatorio...</div>;
  }

  return (
    <div className="game-view-cinematic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#000' }}>
      <GameMap 
        matrix={mapData.matrix} 
        playerPos={playerPos} 
        playerSprite={{
          character,
          direction: playerState.direction,
          isMoving: playerState.isMoving
        }}
        otherPlayers={otherPlayers}
      />
      <TouchControls onMove={handleManualMove} />
    </div>
  );
};

export default WorldMap;
