import React, { useState, useEffect, useCallback } from 'react';
import GameMap from './GameMap';
import TouchControls from './TouchControls';
import { INITIAL_BUNKER_MATRIX, TILE_TYPES } from '../../../core/GameEngine';
import { usePlayerMovement } from '../../../hooks/usePlayerMovement';
import { API_BASE_URL } from '../../../config/constants';
import webSocketService from '../../../core/WebSocketService';

const SPAWN_POINTS = {
  andres: { x: 1, y: 1 },     // Top-Left
  juanpablo: { x: 8, y: 1 },  // Top-Right
  maria: { x: 1, y: 8 },      // Bottom-Left
  tomas: { x: 8, y: 8 }       // Bottom-Right
};

const BunkerRoom = ({ onTeleport, character, roomCode, onRestart, isPaused, onPauseSync }) => {
  const [matrix] = useState(INITIAL_BUNKER_MATRIX);
  const [otherPlayers, setOtherPlayers] = useState({});

  useEffect(() => {
    if (!roomCode) return; // Prevent crash if roomCode is somehow missing
    
    webSocketService.connect(() => {
      // Register session with backend
      webSocketService.sendMessage('/app/game.join', {
        playerId: character,
        roomCode: roomCode,
        x: SPAWN_POINTS[character].x,
        y: SPAWN_POINTS[character].y,
        action: 'abajo'
      });

      const topic = `/topic/game.state.${roomCode}`;
      webSocketService.subscribe(topic, (message) => {
        if (message.playerId && message.playerId !== character) {
          if (message.action === 'PAUSE') {
            if (onPauseSync) onPauseSync(true);
            return;
          }
          if (message.action === 'RESUME') {
            if (onPauseSync) onPauseSync(false);
            return;
          }

          setOtherPlayers(prev => ({
            ...prev,
            [message.playerId]: { ...prev[message.playerId], ...message }
          }));
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
        .catch(err => console.error("Error obteniendo estado inicial", err));
    });

    return () => {
      webSocketService.disconnect();
    };
  }, [character, roomCode]);

  const handleCollideSpecial = useCallback((x, y, cell) => {
    const cellID = typeof cell === 'object' ? cell.p : cell;
    if (cellID === TILE_TYPES.BUNKER_DOOR) {
      onTeleport();
    }
  }, [onTeleport]);

  const { playerPos, playerState, handleManualMove } = usePlayerMovement(
    SPAWN_POINTS[character] || { x: 1, y: 1 }, 
    character, 
    matrix, 
    handleCollideSpecial,
    roomCode,
    otherPlayers,
    100,
    isPaused
  );

  return (
    <div className="game-view-cinematic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#000' }}>
      <GameMap 
        matrix={matrix} 
        playerPos={playerPos} 
        playerSprite={{
          character,
          direction: playerState.direction,
          isMoving: playerState.isMoving,
          health: 100
        }}
        otherPlayers={otherPlayers}
        onRestart={onRestart}
        isPaused={isPaused}
      />
      <TouchControls onMove={handleManualMove} />
    </div>
  );
};

export default BunkerRoom;
