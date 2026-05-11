import React, { memo } from 'react';
import './SpritePlayer.css';

/**
 * SpriteZombie: Optimizado con React.memo para evitar saturación del DOM.
 */
const SpriteZombie = memo(({ direction, isAttacking, type = 'comun' }) => {
  // Mapping logic for different asset naming conventions
  const getAssetPath = (dir, mode) => {
    let folder = 'comun';
    let basePath = '/zombies';

    if (type === 'chasqueador') {
      folder = 'chasqueador';
    } else if (type === 'hunter') {
      folder = 'hunter';
      basePath = '/villanos';
    } else if (type === 'tanke') {
      folder = 'tanque';
      basePath = '/villanos';

    
    const isChasqueador = type === 'chasqueador';
    const isHunter = type === 'hunter';
    const isTanke = type === 'tanke';


    if (mode === 'walk') {
      if (isChasqueador && dir === 'derecha') return `${basePath}/${folder}/dercha.gif`;
      return `${basePath}/${folder}/${dir}.gif`;
    } else {
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
        return `${basePath}/${folder}/ataque.gif`;
      } else if (isTanke) {
        const tankeAttackMap = {
          'abajo': 'ataqueabajo',
          'arriba': 'ataquearriba',
          'derecha': 'ataquederecho',
          'izquierda': 'ataqueizquierdo',
          'adelante': 'ataqueabajo'
        };
        return `${basePath}/${folder}/${tankeAttackMap[dir] || 'ataqueabajo'}.gif`;
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
  const assetPath = isAttacking ? getAssetPath(currentDir, 'attack') : getAssetPath(currentDir, 'walk');

  return (
    <div className="sprite-player-container zombie-sprite-container">
      <img
        src={assetPath}
        alt={`zombie-${isAttacking ? 'attack' : 'walk'}-${currentDir}`}
        className="sprite-layer active"
      />
    </div>
  );
});

export default SpriteZombie;
