import React, { memo } from 'react';
import './SpritePlayer.css';

/**
 * SpritePlayer: Optimizado con React.memo para evitar re-renders costosos.
 */
const SpritePlayer = memo(({ characterId, direction, isMoving, isDead, aimAngle }) => {
  if (isDead) {
    return (
      <div className="sprite-player-container other-player-dead">
        <img 
          src={`/personajes/${characterId}/${
            characterId === 'andres' ? 'juanandres_muerto.png' : 
            characterId === 'maria' ? 'maria_muerta.png' : 
            `${characterId}_muerto.png`
          }`} 
          alt={`${characterId}-dead`} 
          className="sprite-layer active"
        />
      </div>
    );
  }

  if (!isMoving) {
    return (
      <div className="sprite-player-container">
        <img 
          src={`/personajes/${characterId}/no-seleccion.png`} 
          alt={`${characterId}-idle`} 
          className="sprite-layer active"
        />
      </div>
    );
  }

  // Si se está moviendo, solo renderizamos la dirección necesaria
  const assetPath = `/personajes/${characterId}/${direction}.gif`;
  return (
    <div className="sprite-player-container">
      <img
        src={assetPath}
        alt={`${characterId}-${direction}`}
        className="sprite-layer active"
      />
    </div>
  );
});

export default SpritePlayer;
