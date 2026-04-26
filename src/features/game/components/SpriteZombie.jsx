import React from 'react';
import './SpritePlayer.css'; // Reutilizamos los estilos base de posicionamiento

/**
 * SpriteZombie: Optimiza el renderizado de zombies para evitar el parpadeo en combate.
 * Mantiene las 9 animaciones (caminar + ataque) cargadas en el DOM.
 */
const SpriteZombie = ({ direction, isAttacking, type = 'comun' }) => {
  const walkDirections = ['abajo', 'arriba', 'derecha', 'izquierda'];
  
  // Mapping logic for different asset naming conventions
  const getAssetPath = (dir, mode) => {
    const folder = type === 'chasqueador' ? 'chasqueador' : 'comun';
    
    if (mode === 'walk') {
      if (type === 'chasqueador' && dir === 'derecha') return `/zombies/${folder}/dercha.gif`;
      return `/zombies/${folder}/${dir}.gif`;
    } else {
      // Attack mapping
      if (type === 'chasqueador') {
        const attackMap = {
          'abajo': 'ataque frente',
          'arriba': 'ataque atras',
          'derecha': 'ataque derecha',
          'izquierda': 'ataque izquierda',
          'adelante': 'ataque frente'
        };
        return `/zombies/${folder}/${attackMap[dir] || 'ataque frente'}.gif`;
      } else {
        const commonAttackMap = {
          'abajo': 'ataque_adelante',
          'arriba': 'ataque_atras',
          'derecha': 'ataque_derecha',
          'izquierda': 'ataque_izquierda',
          'adelante': 'ataque_adelante'
        };
        return `/zombies/${folder}/${commonAttackMap[dir] || 'ataque'}.gif`;
      }
    }
  };

  const currentDir = direction || 'abajo';

  return (
    <div className="sprite-player-container zombie-sprite-container">
      {/* Capas de Caminar */}
      {walkDirections.map(dir => {
        const isActive = !isAttacking && currentDir === dir;
        return (
          <img
            key={`walk-${dir}`}
            src={getAssetPath(dir, 'walk')}
            alt={`zombie-walk-${dir}`}
            className={`sprite-layer ${isActive ? 'active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
          />
        );
      })}

      {/* Capas de Ataque */}
      {['abajo', 'arriba', 'derecha', 'izquierda', 'adelante'].map(dir => {
        const isActive = isAttacking && currentDir === dir;
        return (
          <img
            key={`attack-${dir}`}
            src={getAssetPath(dir, 'attack')}
            alt={`zombie-attack-${dir}`}
            className={`sprite-layer ${isActive ? 'active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
          />
        );
      })}
    </div>
  );
};

export default SpriteZombie;
