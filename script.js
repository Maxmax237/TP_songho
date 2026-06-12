<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mancala - Jeu en ligne</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
        }
        
        .game-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-top: 0;
        }
        
        .room-section {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .room-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        button {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s, background 0.2s;
        }
        
        button:hover:not(:disabled) {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .room-status {
            background: #e0e7ff;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
        }
        
        .board {
            margin: 20px 0;
        }
        
        .player-row {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .player-label {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            font-size: 18px;
        }
        
        .cell {
            width: 70px;
            height: 70px;
            background: #fbbf24;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0 5px;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
            border: 3px solid #d97706;
        }
        
        .cell:hover:not(.disabled) {
            transform: scale(1.05);
            background: #f59e0b;
        }
        
        .cell.highlight {
            background: #10b981;
            border-color: #059669;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .cell.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .seed-count {
            font-size: 24px;
            font-weight: bold;
        }
        
        .seed-icon {
            font-size: 20px;
            color: #78350f;
        }
        
        .scores {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 10px;
        }
        
        .score {
            text-align: center;
            flex: 1;
        }
        
        .score-value {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
        }
        
        .turn-info {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            padding: 10px;
            background: #e0e7ff;
            border-radius: 5px;
        }
        
        .game-message {
            text-align: center;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        
        .game-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .reset-btn {
            background: #ef4444;
        }
        
        .reset-btn:hover:not(:disabled) {
            background: #dc2626;
        }
        
        .quit-btn {
            background: #6b7280;
        }
        
        .quit-btn:hover:not(:disabled) {
            background: #4b5563;
        }
        
        @media (max-width: 768px) {
            .cell {
                width: 50px;
                height: 50px;
            }
            
            .seed-count {
                font-size: 18px;
            }
            
            .seed-icon {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <h1>🎯 Mancala - Jeu Africain</h1>
        
        <div class="room-section">
            <div class="room-controls">
                <button id="createRoomBtn">✨ Créer une partie</button>
                <input type="text" id="roomCode" placeholder="Code de la partie (6 chiffres)" maxlength="6">
                <button id="joinRoomBtn">🔗 Rejoindre</button>
            </div>
            <div id="roomStatus" class="room-status">Aucune partie active</div>
        </div>
        
        <div class="board">
            <div class="player-label">JOUEUR 1 (HAUT)</div>
            <div id="north-row" class="player-row"></div>
            
            <div class="player-label">JOUEUR 2 (BAS)</div>
            <div id="south-row" class="player-row"></div>
        </div>
        
        <div class="scores">
            <div class="score">
                <div>JOUEUR 1</div>
                <div id="score-north" class="score-value">0</div>
            </div>
            <div class="score">
                <div>JOUEUR 2</div>
                <div id="score-south" class="score-value">0</div>
            </div>
        </div>
        
        <div id="turn-text" class="turn-info">En attente...</div>
        <div id="game-message" class="game-message"></div>
        
        <div class="game-actions">
            <button id="resetBtn" class="reset-btn" disabled>🔄 Réinitialiser</button>
            <button id="quitBtn" class="quit-btn" disabled>❌ Quitter</button>
        </div>
    </div>

    <script>
        // ==================== VARIABLES GLOBALES ====================
        let currentRoom = null;
        let currentPlayerId = null;
        let playerRole = null; // 'north' ou 'south'
        let gameState = null;
        let pollingInterval = null;

        // Éléments DOM
        const northRow = document.getElementById('north-row');
        const southRow = document.getElementById('south-row');
        const scoreNorth = document.getElementById('score-north');
        const scoreSouth = document.getElementById('score-south');
        const turnText = document.getElementById('turn-text');
        const gameMessage = document.getElementById('game-message');
        const resetBtn = document.getElementById('resetBtn');
        const quitBtn = document.getElementById('quitBtn');
        const roomCodeInput = document.getElementById('roomCode');
        const roomStatusDiv = document.getElementById('roomStatus');

        // ==================== REQUÊTES AJAX ====================
        async function apiCall(action, data = {}) {
            const payload = { action, ...data };
            if (currentRoom) payload.roomCode = currentRoom;
            if (currentPlayerId) payload.playerId = currentPlayerId;

            try {
                const response = await fetch('api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!result.success) {
                    console.error('API Error:', result.error);
                    return null;
                }
                return result;
            } catch (error) {
                console.error('Network error:', error);
                gameMessage.innerText = 'Erreur réseau';
                return null;
            }
        }

        // ==================== RENDU DU PLATEAU ====================
        function renderBoard() {
            if (!gameState) return;

            northRow.innerHTML = '';
            southRow.innerHTML = '';

            // Cases Nord (JOUEUR 1)
            for (let i = 0; i < gameState.boardNorth.length; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const isMyTurn = (playerRole === 'north' && gameState.currentPlayer === 'north');
                const hasSeeds = gameState.boardNorth[i] > 0;
                
                if (isMyTurn && hasSeeds && gameState.gameActive && !gameState.gameEnded) {
                    cell.classList.add('highlight');
                } else if (!isMyTurn || !gameState.gameActive || gameState.gameEnded) {
                    cell.classList.add('disabled');
                }
                
                const countSpan = document.createElement('div');
                countSpan.className = 'seed-count';
                countSpan.innerText = gameState.boardNorth[i];
                const iconSpan = document.createElement('div');
                iconSpan.className = 'seed-icon';
                iconSpan.innerText = '●'.repeat(Math.min(gameState.boardNorth[i], 10));
                
                cell.appendChild(countSpan);
                cell.appendChild(iconSpan);
                cell.onclick = () => onCellClick('north', i);
                northRow.appendChild(cell);
            }

            // Cases Sud (JOUEUR 2)
            for (let i = 0; i < gameState.boardSouth.length; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const isMyTurn = (playerRole === 'south' && gameState.currentPlayer === 'south');
                const hasSeeds = gameState.boardSouth[i] > 0;
                
                if (isMyTurn && hasSeeds && gameState.gameActive && !gameState.gameEnded) {
                    cell.classList.add('highlight');
                } else if (!isMyTurn || !gameState.gameActive || gameState.gameEnded) {
                    cell.classList.add('disabled');
                }
                
                const countSpan = document.createElement('div');
                countSpan.className = 'seed-count';
                countSpan.innerText = gameState.boardSouth[i];
                const iconSpan = document.createElement('div');
                iconSpan.className = 'seed-icon';
                iconSpan.innerText = '●'.repeat(Math.min(gameState.boardSouth[i], 10));
                
                cell.appendChild(countSpan);
                cell.appendChild(iconSpan);
                cell.onclick = () => onCellClick('south', i);
                southRow.appendChild(cell);
            }

            // Mise à jour des scores
            scoreNorth.innerText = gameState.capturedNorth;
            scoreSouth.innerText = gameState.capturedSouth;
            
            // Mise à jour du texte du tour
            if (gameState.gameEnded) {
                turnText.innerText = gameState.winner || 'PARTIE TERMINÉE';
            } else if (!gameState.gameActive) {
                turnText.innerText = 'EN ATTENTE D\'UN ADVERSAIRE...';
            } else {
                const currentName = gameState.currentPlayer === 'north' ? 'JOUEUR 1 (haut)' : 'JOUEUR 2 (bas)';
                const isMyTurnText = (playerRole === gameState.currentPlayer) ? ' (VOTRE TOUR)' : ' (ADVERSAIRE)';
                turnText.innerText = `${currentName}${isMyTurnText}`;
            }
        }

        // ==================== CLIC SUR UNE CASE ====================
        async function onCellClick(player, pitIndex) {
            if (!gameState || !gameState.gameActive || gameState.gameEnded) {
                gameMessage.innerText = 'Partie terminée ou inactive';
                return;
            }
            
            if (playerRole !== gameState.currentPlayer) {
                gameMessage.innerText = 'Ce n\'est pas votre tour !';
                return;
            }
            
            if (player !== playerRole) {
                gameMessage.innerText = 'Vous ne pouvez jouer que vos cases !';
                return;
            }
            
            // Vérifier que la case n'est pas vide
            const board = (player === 'north') ? gameState.boardNorth : gameState.boardSouth;
            if (board[pitIndex] === 0) {
                gameMessage.innerText = 'Case vide !';
                return;
            }
            
            gameMessage.innerText = 'Envoi du mouvement...';
            
            const result = await apiCall('move', { player, pitIndex });
            
            if (result && result.success) {
                gameState = result.state;
                renderBoard();
                gameMessage.innerText = result.message || 'Mouvement effectué';
            } else {
                gameMessage.innerText = result?.error || 'Erreur lors du mouvement';
            }
        }

        // ==================== CHARGEMENT DE L'ÉTAT ====================
        async function loadGameState() {
            if (!currentRoom) return;
            
            const result = await apiCall('get_state');
            if (result && result.success) {
                const oldTurn = gameState?.currentPlayer;
                gameState = result.state;
                renderBoard();
                
                if (oldTurn !== gameState.currentPlayer && gameState.gameActive && !gameState.gameEnded) {
                    if (playerRole === gameState.currentPlayer) {
                        gameMessage.innerText = 'C\'est votre tour !';
                    } else {
                        gameMessage.innerText = 'Tour de l\'adversaire...';
                    }
                }
            }
        }

        // ==================== POLLING ====================
        function startPolling() {
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(() => {
                if (currentRoom) loadGameState();
            }, 1500);
        }

        function stopPolling() {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        }

        // ==================== CRÉER UNE PARTIE ====================
        async function createGame() {
            const result = await apiCall('create_room');
            if (result && result.success) {
                currentRoom = result.roomCode;
                currentPlayerId = result.playerId;
                playerRole = result.role;
                gameState = result.state;
                
                roomStatusDiv.innerText = `🎮 Partie créée : ${currentRoom} - Partagez ce code avec votre adversaire`;
                roomCodeInput.value = currentRoom;
                
                resetBtn.disabled = false;
                quitBtn.disabled = false;
                
                renderBoard();
                startPolling();
                gameMessage.innerText = 'En attente du deuxième joueur...';
            } else {
                gameMessage.innerText = result?.error || 'Erreur création partie';
            }
        }

        // ==================== REJOINDRE UNE PARTIE ====================
        async function joinGame() {
            const roomCode = roomCodeInput.value.trim();
            if (!roomCode || roomCode.length !== 6) {
                gameMessage.innerText = 'Code de partie invalide (6 chiffres)';
                return;
            }
            
            const result = await apiCall('join_room', { roomCode });
            if (result && result.success) {
                currentRoom = result.roomCode;
                currentPlayerId = result.playerId;
                playerRole = result.role;
                gameState = result.state;
                
                roomStatusDiv.innerText = `🎮 Partie rejointe : ${currentRoom} - Vous êtes ${playerRole === 'north' ? 'JOUEUR 1' : 'JOUEUR 2'}`;
                
                resetBtn.disabled = false;
                quitBtn.disabled = false;
                
                renderBoard();
                startPolling();
                gameMessage.innerText = 'Partie rejointe ! Attendez votre tour...';
            } else {
                gameMessage.innerText = result?.error || 'Code invalide ou partie pleine';
            }
        }

        // ==================== RÉINITIALISER ====================
        async function resetGame() {
            if (!currentRoom) return;
            
            const result = await apiCall('reset_room');
            if (result && result.success) {
                gameState = result.state;
                renderBoard();
                gameMessage.innerText = 'Partie réinitialisée !';
            } else {
                gameMessage.innerText = result?.error || 'Erreur réinitialisation';
            }
        }

        // ==================== QUITTER ====================
        async function quitGame() {
            if (currentRoom) {
                await apiCall('quit_room');
            }
            stopPolling();
            currentRoom = null;
            currentPlayerId = null;
            playerRole = null;
            gameState = null;
            resetBtn.disabled = true;
            quitBtn.disabled = true;
            roomStatusDiv.innerText = 'Aucune partie';
            roomCodeInput.value = '';
            northRow.innerHTML = '';
            southRow.innerHTML = '';
            scoreNorth.innerText = '0';
            scoreSouth.innerText = '0';
            turnText.innerText = 'En attente...';
            gameMessage.innerText = 'Créez ou rejoignez une partie';
        }

        // ==================== ÉVÉNEMENTS ====================
        document.getElementById('createRoomBtn').onclick = createGame;
        document.getElementById('joinRoomBtn').onclick = joinGame;
        resetBtn.onclick = resetGame;
        quitBtn.onclick = quitGame;

        // Nettoyer au déchargement
        window.onbeforeunload = () => {
            if (currentRoom) {
                navigator.sendBeacon('api.php', JSON.stringify({ 
                    action: 'quit_room', 
                    roomCode: currentRoom,
                    playerId: currentPlayerId 
                }));
            }
        };
    </script>
</body>
</html>
