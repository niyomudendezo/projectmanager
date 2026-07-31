<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleTasks(string $method, array $segments): void {
    $user = requireAuth();
    $userId = $user['sub'];
    $db = getDB();
    $taskId = isset($segments[1]) ? (int)$segments[1] : null;
    $action = $segments[2] ?? null;

    function verifyTaskOwner(PDO $db, int $taskId, int $userId): bool {
        $stmt = $db->prepare('SELECT t.id FROM tasks t JOIN columns_table c ON t.column_id = c.id JOIN projects p ON c.project_id = p.id WHERE t.id = ? AND (p.user_id = ? OR EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ? AND pc.status = "accepted"))');
        $stmt->execute([$taskId, $userId, $userId]);
        return (bool)$stmt->fetch();
    }

    function verifyColumnOwner(PDO $db, int $columnId, int $userId): bool {
        $stmt = $db->prepare('SELECT c.id FROM columns_table c JOIN projects p ON c.project_id = p.id WHERE c.id = ? AND (p.user_id = ? OR EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ? AND pc.status = "accepted"))');
        $stmt->execute([$columnId, $userId, $userId]);
        return (bool)$stmt->fetch();
    }

    if ($method === 'GET' && $taskId) {
        if (!verifyTaskOwner($db, $taskId, $userId)) { http_response_code(404); echo json_encode(['error' => 'Task not found']); return; }
        $stmt = $db->prepare('SELECT t.*, c.name AS column_name, c.position AS column_position, p.id AS project_id, p.name AS project_name, p.description AS project_description FROM tasks t JOIN columns_table c ON c.id = t.column_id JOIN projects p ON p.id = c.project_id WHERE t.id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        $stmt = $db->prepare('SELECT id, name, position FROM columns_table WHERE project_id = ? ORDER BY position');
        $stmt->execute([$task['project_id']]);
        $task['project_columns'] = $stmt->fetchAll();
        echo json_encode($task);
        return;
    }

    if ($method === 'POST' && !$taskId) {
        $data = json_decode(file_get_contents('php://input'), true);
        $columnId = (int)($data['column_id'] ?? 0);
        $title = trim($data['title'] ?? '');
        if (!$columnId || !$title) { http_response_code(400); echo json_encode(['error' => 'column_id and title required']); return; }
        if (!verifyColumnOwner($db, $columnId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }

        $stmt = $db->prepare('SELECT COALESCE(MAX(position),0)+1 as pos FROM tasks WHERE column_id = ?');
        $stmt->execute([$columnId]);
        $pos = $stmt->fetch()['pos'];

        $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
        $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
        $startTime = !empty($data['start_time']) ? $data['start_time'] : null;
        $endTime = !empty($data['end_time']) ? $data['end_time'] : null;
        if ($startDate && $endDate && ($endDate < $startDate || ($endDate === $startDate && $startTime && $endTime && $endTime < $startTime))) {
            http_response_code(400); echo json_encode(['error' => 'End date and time must be after the start']); return;
        }

        $stmt = $db->prepare('INSERT INTO tasks (column_id, title, description, priority, start_date, end_date, start_time, end_time, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$columnId, $title, $data['description'] ?? '', $data['priority'] ?? 'medium', $startDate, $endDate, $startTime, $endTime, $pos]);
        $newId = (int)$db->lastInsertId();

        http_response_code(201);
        echo json_encode(['id' => $newId, 'column_id' => $columnId, 'title' => $title, 'description' => $data['description'] ?? '', 'priority' => $data['priority'] ?? 'medium', 'start_date' => $startDate, 'end_date' => $endDate, 'start_time' => $startTime, 'end_time' => $endTime, 'position' => $pos]);
        return;
    }

    if ($method === 'PUT' && $taskId && $action === 'move') {
        if (!verifyTaskOwner($db, $taskId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }
        $data = json_decode(file_get_contents('php://input'), true);
        $newColumnId = (int)($data['column_id'] ?? 0);
        $newPosition = (int)($data['position'] ?? 0);
        if (!verifyColumnOwner($db, $newColumnId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }

        $db->beginTransaction();
        // Shift tasks in target column to make room
        $db->prepare('UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ?')->execute([$newColumnId, $newPosition]);
        $db->prepare('UPDATE tasks SET column_id = ?, position = ? WHERE id = ?')->execute([$newColumnId, $newPosition, $taskId]);
        $db->commit();

        echo json_encode(['success' => true]);
        return;
    }

    if ($method === 'PUT' && $taskId) {
        if (!verifyTaskOwner($db, $taskId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }
        $data = json_decode(file_get_contents('php://input'), true);
        $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
        $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
        $startTime = !empty($data['start_time']) ? $data['start_time'] : null;
        $endTime = !empty($data['end_time']) ? $data['end_time'] : null;
        if ($startDate && $endDate && ($endDate < $startDate || ($endDate === $startDate && $startTime && $endTime && $endTime < $startTime))) {
            http_response_code(400); echo json_encode(['error' => 'End date and time must be after the start']); return;
        }
        $stmt = $db->prepare('UPDATE tasks SET title = ?, description = ?, priority = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ? WHERE id = ?');
        $stmt->execute([$data['title'], $data['description'] ?? '', $data['priority'] ?? 'medium', $startDate, $endDate, $startTime, $endTime, $taskId]);
        echo json_encode(['success' => true]);
        return;
    }

    if ($method === 'DELETE' && $taskId) {
        if (!verifyTaskOwner($db, $taskId, $userId)) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); return; }
        $db->prepare('DELETE FROM tasks WHERE id = ?')->execute([$taskId]);
        echo json_encode(['success' => true]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
