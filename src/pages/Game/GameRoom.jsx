import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import './GameRoom.css';

function GameRoom({ onConfirm }) {
    const [view, setView] = useState('menu'); // 'menu', 'creating', 'joining', 'character-selection'
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const characters = ['andres', 'juanpablo', 'maria', 'tomas'];
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [takenCharacters, setTakenCharacters] = useState([]);
    const [joinError, setJoinError] = useState('');

    useEffect(() => {
        if (view === 'character-selection') {
            const activeCode = roomCode || joinCode;
            fetch(`${API_BASE_URL}/api/game/rooms/${activeCode}`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setTakenCharacters(data);
                })
                .catch(err => console.error("Error fetching room info:", err));
            
            // Poll every 3 seconds while in character selection to update taken characters
            const interval = setInterval(() => {
                fetch(`${API_BASE_URL}/api/game/rooms/${activeCode}`, { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setTakenCharacters(data);
                        // If selected character becomes taken by someone else, deselect it
                        if (data.includes(selectedCharacter)) {
                            setSelectedCharacter(null);
                        }
                    })
                    .catch(err => console.error("Error polling room info:", err));
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [view, roomCode, joinCode, selectedCharacter]);

    const handleCreateRoom = () => {
        setView('creating');
        setTimeout(() => {
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            fetch(`${API_BASE_URL}/api/game/rooms/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ roomCode: newCode })
            }).then(() => {
                setRoomCode(newCode);
                setTimeout(() => setView('character-selection'), 2000);
            }).catch(err => {
                console.error("Failed to create room", err);
                setView('menu');
            });
        }, 1500);
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        setJoinError('');
        if (joinCode.trim().length > 0) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/game/rooms/${joinCode}/exists`, { credentials: 'include' });
                if (!res.ok) {
                    throw new Error("Bad response from server");
                }
                const exists = await res.json();
                if (exists === true) {
                    setView('character-selection');
                } else {
                    setJoinError('Sala no encontrada. Revisa el código.');
                }
            } catch (err) {
                setJoinError('Error de conexión. ¿Reiniciaste el backend?');
            }
        }
    };

    const handleReset = () => {
        setView('menu');
        setRoomCode('');
        setJoinCode('');
        setSelectedCharacter(null);
    };

    const confirmSelection = () => {
        const activeCode = roomCode || joinCode;
        onConfirm(selectedCharacter, activeCode);
    };

    // Determine current step for progress indicator
    const currentStep = view === 'menu' ? 1 
                      : (view === 'creating' || view === 'joining') ? 2 
                      : 3;

    return (
        <div className={`game-room-container ${view === 'character-selection' ? 'character-selection-bg' : 'main-bg'}`}>
            <div className="game-room-box fade-in">
                
                {/* UX: Progress Indicators */}
                <div className="progress-indicator">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Conexión</div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Sala</div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Superviviente</div>
                </div>

                <div className="view-content">
                    {/* MENU VIEW */}
                    {view === 'menu' && (
                        <div className="step-view fade-in">
                            <h1 className="title-glow">Punto de Encuentro</h1>
                            <p className="subtitle">¿Crearás un nuevo refugio o te unirás a uno?</p>
                            
                            <div className="menu-options">
                                <button className="game-btn primary-btn" onClick={handleCreateRoom}>
                                    Crear Nueva Sala
                                </button>
                                <span className="divider">O</span>
                                <button className="game-btn secondary-btn" onClick={() => setView('joining')}>
                                    Unirse con Código
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CREATING ROOM VIEW */}
                    {view === 'creating' && (
                        <div className="step-view fade-in">
                            <h2 className="title-glow">Generando Sala...</h2>
                            
                            {!roomCode ? (
                                <div className="loader-container">
                                    <div className="spinner"></div>
                                    <p>Estableciendo conexión segura...</p>
                                </div>
                            ) : (
                                <div className="code-reveal pop-in">
                                    <p>Tu código de sala es:</p>
                                    <div className="code-box">{roomCode}</div>
                                    <p className="success-text">¡Sala lista! Pasando a selección...</p>
                                </div>
                            )}
                            <button className="text-btn mt-auto" onClick={handleReset}>Cancelar</button>
                        </div>
                    )}

                    {/* JOINING ROOM VIEW */}
                    {view === 'joining' && (
                        <div className="step-view fade-in">
                            <h2 className="title-glow">Unirse a Refugio</h2>
                            <p className="subtitle">Ingresa el código que te compartieron</p>
                            
                            <form onSubmit={handleJoinSubmit} className="ux-form">
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        id="join-code"
                                        placeholder="EJ: XJ9A2" 
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        maxLength={8}
                                        required
                                        autoFocus
                                    />
                                    <label htmlFor="join-code">Código de Sala</label>
                                </div>
                                
                                {joinError && <div className="join-error-msg fade-in">{joinError}</div>}
                                
                                <button type="submit" className="game-btn primary-btn" disabled={joinCode.length < 3}>
                                    Entrar a la Sala
                                </button>
                            </form>
                            
                            <button className="text-btn mt-auto" onClick={handleReset}>Atrás</button>
                        </div>
                    )}

                    {/* CHARACTER SELECTION VIEW */}
                    {view === 'character-selection' && (
                        <div className="step-view fade-in character-step">
                            <div className="selection-header">
                                <h2 className="title-glow">Selecciona tu Rol</h2>
                                <div className="active-room-badge">
                                    SALA: <span>{roomCode || joinCode}</span>
                                </div>
                            </div>

                            {takenCharacters.length >= 4 && (
                                <div className="room-full-alert pop-in">
                                    <h3>Sala Llena</h3>
                                    <p>Esta sala ya tiene 4 supervivientes asignados.</p>
                                </div>
                            )}
                            
                            <div className="characters-grid">
                                {characters.map((char) => {
                                    const isTaken = takenCharacters.includes(char);
                                    return (
                                    <div 
                                        key={char} 
                                        className={`char-card ${selectedCharacter === char ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                                        onClick={() => { if (!isTaken) setSelectedCharacter(char); }}
                                    >
                                        <div className="char-image-wrapper">
                                            <img 
                                                src={`/personajes/${char}/${selectedCharacter === char ? 'si-seleccion.png' : 'no-seleccion.png'}`} 
                                                alt={char} 
                                            />
                                        </div>
                                        <h3 className="char-name">{char} {isTaken && "(Ocupado)"}</h3>
                                        <div className="char-overlay"></div>
                                    </div>
                                )})}
                            </div>

                            <div className="action-row mt-auto">
                                <button className="text-btn text-danger" onClick={handleReset}>
                                    Abandonar Sala
                                </button>
                                <button 
                                    className="game-btn accept-btn" 
                                    disabled={!selectedCharacter || takenCharacters.length >= 4}
                                    onClick={confirmSelection}
                                >
                                    Confirmar Despliegue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GameRoom;
