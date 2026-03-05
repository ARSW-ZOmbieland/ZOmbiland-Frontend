import React from 'react';
import './GameRoom.css';

function GameRoom() {
    return (
        <div className="game-room-container">
            <div className="game-room-content">
                <button className="game-btn create-btn">Crear sala</button>
                <button className="game-btn join-btn">Unirse a sala</button>
            </div>
        </div>
    );
}

export default GameRoom;
