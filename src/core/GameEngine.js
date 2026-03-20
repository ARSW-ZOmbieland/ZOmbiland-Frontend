export const TILE_TYPES = {
    GROUND_CLEAN: 0,
    GROUND_STONE: 1,
    BUNKER_DOOR: 10,
    BARRICADE: 11,
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Cerrado (sin puerta)
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const isWalkable = (matrix, x, y) => {
    if (y < 0 || y >= matrix.length || x < 0 || x >= matrix[0].length) return false;
    const tile = matrix[y][x];
    return tile < 10; // Simple collision logic: types >= 10 are solid or interactive
};
