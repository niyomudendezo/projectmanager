<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleInvitations(string $method, array $segments): void {
    $user = requireAuth();
    $userId = (int)$user['sub'];
    $db = getDB();
    $projectId = isset($segments[1]) ? (int)$segments[1] : null;
    $action = $segments[2] ?? null;

    if ($method === 'GET' && !$projectId) {
        $stmt = $db->prepare('SELECT pc.project_id, pc.status, pc.created_at, p.name AS project_name, p.description AS project_description, u.name AS invited_by_name, u.email AS invited_by_email, (SELECT COUNT(*) FROM tasks t JOIN columns_table c ON c.id = t.column_id WHERE c.project_id = p.id) AS task_count FROM project_collaborators pc JOIN projects p ON p.id = pc.project_id JOIN users u ON u.id = pc.invited_by WHERE pc.user_id = ? ORDER BY pc.created_at DESC');
        $stmt->execute([$userId]);
        $invitations = $stmt->fetchAll();
        $tasksStmt = $db->prepare('SELECT t.id, t.title, t.description, t.priority, t.start_date, t.end_date, t.start_time, t.end_time, c.id AS column_id, c.name AS column_name FROM tasks t JOIN columns_table c ON c.id = t.column_id WHERE c.project_id = ? ORDER BY c.position, t.position');
        $teamStmt = $db->prepare("SELECT u.id, u.name, u.email, 'owner' AS role FROM projects p JOIN users u ON u.id = p.user_id WHERE p.id = ? UNION ALL SELECT u.id, u.name, u.email, 'collaborator' AS role FROM project_collaborators pc JOIN users u ON u.id = pc.user_id WHERE pc.project_id = ? AND pc.status = 'accepted'");
        foreach ($invitations as &$invitation) {
            $tasksStmt->execute([$invitation['project_id']]);
            $invitation['tasks'] = $tasksStmt->fetchAll();
            $teamStmt->execute([$invitation['project_id'], $invitation['project_id']]);
            $invitation['team'] = $teamStmt->fetchAll();
        }
        echo json_encode($invitations);
        return;
    }

    if ($method === 'PUT' && $projectId && $action === 'accept') {
        $stmt = $db->prepare("UPDATE project_collaborators SET status = 'accepted' WHERE project_id = ? AND user_id = ? AND status = 'pending'");
        $stmt->execute([$projectId, $userId]);
        if (!$stmt->rowCount()) { http_response_code(404); echo json_encode(['error' => 'Pending invitation not found']); return; }
        echo json_encode(['success' => true, 'project_id' => $projectId]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
