<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleColumns(string $method, array $segments): void {
    $user = requireAuth();
    $userId = $user['sub'];
    $db = getDB();
    $columnId = isset($segments[1]) ? (int)$segments[1] : null;

    // Verify column belongs to user's project
    function verifyColumn(PDO $db, int $columnId, int $userId): bool {
        $stmt = $db->prepare('SELECT c.id FROM columns_table c JOIN projects p ON c.project_id = p.id WHERE c.id = ? AND (p.user_id = ? OR EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ? AND pc.status = "accepted"))');
        $stmt->execute([$columnId, $userId, $userId]);
        return (bool)$stmt->fetch();
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $projectId = (int)($data['project_id'] ?? 0);
        $name = trim($data['name'] ?? '');
        if (!$projectId || !$name) { http_response_code(400); echo json_encode(['error' => 'project_id and name required']); return; }

        $stmt = $db->prepare('SELECT id FROM projects WHERE id = ? AND (user_id = ? OR EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = projects.id AND pc.user_id = ? AND pc.status = "accepted"))');
        $stmt->execute([$projectId, $userId, $userId]);
        if (!$stmt->fetch()) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }

        $stmt = $db->prepare('SELECT COALESCE(MAX(position),0)+1 as pos FROM columns_table WHERE project_id = ?');
        $stmt->execute([$projectId]);
        $pos = $stmt->fetch()['pos'];

        $stmt = $db->prepare('INSERT INTO columns_table (project_id, name, position) VALUES (?, ?, ?)');
        $stmt->execute([$projectId, $name, $pos]);
        $newId = (int)$db->lastInsertId();

        http_response_code(201);
        echo json_encode(['id' => $newId, 'project_id' => $projectId, 'name' => $name, 'position' => $pos, 'tasks' => []]);
        return;
    }

    if ($method === 'PUT' && $columnId) {
        if (!verifyColumn($db, $columnId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare('UPDATE columns_table SET name = ? WHERE id = ?');
        $stmt->execute([$data['name'], $columnId]);
        echo json_encode(['success' => true]);
        return;
    }

    if ($method === 'DELETE' && $columnId) {
        if (!verifyColumn($db, $columnId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }
        $stmt = $db->prepare('DELETE FROM columns_table WHERE id = ?');
        $stmt->execute([$columnId]);
        echo json_encode(['success' => true]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
