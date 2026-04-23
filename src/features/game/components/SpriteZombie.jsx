import React from 'react';
import './SpritePlayer.css'; // Reutilizamos los estilos base de posicionamiento

/**
 * SpriteZombie: Optimiza el renderizado de zombies para evitar el parpadeo en combate.
 * Mantiene las 9 animaciones (caminar + ataque) cargadas en el DOM.
 */
const SpriteZombie = ({ direction, isAttacking }) => {
  const walkDirections = ['abajo', 'arriba', 'derecha', 'izquierda'];
  const attackDirections = [
    { key: 'abajo', asset: 'ataque_adelante' },
    { key: 'arriba', asset: 'ataque_atras' },
    { key: 'derecha', asset: 'ataque_derecha' },
    { key: 'izquierda', asset: 'ataque_izquierda' },
    { key: 'adelante', asset: 'ataque_adelante' }
  ];
  
  const currentDir = direction || 'abajo';

  return (
    <div className="sprite-player-container zombie-sprite-container">
      {/* Capas de Caminar */}
      {walkDirections.map(dir => {
        const isActive = !isAttacking && currentDir === dir;
        return (
          <img
            key={`walk-${dir}`}
            src={`/zombies/comun/${dir}.gif`}
            alt={`zombie-walk-${dir}`}
            className={`sprite-layer ${isActive ? 'active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
          />
        );
      })}

      {/* Capas de Ataque */}
      {attackDirections.map(atk => {
        const isActive = isAttacking && currentDir === atk.key;
        return (
          <img
            key={`attack-${atk.key}`}
            src={`/zombies/comun/${atk.asset}.gif`}
            alt={`zombie-attack-${atk.key}`}
            className={`sprite-layer ${isActive ? 'active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
          />
        );
      })}

      {/* Fallback ataque genérico si algo falla */}
      {isAttacking && !attackDirections.some(a => a.key === currentDir) && (
        <img 
          src="/zombies/comun/ataque.gif" 
          alt="zombie-attack-generic" 
          className="sprite-layer active"
        />
      )}
    </div>
  );
};

export default SpriteZombie;
