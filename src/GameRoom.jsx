import React, { useState } from 'react';
import './GameRoom.css';

function GameRoom() {
    // Posibles vistas: 'menu', 'creating', 'joining', 'character-selection'
    const [view, setView] = useState('menu');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const handleCreateRoom = () => {
        setView('creating');
        // Simulamos un retraso de "conexión al servidor"
        setTimeout(() => {
            const fakeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomCode(fakeCode);
        }, 1500);
    };

    const handleJoinClick = () => {
        setView('joining');
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (joinCode.trim().length > 0) {
            setView('character-selection');
        }
    };

    const handleCancel = () => {
        setView('menu');
        setRoomCode('');
        setJoinCode('');
    };

    const handleProceedToCharacterSelection = () => {
        setView('character-selection');
    };

    // Personajes disponibles
    const characters = ['andres', 'juanpablo', 'maria', 'tomas'];
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    // Renderizado según la vista
    if (view === 'character-selection') {
        return (
            <div className="game-room-container character-selection-bg">
                <div className="character-selection-content-wide fade-in">
                    <h2 className="title-glow">Selecciona tu Sobreviviente</h2>
                    <p className="subtitle">Sala conectada. ¿Quién serás en esta partida?</p>
                    
                    <div className="characters-grid">
                        {characters.map((char) => (
                            <div 
                                key={char} 
                                className={`character-card ${selectedCharacter === char ? 'selected' : ''}`}
                                onClick={() => setSelectedCharacter(char)}
                            >
                                <img 
                                    src={`/personajes/${char}/${selectedCharacter === char ? 'si-seleccion.png' : 'no-seleccion.png'}`} 
                                    alt={char} 
                                    className="character-img"
                                />
                                <h3 className="character-name">{char}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="action-buttons mt-20">
                        <button className="game-btn cancel-btn" onClick={handleCancel}>
                            Abandonar Sala
                        </button>
                        <button 
                            className="game-btn create-btn" 
                            disabled={!selectedCharacter}
                            style={{ opacity: selectedCharacter ? 1 : 0.5, cursor: selectedCharacter ? 'pointer' : 'not-allowed' }}
                            onClick={() => alert(`¡Listo para jugar con ${selectedCharacter.toUpperCase()}!`)}
                        >
                            Confirmar Personaje
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-room-container main-bg">
            <div className="game-room-content fade-in">
                
                {view === 'menu' && (
                    <>
                        <h1 className="title-glow">Menú Principal</h1>
                        <button className="game-btn create-btn" onClick={handleCreateRoom}>
                            Crear sala
                        </button>
                        <button className="game-btn join-btn" onClick={handleJoinClick}>
                            Unirse a sala
                        </button>
                    </>
                )}

                {view === 'creating' && (
                    <div className="creating-view">
                        <h2 className="title-glow">Creando tu refugio...</h2>
                        
                        {!roomCode ? (
                            <div className="spinner"></div>
                        ) : (
                            <div className="room-code-display fade-in">
                                <p>Código de la sala:</p>
                                <h3>{roomCode}</h3>
                                <button className="game-btn create-btn" onClick={handleProceedToCharacterSelection}>
                                    Entrar a la Sala
                                </button>
                            </div>
                        )}
                        
                        <button className="game-btn cancel-btn mt-20" onClick={handleCancel}>
                            Cancelar
                        </button>
                    </div>
                )}

                {view === 'joining' && (
                    <div className="joining-view">
                        <h2 className="title-glow">Unirse a Refugio</h2>
                        <form onSubmit={handleJoinSubmit} className="join-form">
                            <input 
                                type="text" 
                                placeholder="Ingresa el código..." 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="join-input"
                                maxLength={10}
                                required
                            />
                            <button type="submit" className="game-btn join-btn">
                                Entrar
                            </button>
                        </form>
                        <button className="game-btn cancel-btn mt-20" onClick={handleCancel}>
                            Atrás
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default GameRoom;
