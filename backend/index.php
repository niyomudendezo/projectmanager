<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/projects.php';
require_once __DIR__ . '/routes/columns.php';
require_once __DIR__ . '/routes/tasks.php';
require_once __DIR__ . '/routes/invitations.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = '/projectmanager/backend/index.php';
$path = str_starts_with($uri, $base) ? substr($uri, strlen($base)) : $uri;
$segments = array_values(array_filter(explode('/', trim($path, '/'))));
$resource = $segments[0] ?? '';

try {
    match ($resource) {
        'auth'     => handleAuth($method, $segments),
        'projects' => handleProjects($method, $segments),
        'columns'  => handleColumns($method, $segments),
        'tasks'    => handleTasks($method, $segments),
        'invitations' => handleInvitations($method, $segments),
        default    => (function() { http_response_code(404); echo json_encode(['error' => 'Route not found']); })()
    };
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
