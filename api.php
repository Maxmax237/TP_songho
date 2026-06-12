<?php
/**
 * API Songho Multi-joueur
 * Gestion des parties à distance
 */

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion MySQL
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Génération code aléatoire
function generateRoomCode($pdo) {
    $characters = '0123456789';
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }
        $stmt = $pdo->prepare("SELECT 1 FROM game_rooms WHERE room_code = ?");
        $stmt->execute([$code]);
    } while ($stmt->fetch());
    return $code;
}

// Génération ID joueur
function generatePlayerId() {
    return bin2hex(random_bytes(16));
}

// État initial
function getInitialState() {
    return [
        'boardNorth' => array_fill(0, NB_PITS, INITIAL_SEEDS),
        'boardSouth' => array_fill(0, NB_PITS, INITIAL_SEEDS),
        'capturedNorth' => 0,
        'capturedSouth' => 0,
        'currentPlayer' => 'south',
        'gameActive' => true,
        'gameEnded' => false,
        'winner' => null
    ];
}

// Charger état depuis BDD
function loadGameState($pdo, $roomCode) {
    $stmt = $pdo->prepare("SELECT * FROM game_rooms WHERE room_code = ?");
    $stmt->execute([$roomCode]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$room) return null;
    
    return [
        'boardNorth' => array_map('intval', explode(',', $room['board_north'])),
        'boardSouth' => array_map('intval', explode(',', $room['board_south'])),
        'capturedNorth' => (int)$room['captured_north'],
        'capturedSouth' => (int)$room['captured_south'],
        'currentPlayer' => $room['current_player'],
        'gameActive' => (bool)$room['game_active'],
        'gameEnded' => (bool)$room['game_ended'],
        'winner' => $room['winner']
    ];
}

// Sauvegarder état
function saveGameState($pdo, $roomCode, $state) {
    $stmt = $pdo->prepare("UPDATE game_rooms SET 
        board_north = ?,
        board_south = ?,
        captured_north = ?,
        captured_south = ?,
        current_player = ?,
        game_active = ?,
        game_ended = ?,
        winner = ?,
        last_move = NOW()
        WHERE room_code = ?");
    
    return $stmt->execute([
        implode(',', $state['boardNorth']),
        implode(',', $state['boardSouth']),
        $state['capturedNorth'],
        $state['capturedSouth'],
        $state['currentPlayer'],
        $state['gameActive'] ? 1 : 0,
        $state['gameEnded'] ? 1 : 0,
        $state['winner'],
        $roomCode
    ]);
}

// Vérifier fin de partie
function checkGameOver(&$state) {
    $southTotal = array_sum($state['boardSouth']);
    $northTotal = array_sum($state['boardNorth']);
    
    if ($southTotal === 0 || $northTotal === 0) {
        $state['gameEnded'] = true;
        $state['gameActive'] = false;
        
        if ($southTotal === 0 && $northTotal > 0) {
            $state['capturedNorth'] += $northTotal;
            $state['boardNorth'] = array_fill(0, NB_PITS, 0);
            $state['winner'] = '🏆 JOUEUR 1 (haut) gagne ! 🏆';
        } elseif ($northTotal === 0 && $southTotal > 0) {
            $state['capturedSouth'] += $southTotal;
            $state['boardSouth'] = array_fill(0, NB_PITS, 0);
            $state['winner'] = '🏆 JOUEUR 2 (bas) gagne ! 🏆';
        } else {
            $state['winner'] = '🤝 Égalité ! 🤝';
        }
        return true;
    }
    return false;
}

function getNextPosition($player, $idx) {
    if ($player === 'south') {
        if ($idx + 1 < NB_PITS) return ['player' => 'south', 'index' => $idx + 1];
        else return ['player' => 'north', 'index' => 0];
    } else {
        if ($idx + 1 < NB_PITS) return ['player' => 'north', 'index' => $idx + 1];
        else return ['player' => 'south', 'index' => 0];
    }
}

// Exécuter un mouvement
function executeMove(&$state, $player, $pitIndex) {
    if (!$state['gameActive'] || $state['gameEnded']) {
        return ['success' => false, 'error' => 'Partie terminée'];
    }
    
    if ($state['currentPlayer'] !== $player) {
        return ['success' => false, 'error' => 'Ce n\'est pas votre tour'];
    }
    
    $board = ($player === 'north') ? 'boardNorth' : 'boardSouth';
    $seeds = $state[$board][$pitIndex];
    
    if ($seeds <= 0) {
        return ['success' => false, 'error' => 'Case vide'];
    }
    
    $state[$board][$pitIndex] = 0;
    
    // Distribution
    $pos = ['player' => $player, 'index' => $pitIndex];
    $remaining = $seeds;
    $first = true;
    $lastPos = null;
    
    while ($remaining > 0) {
        if ($first) {
            $pos = getNextPosition($pos['player'], $pos['index']);
            $first = false;
        } else {
            $pos = getNextPosition($pos['player'], $pos['index']);
        }
        
        $targetBoard = ($pos['player'] === 'north') ? 'boardNorth' : 'boardSouth';
        $state[$targetBoard][$pos['index']]++;
        $remaining--;
        $lastPos = $pos;
    }
    
    // Capture
    $captureHappened = false;
    if ($lastPos && $lastPos['player'] !== $player) {
        $targetBoard = ($lastPos['player'] === 'north') ? 'boardNorth' : 'boardSouth';
        $countAfter = $state[$targetBoard][$lastPos['index']];
        if ($countAfter === 2 || $countAfter === 3) {
            if ($player === 'north') {
                $state['capturedNorth'] += $countAfter;
            } else {
                $state['capturedSouth'] += $countAfter;
            }
            $state[$targetBoard][$lastPos['index']] = 0;
            $captureHappened = true;
        }
    }
    
    // Rejouer
    $replay = false;
    if (!$captureHappened && $lastPos && $lastPos['player'] === $player) {
        $ownBoard = ($player === 'north') ? 'boardNorth' : 'boardSouth';
        if ($state[$ownBoard][$lastPos['index']] > 1) {
            $replay = true;
        }
    }
    
    // Changer de joueur
    if (!$replay) {
        $state['currentPlayer'] = ($state['currentPlayer'] === 'north') ? 'south' : 'north';
    }
    
    // Vérifier fin
    checkGameOver($state);
    
    return ['success' => true, 'message' => $replay ? 'Vous rejouez !' : 'Tour terminé'];
}

// ==================== TRAITEMENT DES REQUÊTES ====================
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? null;

$response = ['success' => false];

switch ($action) {
    case 'create_room':
        $roomCode = generateRoomCode($pdo);
        $playerId = generatePlayerId();
        $state = getInitialState();
        
        $stmt = $pdo->prepare("INSERT INTO game_rooms (room_code, board_north, board_south, player_north_id, current_player) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $roomCode,
            implode(',', $state['boardNorth']),
            implode(',', $state['boardSouth']),
            $playerId,
            'south'
        ]);
        
        $_SESSION['player_id'] = $playerId;
        
        $response = [
            'success' => true,
            'roomCode' => $roomCode,
            'playerId' => $playerId,
            'role' => 'north',
            'state' => $state,
            'message' => 'Partie créée ! Partagez le code avec votre adversaire.'
        ];
        break;
        
    case 'join_room':
        $roomCode = $input['roomCode'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM game_rooms WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        $room = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$room) {
            $response = ['success' => false, 'error' => 'Partie introuvable'];
            break;
        }
        
        if ($room['player_south_id'] !== null) {
            $response = ['success' => false, 'error' => 'Partie pleine'];
            break;
        }
        
        $playerId = generatePlayerId();
        $stmt = $pdo->prepare("UPDATE game_rooms SET player_south_id = ? WHERE room_code = ?");
        $stmt->execute([$playerId, $roomCode]);
        
        $state = loadGameState($pdo, $roomCode);
        
        $response = [
            'success' => true,
            'roomCode' => $roomCode,
            'playerId' => $playerId,
            'role' => 'south',
            'state' => $state,
            'message' => 'Partie rejointe ! Attendez votre tour.'
        ];
        break;
        
    case 'get_state':
        $roomCode = $input['roomCode'] ?? '';
        $state = loadGameState($pdo, $roomCode);
        if ($state) {
            $response = ['success' => true, 'state' => $state];
        } else {
            $response = ['success' => false, 'error' => 'Partie introuvable'];
        }
        break;
        
    case 'move':
        $roomCode = $input['roomCode'] ?? '';
        $player = $input['player'] ?? '';
        $pitIndex = (int)($input['pitIndex'] ?? -1);
        
        if ($pitIndex < 0 || $pitIndex >= NB_PITS) {
            $response = ['success' => false, 'error' => 'Case invalide'];
            break;
        }
        
        $state = loadGameState($pdo, $roomCode);
        if (!$state) {
            $response = ['success' => false, 'error' => 'Partie introuvable'];
            break;
        }
        
        $result = executeMove($state, $player, $pitIndex);
        if ($result['success']) {
            saveGameState($pdo, $roomCode, $state);
            $response = ['success' => true, 'state' => $state, 'message' => $result['message']];
        } else {
            $response = $result;
        }
        break;
        
    case 'reset_room':
        $roomCode = $input['roomCode'] ?? '';
        $state = getInitialState();
        
        // Conserver les joueurs
        $stmt = $pdo->prepare("SELECT player_north_id, player_south_id FROM game_rooms WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        $room = $stmt->fetch(PDO::FETCH_ASSOC);
        
        saveGameState($pdo, $roomCode, $state);
        
        // Remettre current_player à south
        $stmt = $pdo->prepare("UPDATE game_rooms SET current_player = 'south', game_active = 1, game_ended = 0, winner = NULL WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        
        $state['currentPlayer'] = 'south';
        
        $response = ['success' => true, 'state' => $state, 'message' => 'Partie réinitialisée !'];
        break;
        
    case 'quit_room':
        $roomCode = $input['roomCode'] ?? '';
        $playerId = $input['playerId'] ?? null;
        
        if ($roomCode && $playerId) {
            // Supprimer le joueur de la salle
            $stmt = $pdo->prepare("UPDATE game_rooms SET player_north_id = IF(player_north_id = ?, NULL, player_north_id), player_south_id = IF(player_south_id = ?, NULL, player_south_id) WHERE room_code = ?");
            $stmt->execute([$playerId, $playerId, $roomCode]);
            
            // Nettoyer les salles vides
            $stmt = $pdo->prepare("DELETE FROM game_rooms WHERE room_code = ? AND player_north_id IS NULL AND player_south_id IS NULL");
            $stmt->execute([$roomCode]);
        }
        $response = ['success' => true, 'message' => 'Vous avez quitté la partie'];
        break;
        
    default:
        $response = ['success' => false, 'error' => 'Action inconnue'];
}

echo json_encode($response);
