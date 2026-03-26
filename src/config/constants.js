export const TILE_SIZE = 95;
export const VIEWPORT_TILES = 9;

export const GROUND_ASSETS = {
  0: '/assets/tiles/ground/ground_clean.png',
  1: '/assets/tiles/ground/ground_stone.png',
  2: '/assets/tiles/ground/ground_dirty.png',
  3: '/assets/tiles/ground/ground_blood.png',
  4: '/assets/tiles/ground/ground_cracked.png',
  5: '/assets/tiles/ground/ground_dark.png',
  6: '/assets/tiles/ground/ground_destroyed.png',
  7: '/assets/tiles/ground/ground_heavy_blood.png',
};

export const PROP_ASSETS = {
  10: '/assets/props/bunker/bunker_door.png',
  11: '/assets/props/barricades/barricade_concrete.png',
  12: '/assets/environment/trees/tree_dead_01.png',
  13: '/assets/vehicles/car_burned.png',
  14: '/assets/props/barricades/barricade_military.png',
  15: '/assets/tiles/ground/ground_stone.png',
};

// Map of all assets for easier pre-loading or type checking
export const ALL_ASSETS = {
    ...GROUND_ASSETS,
    ...PROP_ASSETS
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
