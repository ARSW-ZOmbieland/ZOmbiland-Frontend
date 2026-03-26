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
  20: '/assets/environment/bushes/bush_dead_01.png',
  21: '/assets/environment/bushes/grass_dry.png',
  22: '/assets/environment/bushes/grass_infected.png',
  30: '/assets/environment/trees/tree_burned.png',
  31: '/assets/environment/trees/tree_dead_01.png',
  32: '/assets/environment/trees/tree_dead_02.png',
  33: '/assets/environment/trees/tree_dead_large.png',
  34: '/assets/environment/trees/tree_infected.png',
  40: '/assets/props/bunker/bunker_bed.png',
  41: '/assets/props/bunker/bunker_console.png',
  42: '/assets/props/bunker/bunker_storage.png',
  43: '/assets/props/bunker/bunker_weapons_table.png',
  50: '/assets/props/forest/backpack_loot.png',
  51: '/assets/props/forest/branch_pile.png',
  52: '/assets/props/forest/campfire_dead.png',
  53: '/assets/props/forest/forest_supply_box.png',
  54: '/assets/props/forest/log_fallen.png',
  55: '/assets/props/forest/log_large.png',
  56: '/assets/props/forest/tent_destroyed.png',
  57: '/assets/props/forest/wood_stump.png',
};

// Map of all assets for easier pre-loading or type checking
export const ALL_ASSETS = {
    ...GROUND_ASSETS,
    ...PROP_ASSETS
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
