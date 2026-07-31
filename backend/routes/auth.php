<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

function handleAuth(string $method, array $segments): void {
    $action = $segments[1] ?? '';

    if ($method === 'POST' && $action === 'register') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$name || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email']);
            return;
        }

        $db = getDB();
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already registered']);
            return;
        }

        $stmt = $db->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?) RETURNING id');
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT)]);
        $userId = (int)$stmt->fetchColumn();

        // Create default project
        $stmt = $db->prepare('INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?) RETURNING id');
        $stmt->execute([$userId, 'My First Project', 'Welcome to your project board!']);
        $projectId = (int)$stmt->fetchColumn();

        // Create default columns
        foreach ([['To Do', 0], ['In Progress', 1], ['Done', 2]] as [$colName, $pos]) {
            $stmt = $db->prepare('INSERT INTO columns_table (project_id, name, position) VALUES (?, ?, ?)');
            $stmt->execute([$projectId, $colName, $pos]);
        }

        $token = jwtEncode(['sub' => $userId, 'name' => $name, 'email' => $email]);
        echo json_encode(['token' => $token, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email]]);
        return;
    }

    if ($method === 'POST' && $action === 'login') {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        $db = getDB();
        $stmt = $db->prepare('SELECT id, name, email, password FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        $token = jwtEncode(['sub' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]);
        echo json_encode(['token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
