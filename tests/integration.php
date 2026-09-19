<?php
declare(strict_types=1);

// Requires an EMPTY disposable database; never operates on the normal application DB.
$database = getenv('QUIZ_HERO_DB_NAME') ?: '';
if (!preg_match('/^quiz_hero_audit_[a-z0-9]+$/D', $database)) {
    throw new RuntimeException('Use an empty quiz_hero_audit_* database.');
}
require __DIR__ . '/../database/migrate.php';
$pdo = db();
if ($pdo->query('SHOW TABLES')->fetchAll() !== []) throw new RuntimeException('Test database must be empty.');

$checks = 0;
function check(bool $condition, string $label): void {
    global $checks;
    if (!$condition) throw new RuntimeException('FAILED: ' . $label);
    $checks++;
    echo "PASS: {$label}\n";
}
function execute_sql_file(string $file): void {
    foreach (split_sql_statements(file_get_contents($file)) as $sql) db()->exec($sql);
}
function clear_test_tables(): void {
    // Guard repeated at the destructive boundary.
    if (!preg_match('/^quiz_hero_audit_[a-z0-9]+$/D', (string) db()->query('SELECT DATABASE()')->fetchColumn())) throw new RuntimeException('Unsafe database.');
    db()->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach (db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $table) {
        if (!preg_match('/^[a-z_]+$/D', $table)) throw new RuntimeException('Unexpected table.');
        db()->exec('DROP TABLE `' . $table . '`');
    }
    db()->exec('SET FOREIGN_KEY_CHECKS=1');
}

$server = null;
$log = tempnam(sys_get_temp_dir(), 'quiz-audit-http-');
$runtime = $log . '-runtime';
mkdir($runtime, 0700);
try {
    main();
    check(count(applied_migrations($pdo)) === count(migration_files()), 'empty database -> complete migration chain');
    main();
    check(count(applied_migrations($pdo)) === count(migration_files()), 'migration rerun is idempotent');
    clear_test_tables();
    execute_sql_file(__DIR__ . '/../database/schema.sql');
    main();
    check(count(applied_migrations($pdo)) === count(migration_files()), 'new snapshot -> no duplicate columns');
    $pdo->exec("DELETE FROM schema_migrations WHERE version >= '004'");
    main();
    check(count(applied_migrations($pdo)) === count(migration_files()), 'legacy snapshot with reviewed already present -> upgrade succeeds');

    $suffix = bin2hex(random_bytes(5));
    $password = 'Audit-first-' . $suffix;
    $newPassword = 'Audit-next-' . $suffix;
    $username = 'audit' . $suffix;
    $stmt = $pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key,email_verified_at) VALUES(?,?,?,?,NOW())');
    $stmt->execute([$username, $username . '@example.test', password_hash($password, PASSWORD_DEFAULT), 'hero']);
    $userId = (int) $pdo->lastInsertId();
    $pdo->exec("INSERT INTO quiz_categories(id,title,badge_json) VALUES ('audit','Audit',JSON_OBJECT('active',false,'text',''))");
    $pdo->exec("INSERT INTO quiz_tags(id,title) VALUES ('Antike','Antike')");
    $stmt = $pdo->prepare('INSERT INTO quiz_questions(category_id,question,answers_json,correct_index,image_url,tags_json) VALUES(?,?,?,?,?,?)');
    $stmt->execute(['audit', 'Audit question', '["A","B","C","D"]', 0, '/images/audit.png', '["antike"]']);
    $questionId = (int) $pdo->lastInsertId();
    foreach (['correctFirstTry','correctSecondTry','incorrectFirstTry','incorrectSecondTry','difficultCorrectFirstTry'] as $key) {
        $pdo->prepare('INSERT INTO quiz_feedback(feedback_key,messages_json) VALUES (?,?)')->execute([$key,'["Test"]']);
    }

    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    $env = getenv();
    $env['TMPDIR'] = $runtime;
    $env['QUIZ_HERO_ADMIN_USER'] = 'audit-admin-' . $suffix;
    $env['QUIZ_HERO_ADMIN_PASSWORD'] = $password;
    $env['QUIZ_HERO_ADMIN_PASSWORD_HASH'] = '';
    $env['QUIZ_HERO_ALLOW_DEV_ACCOUNT_LOGIN'] = 'false';
    $env['QUIZ_HERO_MAIL_TRANSPORT'] = 'disabled-test-transport';
    $env['QUIZ_HERO_SEO_EXPORT_TOKEN'] = 'audit-export-' . $suffix;
    $env['SITE_URL'] = 'http://' . $address;
    $server = proc_open([PHP_BINARY, '-S', $address, '-t', dirname(__DIR__)], [['pipe','r'], ['file',$log,'a'], ['file',$log,'a']], $pipes, dirname(__DIR__), $env);
    if (!is_resource($server)) throw new RuntimeException('Could not start isolated API server.');
    for ($i=0; $i<50; $i++) {
        $probe = @stream_socket_client('tcp://' . $address, $errno, $errstr, 0.1);
        if ($probe) { fclose($probe); break; }
        usleep(100000);
    }
    $cookie = '';
    $csrf = '';
    function request(string $action, ?array $payload = null, int $expected = 200): array {
        global $address, $cookie, $csrf;
        $headers = "Content-Type: application/json\r\n";
        if ($cookie !== '') $headers .= "Cookie: {$cookie}\r\n";
        if ($csrf !== '') $headers .= "X-Quiz-Hero-CSRF: {$csrf}\r\n";
        $context = stream_context_create(['http'=>['method'=>$payload === null ? 'GET' : 'POST','header'=>$headers,'content'=>$payload === null ? '' : json_encode($payload),'ignore_errors'=>true,'timeout'=>10]]);
        $body = file_get_contents('http://' . $address . '/api/index.php?action=' . $action . '&v=1', false, $context);
        preg_match('~HTTP/\S+ (\d+)~', $http_response_header[0] ?? '', $status);
        foreach ($http_response_header as $header) if (preg_match('/^Set-Cookie: ([^;]+)/i', $header, $match)) $cookie = $match[1];
        $data = json_decode((string) $body, true);
        if ((int) ($status[1] ?? 0) !== $expected || !is_array($data)) throw new RuntimeException("{$action}: expected HTTP {$expected}, got " . ($status[1] ?? '?') . '; ' . ($data['error'] ?? 'invalid JSON'));
        return $data;
    }
    function auth(array $user): array { return ['userId'=>$user['id'],'userToken'=>$user['token']]; }

    request('admin-data', null, 401);
    $login = ['identifier'=>$username,'password'=>$password];
    $one = request('account-login', $login)['user'];
    $two = request('account-login', $login)['user'];
    check($one['token'] !== $two['token'], 'independent opaque login sessions');
    check(request('account-me', auth($one))['user']['token'] === $one['token'], 'account-me does not replace or extend absolute token lifetime');
    check($pdo->query('SELECT token_hash FROM quiz_user_sessions LIMIT 1')->fetchColumn() !== $one['token'], 'session store contains hashes, not bearer tokens');
    request('account-logout', auth($one));
    request('account-me', auth($one), 401);
    request('account-me', auth($two));
    check(true, 'logout revokes current session; other session remains usable');
    request('account-update', auth($two)+['password'=>$newPassword], 403);
    $three = request('account-update', auth($two)+['password'=>$newPassword,'currentPassword'=>$password])['user'];
    request('account-me', auth($two), 401);
    request('account-me', auth($three));
    check(true, 'password change requires current password and revokes old sessions');
    $reset = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO quiz_password_resets(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))')->execute([$userId,hash('sha256',$reset)]);
    $four = request('account-reset-password', ['token'=>$reset,'password'=>$password])['user'];
    request('account-me', auth($three), 401);
    request('account-reset-password', ['token'=>$reset,'password'=>$password], 400);
    check(true, 'reset revokes sessions and reset link cannot be reused');
    $pdo->prepare('UPDATE quiz_user_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE token_hash=?')->execute([hash('sha256',$four['token'])]);
    request('account-me', auth($four), 401);
    $five = request('account-login', $login)['user'];
    $pdo->prepare('UPDATE quiz_user_sessions SET last_seen_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 DAY) WHERE token_hash=?')->execute([hash('sha256',$five['token'])]);
    request('account-me', auth($five), 401);
    check(true, 'absolute and idle expiration enforced');
    $six = request('account-login', $login)['user'];
    request('save-result', auth($six)+['score'=>10,'maxScore'=>2,'solved'=>1,'total'=>1], 422);
    request('save-result', auth($six)+['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1]);
    $pdo->prepare('UPDATE quiz_users SET deleted_at=NOW() WHERE id=?')->execute([$userId]);
    request('save-result', auth($six)+['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1], 401);
    $pdo->prepare('UPDATE quiz_users SET deleted_at=NULL WHERE id=?')->execute([$userId]);
    check(true, 'result invariants and active-account requirement enforced');
    request('account-delete', auth($six)+['confirm'=>'DELETE'], 403);
    request('account-delete', auth($six)+['confirm'=>'DELETE','currentPassword'=>$password]);
    request('account-me', auth($six), 401);
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_user_sessions')->fetchColumn() === 0, 'account deletion requires password, revokes all sessions, and notification failure does not undo success');

    $pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key) VALUES(?,?,?,?)')->execute(['verify'.$suffix,'verify'.$suffix.'@example.test',password_hash($password,PASSWORD_DEFAULT),'hero']);
    $verificationUser = (int) $pdo->lastInsertId();
    $verification = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO quiz_email_verifications(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))')->execute([$verificationUser,hash('sha256',$verification)]);
    $verified = request('account-verify-email', ['token'=>$verification])['user'];
    request('account-me', auth($verified));
    request('account-verify-email', ['token'=>$verification], 400);
    check(true, 'verification produces usable session and cannot be replayed');

    $admin = request('admin-login', ['username'=>$env['QUIZ_HERO_ADMIN_USER'],'password'=>$password]);
    $csrf = $admin['csrfToken'];
    request('admin-question-save', ['id'=>$questionId,'categoryId'=>'audit','question'=>'Updated audit','answers'=>['A','B','C','D'],'correct'=>0,'difficulty'=>'easy','imageUrl'=>'/images/audit.png','tags'=>'Antike, antike, ','active'=>true]);
    $saved = $pdo->query('SELECT image_url,tags_json FROM quiz_questions')->fetch();
    check($saved['image_url'] === '/images/audit.png' && json_decode($saved['tags_json'], true) === ['Antike'], 'question edit retains root-relative image and canonical tag IDs');
    request('admin-question-save', ['id'=>$questionId,'categoryId'=>'audit','question'=>'Unsafe','answers'=>['A','B','C','D'],'correct'=>0,'imageUrl'=>'images/../api/index.php'], 422);
    check($pdo->query('SELECT image_url FROM quiz_questions')->fetchColumn() === '/images/audit.png', 'invalid image rejected without clearing saved image');
    request('admin-category-save', ['id'=>'audit','title'=>'Audit','enabled'=>true,'badgeActive'=>false,'badgeText'=>'']);
    $public = request('public-data');
    check($public['categories'][0]['badge']['active'] === false && $public['categories'][0]['badge']['text'] === '', 'inactive empty badge round-trip');
    request('admin-question-import', ['questions'=>[['categoryId'=>'','question'=>'Missing category','answers'=>['A','B','C','D'],'correct'=>0]]], 422);
    request('admin-question-import', ['questions'=>[], 'padding'=>str_repeat('x',1048576)], 413);
    check(true, 'invalid import and payload exceeding 1 MiB rejected');
    foreach (['/images/a.png','images/a.png','https://example.test/a.png'] as $url) check(clean_url($url) === $url, 'supported image path accepted');
    foreach (['images/../api/config.local.php','images/%2e%2e/a','images/%5c../a','javascript:alert(1)','file:///etc/passwd'] as $url) check(clean_url($url) === '', 'unsafe image path rejected');

    $legacyLog = __DIR__ . '/../var/mail.log';
    $before = is_file($legacyLog) ? hash_file('sha256', $legacyLog) : null;
    request('account-register', ['username'=>'mail' . $suffix,'email'=>'mail' . $suffix . '@example.test','password'=>$password,'privacyAccepted'=>true], 500);
    check((is_file($legacyLog) ? hash_file('sha256',$legacyLog) : null) === $before, 'mail delivery failure never creates or appends a webroot mail log');
    check((int) $pdo->query("SELECT COUNT(*) FROM quiz_users WHERE username = 'mail{$suffix}'")->fetchColumn() === 0, 'failed verification delivery rolls back registration');
    echo "{$checks} integration checks passed.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    @unlink($log);
    foreach (glob($runtime . '/quiz-hero-rate-limits/*.json') ?: [] as $file) unlink($file);
    if (is_dir($runtime . '/quiz-hero-rate-limits')) rmdir($runtime . '/quiz-hero-rate-limits');
    foreach (glob($runtime . '/sess_*') ?: [] as $file) unlink($file);
    rmdir($runtime);
    clear_test_tables();
}
