<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo "This script can only be run from the command line.\n";
    exit(1);
}

require __DIR__ . '/../api/bootstrap.php';

const MIGRATIONS_TABLE = 'schema_migrations';

function ensure_migrations_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS ' . MIGRATIONS_TABLE . ' (
            version VARCHAR(190) PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

/**
 * @return array<string, true>
 */
function applied_migrations(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT version FROM ' . MIGRATIONS_TABLE);
    $versions = $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];

    $applied = [];
    foreach ($versions as $version) {
        $applied[(string)$version] = true;
    }

    return $applied;
}

/**
 * @return list<string>
 */
function migration_files(): array
{
    $files = glob(__DIR__ . '/migrations/*.sql') ?: [];
    sort($files, SORT_STRING);

    return array_values($files);
}

/**
 * @return list<string>
 */
function split_sql_statements(string $sql): array
{
    $sql = preg_replace('/^\xEF\xBB\xBF/', '', $sql) ?? $sql;
    $statements = [];
    $buffer = '';
    $quote = null;
    $escaped = false;
    $length = strlen($sql);

    for ($i = 0; $i < $length; $i++) {
        $char = $sql[$i];
        $next = $sql[$i + 1] ?? '';

        if ($quote === null && $char === '-' && $next === '-') {
            while ($i < $length && $sql[$i] !== "\n") {
                $i++;
            }
            $buffer .= "\n";
            continue;
        }

        if ($quote === null && $char === '/' && $next === '*') {
            $i += 2;
            while ($i < $length - 1 && !($sql[$i] === '*' && $sql[$i + 1] === '/')) {
                $i++;
            }
            $i++;
            continue;
        }

        if (($char === "'" || $char === '"') && !$escaped) {
            if ($quote === null) {
                $quote = $char;
            } elseif ($quote === $char) {
                $quote = null;
            }
        }

        if ($char === ';' && $quote === null) {
            $statement = trim($buffer);
            if ($statement !== '') {
                $statements[] = $statement;
            }
            $buffer = '';
            $escaped = false;
            continue;
        }

        $buffer .= $char;
        $escaped = ($char === '\\' && !$escaped);
        if ($char !== '\\') {
            $escaped = false;
        }
    }

    $statement = trim($buffer);
    if ($statement !== '') {
        $statements[] = $statement;
    }

    return $statements;
}

function apply_migration(PDO $pdo, string $file): void
{
    $version = basename($file);
    $sql = file_get_contents($file);
    if ($sql === false) {
        throw new RuntimeException("Could not read migration {$version}");
    }

    $statements = split_sql_statements($sql);
    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }

    $stmt = $pdo->prepare('INSERT IGNORE INTO ' . MIGRATIONS_TABLE . ' (version) VALUES (:version)');
    $stmt->execute(['version' => $version]);
}

function main(): int
{
    $pdo = db();
    ensure_migrations_table($pdo);
    $applied = applied_migrations($pdo);
    $pending = 0;

    foreach (migration_files() as $file) {
        $version = basename($file);
        if (isset($applied[$version])) {
            echo "Already applied: {$version}\n";
            continue;
        }

        echo "Applying: {$version}\n";
        apply_migration($pdo, $file);
        echo "Applied: {$version}\n";
        $pending++;
    }

    if ($pending === 0) {
        echo "No pending migrations.\n";
    }

    return 0;
}

try {
    exit(main());
} catch (Throwable $exception) {
    fwrite(STDERR, 'Migration failed: ' . $exception->getMessage() . "\n");
    exit(1);
}
