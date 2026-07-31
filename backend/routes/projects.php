<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleProjects(string $method, array $segments): void {
    $user = requireAuth();
    $userId = $user['sub'];
    $db = getDB();
    $projectId = isset($segments[1]) ? (int)$segments[1] : null;
    $action = $segments[2] ?? null;

    if ($projectId && $action === 'collaborators') {
        $ownerStmt = $db->prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?');
        $ownerStmt->execute([$projectId, $userId]);
        if (!$ownerStmt->fetch()) { http_response_code(403); echo json_encode(['error' => 'Only the project owner can manage collaborators']); return; }

        if ($method === 'GET') {
            $stmt = $db->prepare('SELECT u.id, u.name, u.email, pc.status, pc.created_at FROM project_collaborators pc JOIN users u ON u.id = pc.user_id WHERE pc.project_id = ? ORDER BY pc.created_at DESC');
            $stmt->execute([$projectId]);
            echo json_encode($stmt->fetchAll());
            return;
        }

        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = strtolower(trim($data['email'] ?? ''));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Enter a valid email address']); return; }
            $stmt = $db->prepare('SELECT id, name, email FROM users WHERE LOWER(email) = ?');
            $stmt->execute([$email]);
            $collaborator = $stmt->fetch();
            if (!$collaborator) { http_response_code(404); echo json_encode(['error' => 'No registered user was found with this email']); return; }
            if ((int)$collaborator['id'] === (int)$userId) { http_response_code(400); echo json_encode(['error' => 'You already own this project']); return; }
            $stmt = $db->prepare('SELECT 1 FROM project_collaborators WHERE project_id = ? AND user_id = ?');
            $stmt->execute([$projectId, $collaborator['id']]);
            if ($stmt->fetch()) { http_response_code(409); echo json_encode(['error' => 'This user is already a collaborator']); return; }
            $db->prepare('INSERT INTO project_collaborators (project_id, user_id, invited_by) VALUES (?, ?, ?)')->execute([$projectId, $collaborator['id'], $userId]);
            http_response_code(201);
            echo json_encode(['id' => (int)$collaborator['id'], 'name' => $collaborator['name'], 'email' => $collaborator['email'], 'status' => 'pending']);
            return;
        }
    }

    if ($method === 'GET' && !$projectId) {
        // Personal dashboard data is strictly owner-scoped. Shared projects are
        // intentionally listed through the invitations endpoint instead.
        $stmt = $db->prepare('SELECT p.*, "owner" AS role FROM projects p WHERE p.user_id = ? ORDER BY p.created_at DESC');
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll();

        // The dashboard needs real column/task totals and project progress. Return
        // the same nested persisted data as the single-project endpoint.
        $columnsStmt = $db->prepare('SELECT * FROM columns_table WHERE project_id = ? ORDER BY position');
        $tasksStmt = $db->prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY position');
        foreach ($projects as &$project) {
            $columnsStmt->execute([$project['id']]);
            $columns = $columnsStmt->fetchAll();
            foreach ($columns as &$column) {
                $tasksStmt->execute([$column['id']]);
                $column['tasks'] = $tasksStmt->fetchAll();
            }
            $project['columns'] = $columns;
        }
        echo json_encode($projects);
        return;
    }

    if ($method === 'GET' && $projectId) {
        $stmt = $db->prepare('SELECT p.*, CASE WHEN p.user_id = ? THEN "owner" ELSE "collaborator" END AS role FROM projects p WHERE p.id = ? AND (p.user_id = ? OR EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ? AND pc.status = "accepted"))');
        $stmt->execute([$userId, $projectId, $userId, $userId]);
        $project = $stmt->fetch();
        if (!$project) { http_response_code(404); echo json_encode(['error' => 'Not found']); return; }

        $stmt = $db->prepare('SELECT * FROM columns_table WHERE project_id = ? ORDER BY position');
        $stmt->execute([$projectId]);
        $columns = $stmt->fetchAll();

        foreach ($columns as &$col) {
            $stmt = $db->prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY position');
            $stmt->execute([$col['id']]);
            $col['tasks'] = $stmt->fetchAll();
        }

        $project['columns'] = $columns;
        echo json_encode($project);
        return;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name required']); return; }

        $stmt = $db->prepare('INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $name, $data['description'] ?? '']);
        $newId = (int)$db->lastInsertId();

        foreach ([['To Do', 0], ['In Progress', 1], ['Done', 2]] as [$colName, $pos]) {
            $stmt = $db->prepare('INSERT INTO columns_table (project_id, name, position) VALUES (?, ?, ?)');
            $stmt->execute([$newId, $colName, $pos]);
        }

        $stmt = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$newId]);
        http_response_code(201);
        echo json_encode($stmt->fetch());
        return;
    }

    if ($method === 'PUT' && $projectId) {
        $stmt = $db->prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?');
        $stmt->execute([$projectId, $userId]);
        if (!$stmt->fetch()) { http_response_code(404); echo json_encode(['error' => 'Not found']); return; }

        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?');
        $stmt->execute([$data['name'], $data['description'] ?? '', $projectId]);
        echo json_encode(['success' => true]);
        return;
    }

    if ($method === 'DELETE' && $projectId) {
        $stmt = $db->prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');
        $stmt->execute([$projectId, $userId]);
        echo json_encode(['success' => true]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
