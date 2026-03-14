export const TILE_SIZE = 70;
export const VIEWPORT_TILES = 9;

export const GROUND_ASSETS = {
  0: '/assets/tiles/ground/ground_clean.png',
  1: '/assets/tiles/ground/ground_stone.png',
  2: '/assets/tiles/ground/ground_dirty.png',
};

export const PROP_ASSETS = {
  10: '/assets/props/bunker/bunker_door.png',
  11: '/assets/props/barricades/barricade_concrete.png',
  12: '/assets/environment/trees/tree_dead_01.png',
  13: '/assets/vehicles/car_burned.png',
  14: '/assets/props/barricades/barricade_military.png',
};

// Map of all assets for easier pre-loading or type checking
export const ALL_ASSETS = {
    ...GROUND_ASSETS,
    ...PROP_ASSETS
};
