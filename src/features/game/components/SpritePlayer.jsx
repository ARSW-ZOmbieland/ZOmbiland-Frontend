import React from 'react';
import './SpritePlayer.css';

/**
 * SpritePlayer: Optimiza el renderizado de personajes para evitar el parpadeo.
 * Mantiene las 4 direcciones cargadas en el DOM y solo muestra la activa.
 * Esto elimina el tiempo de carga entre pasos, especialmente en redes lentas.
 */
const SpritePlayer = ({ characterId, direction, isMoving, isDead, aimAngle }) => {
  const directions = ['abajo', 'arriba', 'derecha', 'izquierda', 'adelante'];
  
  return (
    <div className={`sprite-player-container ${isDead ? 'other-player-dead' : ''}`}>
      {/* Estado Vivo - Caminando (GIFs) */}
      {!isDead && directions.map(dir => {
        const isActive = direction === dir && isMoving;
        const assetPath = `/personajes/${characterId}/${dir}.gif`;
        
        return (
          <img
            key={dir}
            src={assetPath}
            alt={`${characterId}-${dir}`}
            className={`sprite-layer ${isActive ? 'active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
          />
        );
      })}

      {/* Estado Muerto - Imagen estática específica */}
      {isDead && (
        <img 
          src={`/personajes/${characterId}/${
            characterId === 'andres' ? 'juanandres_muerto.png' : 
            characterId === 'maria' ? 'maria_muerta.png' : 
            `${characterId}_muerto.png`
          }`} 
          alt={`${characterId}-dead`} 
          className="sprite-layer active"
        />
      )}

      {/* Idle state (No-seleccion - PNG estático) */}
      {!isMoving && !isDead && (
        <img 
          src={`/personajes/${characterId}/no-seleccion.png`} 
          alt={`${characterId}-idle`} 
          className="sprite-layer active"
        />
      )}

    </div>
  );
};


export default SpritePlayer;
