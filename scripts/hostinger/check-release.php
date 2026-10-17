<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { exit(1); }
$release = realpath($argv[1] ?? '');
$site = dirname(__DIR__);
if (!$release || !str_starts_with($release, $site . '/releases/')) throw new RuntimeException('Invalid release path');
require $release . '/api/bootstrap.php';
db()->query('SELECT COUNT(*) FROM quiz_questions')->fetchColumn();
$applied = db()->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
foreach (json_decode(file_get_contents($release . '/required-migrations.json'), true, 512, JSON_THROW_ON_ERROR) as $migration) {
    if (!in_array($migration, $applied, true)) throw new RuntimeException('Apply migration explicitly before deployment: ' . $migration);
}
echo "Candidate PHP and database check OK\n";
