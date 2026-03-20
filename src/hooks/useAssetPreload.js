import { useState, useEffect } from 'react';
import { ALL_ASSETS } from '../config/constants';

const CHARACTERS = ['alex', 'andres', 'juanpablo', 'maria', 'tomas'];
const DIRECTIONS = ['abajo', 'arriba', 'derecha', 'izquierda', 'adelante'];

/**
 * Pre-loads all game assets (textures and sprites) into the browser's cache 
 * so there are no visual flickers when the character moves or the map renders.
 */
export const useAssetPreload = () => {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const imageUrls = Object.values(ALL_ASSETS);
        
        // Add all character animation frames
        CHARACTERS.forEach(char => {
            imageUrls.push(`/personajes/${char}/no-seleccion.png`);
            DIRECTIONS.forEach(dir => {
                imageUrls.push(`/personajes/${char}/${dir}.gif`);
            });
        });

        let loadedCount = 0;
        const total = imageUrls.length;

        if (total === 0) {
            setIsLoaded(true);
            return;
        }

        imageUrls.forEach(url => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                setProgress(Math.round((loadedCount / total) * 100));
                if (loadedCount === total) setIsLoaded(true);
            };
            img.onerror = () => {
                // If an asset fails, skip it so the game can still load
                console.warn("Failed to preload asset:", url);
                loadedCount++;
                setProgress(Math.round((loadedCount / total) * 100));
                if (loadedCount === total) setIsLoaded(true);
            };
            img.src = url;
        });
    }, []);

    return { progress, isLoaded };
};
