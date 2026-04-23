export const TILE_TYPES = {
    // Grounds (0-9)
    GROUND_CLEAN: 0,
    GROUND_STONE: 1,
    GROUND_DIRTY: 2,
    GROUND_CRACKED: 3,
    GROUND_BLOOD: 4,
    GROUND_HEAVY_BLOOD: 5,
    GROUND_DARK: 6,
    
    // Props (10+)
    BUNKER_DOOR: 10,
    BARRICADE: 11,
    TREE: 12,
    CAR: 13,
    BARRICADE_MILITARY: 14,
};

const generateWorldMap = () => {
    const size = 50;
    const map = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            // Pick a random ground
            const gRand = Math.random();
            let groundType = TILE_TYPES.GROUND_CLEAN;
            if (gRand < 0.6) groundType = TILE_TYPES.GROUND_CLEAN;
            else if (gRand < 0.75) groundType = TILE_TYPES.GROUND_STONE;
            else if (gRand < 0.85) groundType = TILE_TYPES.GROUND_DIRTY;
            else if (gRand < 0.9) groundType = TILE_TYPES.GROUND_CRACKED;
            else if (gRand < 0.95) groundType = TILE_TYPES.GROUND_BLOOD;
            else if (gRand < 0.98) groundType = TILE_TYPES.GROUND_HEAVY_BLOOD;
            else groundType = TILE_TYPES.GROUND_DARK;

            let propType = null;
            // Edge walls
            if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
                propType = TILE_TYPES.BARRICADE;
            } else {
                // Random 1x1 props
                const pRand = Math.random();
                if (pRand < 0.05) {
                    const typeRand = Math.random();
                    if (typeRand < 0.3) propType = TILE_TYPES.TREE;
                    else if (typeRand < 0.6) propType = TILE_TYPES.BARRICADE;
                    else if (typeRand < 0.8) propType = TILE_TYPES.CAR;
                    else propType = TILE_TYPES.BARRICADE_MILITARY;
                }
            }
            row.push({ g: groundType, p: propType });
        }
        map.push(row);
    }
    // Entry Point (from bunker)
    map[1][1] = { g: TILE_TYPES.GROUND_CLEAN, p: TILE_TYPES.BUNKER_DOOR };
    // Exit Point (to next level)
    map[48][48] = { g: TILE_TYPES.GROUND_CLEAN, p: TILE_TYPES.BUNKER_DOOR };
    return map;
};

export const WORLD_MAP_MATRIX = generateWorldMap();

export const INITIAL_BUNKER_MATRIX = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 10], // Door to World
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const isWalkable = (matrix, x, y) => {
    if (y < 0 || y >= matrix.length || x < 0 || x >= matrix[0].length) return false;
    const tile = matrix[y][x];
    if (typeof tile === 'object') return false; // Future object handling
    if (tile === 72) return true;               // Street lights are walkable
    if (tile >= 20 && tile <= 22) return true;  // Bushes are walkable
    return tile < 10; // Simple collision logic: types >= 10 are solid or interactive
};
