export const TILE_TYPES = {
    GROUND_CLEAN: 0,
    GROUND_STONE: 1,
    BUNKER_DOOR: 10,
    BARRICADE: 11,
    WALL: 15,
};

export const generateWorldMap = () => {
    const size = 50;
    const map = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            // Walls at the edges
            if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
                row.push(TILE_TYPES.BARRICADE);
            } else {
                // Random ground types (0-2)
                const rand = Math.random();
                if (rand < 0.8) row.push(TILE_TYPES.GROUND_CLEAN);
                else if (rand < 0.9) row.push(TILE_TYPES.GROUND_STONE);
                else row.push(TILE_TYPES.BARRICADE); // Some random obstacles
            }
        }
        map.push(row);
    }
    // Entry Point (from bunker)
    map[1][1] = TILE_TYPES.BUNKER_DOOR;
    
    // Exit Point (Randomized inside the map, avoiding corners/start)
    const exitX = Math.floor(Math.random() * 40) + 5;
    const exitY = Math.floor(Math.random() * 40) + 5;
    map[exitY][exitX] = TILE_TYPES.BUNKER_DOOR;

    return map;
};

export const INITIAL_BUNKER_MATRIX = [
    [15, 15, 15, 15, 10, 10, 15, 15, 15, 15], // Puerta de salida al World Map (10)
    [15,  0,  0,  0,  0,  0,  0,  0,  0, 15],
    [15, 40,  0,  0,  0,  0,  0,  0, 42, 15], // Cama (40) y Storage (42)
    [15,  0,  0,  0,  0,  0,  0,  0,  0, 15],
    [15,  0,  0,  0, 41, 41,  0,  0,  0, 15], // Consola (41)
    [15,  0,  0,  0, 43, 43,  0,  0,  0, 15], // Weapons table (43)
    [15,  0,  0,  0,  0,  0,  0,  0,  0, 15],
    [15, 40,  0,  0,  0,  0,  0,  0, 42, 15], // Cama (40) y Storage (42)
    [15,  0,  0,  0,  0,  0,  0,  0,  0, 15],    [15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
];

export const isWalkable = (matrix, x, y) => {
    if (y < 0 || y >= matrix.length || x < 0 || x >= matrix[0].length) return false;
    const tile = matrix[y][x];
    if (typeof tile === 'object') return false; // Future object handling
    if (tile === 72) return true;               // Street lights are walkable
    if (tile >= 20 && tile <= 22) return true;  // Bushes are walkable
    return tile < 10; // Simple collision logic: types >= 10 are solid or interactive
};
