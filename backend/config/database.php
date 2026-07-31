<?php

/**
 * Create a PostgreSQL connection for Supabase.
 *
 * Production hosts should provide DATABASE_URL (the Supabase transaction-pooler
 * URL is recommended). Individual SUPABASE_DB_* variables are also supported.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $databaseUrl = getenv('DATABASE_URL') ?: '';
    if ($databaseUrl !== '') {
        $parts = parse_url($databaseUrl);
        if ($parts === false || empty($parts['host']) || empty($parts['user'])) {
            throw new RuntimeException('DATABASE_URL is not a valid PostgreSQL URL');
        }

        $host = $parts['host'];
        $port = (int)($parts['port'] ?? 5432);
        $database = ltrim($parts['path'] ?? '/postgres', '/');
        $user = rawurldecode($parts['user']);
        $password = rawurldecode($parts['pass'] ?? '');
        parse_str($parts['query'] ?? '', $query);
        $sslMode = $query['sslmode'] ?? 'require';
    } else {
        $host = getenv('SUPABASE_DB_HOST') ?: '';
        $port = (int)(getenv('SUPABASE_DB_PORT') ?: 5432);
        $database = getenv('SUPABASE_DB_NAME') ?: 'postgres';
        $user = getenv('SUPABASE_DB_USER') ?: 'postgres';
        $password = getenv('SUPABASE_DB_PASSWORD') ?: '';
        $sslMode = getenv('SUPABASE_DB_SSLMODE') ?: 'require';
    }

    if ($host === '' || $password === '') {
        throw new RuntimeException(
            'Supabase database configuration is missing. Set DATABASE_URL or the SUPABASE_DB_* variables.'
        );
    }

    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
        $host,
        $port,
        $database,
        $sslMode
    );

    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
