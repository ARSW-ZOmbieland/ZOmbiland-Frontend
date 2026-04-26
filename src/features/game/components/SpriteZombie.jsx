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
    // Definir carpetas base
    let folder = 'comun';
    let basePath = '/zombies';

    if (type === 'chasqueador') {
      folder = 'chasqueador';
    } else if (type === 'hunter') {
      folder = 'hunter';
      basePath = '/villanos'; // Ruta especial pedida por el usuario
    }
    
    const isChasqueador = type === 'chasqueador';
    const isHunter = type === 'hunter';

    if (mode === 'walk') {
      if (isChasqueador && dir === 'derecha') return `${basePath}/${folder}/dercha.gif`;
      return `${basePath}/${folder}/${dir}.gif`;
    } else {
      // Attack mapping
      if (isChasqueador) {
        const attackMap = {
          'abajo': 'ataque frente',
          'arriba': 'ataque atras',
          'derecha': 'ataque derecha',
          'izquierda': 'ataque izquierda',
          'adelante': 'ataque frente'
        };
        return `${basePath}/${folder}/${attackMap[dir] || 'ataque frente'}.gif`;
      } else if (isHunter) {
        // Hunter solo tiene ataque.gif
        return `${basePath}/${folder}/ataque.gif`;
      } else {
        const commonAttackMap = {
          'abajo': 'ataque_adelante',
          'arriba': 'ataque_atras',
          'derecha': 'ataque_derecha',
          'izquierda': 'ataque_izquierda',
          'adelante': 'ataque_adelante'
        };
        return `${basePath}/${folder}/${commonAttackMap[dir] || 'ataque'}.gif`;
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
