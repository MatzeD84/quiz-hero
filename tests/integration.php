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
$smtpServer = null;
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
    $originalSiteUrl = getenv('SITE_URL');
    putenv('SITE_URL=https://quiz.example.test');
    check(user_cookie_is_secure(), 'HTTPS site configuration enables Secure user cookies');
    putenv($originalSiteUrl === false ? 'SITE_URL' : 'SITE_URL=' . $originalSiteUrl);

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
    $server = proc_open([PHP_BINARY, '-S', $address, '-t', dirname(__DIR__) . '/public'], [['pipe','r'], ['file',$log,'a'], ['file',$log,'a']], $pipes, dirname(__DIR__), $env);
    if (!is_resource($server)) throw new RuntimeException('Could not start isolated API server.');
    for ($i=0; $i<50; $i++) {
        $probe = @stream_socket_client('tcp://' . $address, $errno, $errstr, 0.1);
        if ($probe) { fclose($probe); break; }
        usleep(100000);
    }
    $cookies = [];
    $csrf = '';
    $userCsrf = '';
    $lastResponseHeaders = [];
    function request(string $action, ?array $payload = null, int $expected = 200, string $extraHeaders = '', string|false|null $csrfOverride = null): array {
        global $address, $cookies, $csrf, $userCsrf, $lastResponseHeaders;
        $headers = "Content-Type: application/json\r\n" . $extraHeaders;
        if ($cookies !== []) {
            $pairs = [];
            foreach ($cookies as $name => $value) $pairs[] = $name . '=' . $value;
            $headers .= 'Cookie: ' . implode('; ', $pairs) . "\r\n";
        }
        $userCsrfActions = ['account-journey','start-round','account-logout','account-update','account-delete','save-result','question-feedback-save'];
        $token = str_starts_with($action, 'admin-') && $action !== 'admin-login' ? $csrf : (in_array($action, $userCsrfActions, true) ? $userCsrf : '');
        if ($csrfOverride === false) $token = '';
        elseif (is_string($csrfOverride)) $token = $csrfOverride;
        if ($token !== '') $headers .= "X-Quiz-Hero-CSRF: {$token}\r\n";
        $context = stream_context_create(['http'=>['method'=>$payload === null ? 'GET' : 'POST','header'=>$headers,'content'=>$payload === null ? '' : json_encode($payload),'ignore_errors'=>true,'timeout'=>10]]);
        $body = file_get_contents('http://' . $address . '/api/index.php?action=' . $action . '&v=1', false, $context);
        $lastResponseHeaders = $http_response_header ?? [];
        preg_match('~HTTP/\S+ (\d+)~', $http_response_header[0] ?? '', $status);
        foreach ($http_response_header as $header) {
            if (!preg_match('/^Set-Cookie: ([^=;]+)=([^;]*)/i', $header, $match)) continue;
            if ($match[2] === '' || stripos($header, 'Max-Age=0') !== false) unset($cookies[$match[1]]);
            else $cookies[$match[1]] = $match[2];
        }
        $data = json_decode((string) $body, true);
        if ((int) ($status[1] ?? 0) !== $expected || !is_array($data)) throw new RuntimeException("{$action}: expected HTTP {$expected}, got " . ($status[1] ?? '?') . '; ' . ($data['error'] ?? 'invalid JSON'));
        if (isset($data['csrfToken']) && !str_starts_with($action, 'admin-')) $userCsrf = (string) $data['csrfToken'];
        return $data;
    }
    function user_cookie(): string {
        global $cookies;
        return (string) ($cookies['quiz_hero_session'] ?? '');
    }

    request('admin-data', null, 401);
    request('account-journey', [], 401);
    request('account-journey', null, 405);
    $login = ['identifier'=>$username,'password'=>$password];
    $oneResponse = request('account-login', $login);
    $one = $oneResponse['user']; $oneCookies = $cookies; $oneCsrf = $userCsrf; $oneToken = user_cookie();
    check(!isset($one['token']) && strlen($oneToken) === 64, 'login keeps the opaque session out of JSON');
    check((bool) array_filter($lastResponseHeaders, static fn($header) => preg_match('/^Set-Cookie:\s*quiz_hero_session=[^;]+;.*path=\/.*HttpOnly.*SameSite=Lax/i', $header) === 1), 'session cookie has HttpOnly, SameSite and root path attributes');
    $two = request('account-login', $login)['user']; $twoCookies = $cookies; $twoCsrf = $userCsrf; $twoToken = user_cookie();
    check($oneToken !== $twoToken, 'independent opaque login sessions');
    $cookies = $oneCookies; $userCsrf = $oneCsrf;
    check(request('account-me', [])['csrfToken'] === $oneCsrf && user_cookie() === $oneToken, 'account-me does not replace the session or its CSRF token');
    check($pdo->query('SELECT token_hash FROM quiz_user_sessions LIMIT 1')->fetchColumn() !== $oneToken, 'session store contains hashes, not cookie values');
    request('account-logout', []);
    request('account-me', [], 401);
    $cookies = $twoCookies; $userCsrf = $twoCsrf;
    request('account-me', []);
    check(true, 'logout revokes current session; other session remains usable');
    request('account-update', ['password'=>$newPassword], 403);
    $three = request('account-update', ['password'=>$newPassword,'currentPassword'=>$password])['user'];
    $threeCookies = $cookies; $threeCsrf = $userCsrf;
    $cookies = $twoCookies; $userCsrf = $twoCsrf;
    request('account-me', [], 401);
    $cookies = $threeCookies; $userCsrf = $threeCsrf;
    request('account-me', []);
    check(true, 'password change requires current password and revokes old sessions');
    $reset = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO quiz_password_resets(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))')->execute([$userId,hash('sha256',$reset)]);
    $four = request('account-reset-password', ['token'=>$reset,'password'=>$password])['user']; $fourToken = user_cookie();
    $cookies = $threeCookies; $userCsrf = $threeCsrf;
    request('account-me', [], 401);
    request('account-reset-password', ['token'=>$reset,'password'=>$password], 400);
    check(true, 'reset revokes sessions and reset link cannot be reused');
    $pdo->prepare('UPDATE quiz_user_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE token_hash=?')->execute([hash('sha256',$fourToken)]);
    request('account-me', [], 401);
    $five = request('account-login', $login)['user']; $fiveToken = user_cookie();
    $pdo->prepare('UPDATE quiz_user_sessions SET last_seen_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 DAY) WHERE token_hash=?')->execute([hash('sha256',$fiveToken)]);
    request('account-me', [], 401);
    check(true, 'absolute and idle expiration enforced');
    $six = request('account-login', $login)['user'];
    request('save-result', ['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1], 403, '', false);
    request('save-result', ['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1], 403, '', 'invalid');
    request('save-result', ['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1], 403, "Origin: https://evil.example\r\n");
    request('save-result', ['score'=>10,'maxScore'=>2,'solved'=>1,'total'=>1], 422);
    $round = request('start-round', ['questionIds'=>[$questionId], 'categoryId'=>'audit']);
    $pdo->exec("UPDATE quiz_categories SET title='Renamed after start' WHERE id='audit'");
    $pdo->prepare("UPDATE quiz_questions SET question='Changed during play', difficulty='hero' WHERE id=?")->execute([$questionId]);
    $submission = ['roundId'=>$round['roundId'], 'answers'=>[['questionId'=>$questionId, 'selectedAnswers'=>[1,0]]], 'score'=>100000];
    $result = request('save-result', $submission);
    $pdo->exec("UPDATE quiz_categories SET title='Audit' WHERE id='audit'");
    $pdo->prepare("UPDATE quiz_questions SET question='Audit question', difficulty='easy' WHERE id=?")->execute([$questionId]);
    check((int) $pdo->query('SELECT score FROM quiz_results ORDER BY id DESC LIMIT 1')->fetchColumn() === 1, 'server scores second attempt and ignores forged totals');
    request('save-result', $submission);
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_results')->fetchColumn() === 1, 'round completion is idempotent');
    $detail = $pdo->query('SELECT * FROM quiz_question_results')->fetch();
    check((int) $detail['user_id'] === $userId && (int) $detail['question_id'] === $questionId && $detail['outcome'] === 'second_try' && (int) $detail['score'] === 1 && (int) $detail['max_score'] === 2 && json_decode($detail['selected_answers'], true) === [1,0], 'durable question history records server-scored attempts and owner');
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_question_results')->fetchColumn() === 1 && strlen($detail['question_version']) === 64, 'retry does not duplicate question history and content version is retained');
    check($detail['difficulty'] === 'easy', 'question difficulty is saved with the result');
    $snapshot = json_decode($pdo->query('SELECT snapshot_json FROM quiz_question_versions WHERE id=' . (int) $detail['version_id'])->fetchColumn(), true);
    check($snapshot['question'] === 'Audit question' && $snapshot['answers'] === ['A','B','C','D'] && $snapshot['correct'] === 0 && $snapshot['difficulty'] === 'easy' && $snapshot['imageUrl'] === '/images/audit.png', 'immutable content comes from frozen round despite catalog edits during play');
    check($pdo->query('SELECT category_title FROM quiz_results WHERE id=' . (int) $result['resultId'])->fetchColumn() === 'Audit', 'historical category title is frozen at start rather than completion');
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_question_versions')->fetchColumn() === 1, 'duplicate result submission creates no extra question version');
    foreach ([[[0], 'first_try', 2], [[1,2], 'incorrect', 0], [[], 'skipped', 0]] as [$attempts, $outcome, $points]) {
        $difficulty = ['first_try'=>'easy', 'incorrect'=>'medium', 'skipped'=>'hero'][$outcome];
        $pdo->prepare('UPDATE quiz_questions SET difficulty=? WHERE id=?')->execute([$difficulty, $questionId]);
        $extraRound = request('start-round', ['questionIds'=>[$questionId], 'categoryId'=>'audit']);
        $pdo->prepare('UPDATE quiz_questions SET difficulty=? WHERE id=?')->execute(['easy', $questionId]);
        request('save-result', ['roundId'=>$extraRound['roundId'], 'answers'=>[['questionId'=>$questionId,'selectedAnswers'=>[1]]]], 422);
        check((int) $pdo->query('SELECT COUNT(*) FROM quiz_question_results')->fetchColumn() === 1, 'invalid answer sequence writes no durable history');
        $extraResult = request('save-result', ['roundId'=>$extraRound['roundId'], 'answers'=>[['questionId'=>$questionId,'selectedAnswers'=>$attempts]]]);
        $pdo->prepare('DELETE FROM quiz_rounds WHERE id=?')->execute([$extraRound['roundId']]);
        $saved = $pdo->query('SELECT outcome,score,version_id FROM quiz_question_results WHERE result_id=' . (int) $extraResult['resultId'])->fetch();
        check($outcome === 'first_try' ? $saved['version_id'] === $detail['version_id'] : $saved['version_id'] !== $detail['version_id'], 'shared version reference reuses identical content and distinguishes changed difficulty');
        check($saved['outcome'] === $outcome && (int) $saved['score'] === $points, 'question history survives snapshot deletion and distinguishes ' . $outcome);
        $difficultyStats = request('account-journey', [])['difficultyStats'];
        check($difficultyStats[$difficulty]['percent'] === ($outcome === 'first_try' ? 100 : 0), 'difficulty success uses frozen difficulty and handles ' . $outcome);
        $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$extraResult['resultId']]);
    }
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_question_results')->fetchColumn() === 1, 'deleting a round result cascades to its question history');
    $pdo->exec("INSERT INTO quiz_tags(id,title) VALUES ('historytag','Original topic')");
    $pdo->prepare("UPDATE quiz_questions SET tags_json='[\"historytag\"]' WHERE id=?")->execute([$questionId]);
    $topicRound = request('start-round', ['questionIds'=>[$questionId], 'tagId'=>'historytag']);
    $pdo->exec("UPDATE quiz_tags SET title='Renamed topic' WHERE id='historytag'");
    $topicResult = request('save-result', ['roundId'=>$topicRound['roundId'],'answers'=>[['questionId'=>$questionId,'selectedAnswers'=>[0]]]]);
    $pdo->exec("DELETE FROM quiz_tags WHERE id='historytag'");
    check($pdo->query('SELECT tag_title FROM quiz_results WHERE id=' . (int) $topicResult['resultId'])->fetchColumn() === 'Original topic', 'topic name survives rename and deletion');
    $topicHistory = request('account-journey', []);
    check(array_values(array_filter($topicHistory['selections'], static fn($selection) => $selection['id'] === 'historytag'))[0]['title'] === 'Original topic', 'private history uses stored title for a deleted topic');
    $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$topicResult['resultId']]);
    $pdo->prepare("UPDATE quiz_questions SET tags_json='[\"antike\"]' WHERE id=?")->execute([$questionId]);
    $pdo->exec("INSERT INTO quiz_categories(id,title) VALUES ('historydeleted','Historical category')");
    $pdo->prepare('INSERT INTO quiz_questions(category_id,question,answers_json,correct_index) VALUES(?,?,?,0)')->execute(['historydeleted','A deleted question','["One","Two","Three","Four"]']);
    $deletedQuestion = (int) $pdo->lastInsertId();
    $deletedRound = request('start-round', ['questionIds'=>[$deletedQuestion],'categoryId'=>'historydeleted']);
    $deletedResult = request('save-result', ['roundId'=>$deletedRound['roundId'],'answers'=>[['questionId'=>$deletedQuestion,'selectedAnswers'=>[0]]]]);
    $pdo->prepare('DELETE FROM quiz_questions WHERE id=?')->execute([$deletedQuestion]);
    $pdo->exec("DELETE FROM quiz_categories WHERE id='historydeleted'");
    $stored = $pdo->query('SELECT v.snapshot_json FROM quiz_question_results r JOIN quiz_question_versions v ON v.id=r.version_id WHERE r.result_id=' . (int) $deletedResult['resultId'])->fetchColumn();
    check(json_decode($stored,true)['question'] === 'A deleted question', 'question snapshot survives permanent catalog deletion');
    $deletedHistory = request('account-journey', []);
    $deletedSelection = array_values(array_filter($deletedHistory['selections'], static fn($selection) => $selection['id'] === 'historydeleted'))[0];
    check($deletedSelection['title'] === 'Historical category' && !$deletedSelection['available'], 'deleted category retains historical name without becoming playable');
    $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$deletedResult['resultId']]);
    request('save-result', ['roundId'=>$round['roundId'], 'answers'=>[['questionId'=>$questionId,'selectedAnswers'=>[0]]]], 409);
    request('start-round', ['questionIds'=>[$questionId,$questionId], 'categoryId'=>'audit'], 422);
    check(true, 'user writes reject missing or invalid CSRF and foreign origins');
    request('account-journey', [], 403, '', false);
    $pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,email_verified_at) VALUES(?,?,?,NOW())')->execute(['other'.$suffix, 'other'.$suffix.'@example.test', password_hash($password, PASSWORD_DEFAULT)]);
    $otherUser = (int) $pdo->lastInsertId();
    $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)')->execute([$otherUser,'audit',999,999,1,1]);
    $otherResultId = (int) $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO quiz_question_results(result_id,user_id,question_id,question_version,difficulty,position,selected_answers,outcome,score,max_score) VALUES(?,?,?,?,'easy',1,'[1,2]','incorrect',0,2)")->execute([$otherResultId,$otherUser,$questionId,str_repeat('a',64)]);
    check($pdo->query('SELECT version_id FROM quiz_question_results WHERE result_id=' . $otherResultId)->fetchColumn() === null, 'legacy detail does not fabricate an immutable version from current content');
    $journey = request('account-journey', ['userId' => $otherUser]);
    check($journey['summary']['rounds'] === 1 && !array_key_exists('recent', $journey), 'private passport ignores supplied user IDs and never exposes another account result');
    check($journey['summary']['categories'] === 1 && $journey['selections'][0]['rounds'] === 1, 'passport aggregates actual saved rounds');
    check($journey['selections'][0]['solved'] === 1 && $journey['selections'][0]['totalQuestions'] === 1, 'category success totals exclude other users and include second-try solutions');
    check($journey['difficultyStats']['easy'] === ['solved'=>1,'total'=>1,'percent'=>100] && $journey['difficultyStats']['hero']['percent'] === null, 'difficulty success distinguishes unknown from zero and counts second tries');
    $pdo->prepare("INSERT INTO quiz_question_results(result_id,user_id,question_id,question_version,difficulty,position,selected_answers,outcome,score,max_score) VALUES(?,?,?,?,'easy',2,'[]','skipped',0,2)")->execute([$result['resultId'],$userId,$questionId+1000000,str_repeat('b',64)]);
    check(request('account-journey', [])['difficultyStats']['easy']['percent'] === 50, 'difficulty percent includes unsolved questions in the denominator and excludes other users');
    $pdo->prepare('DELETE FROM quiz_question_results WHERE result_id=? AND question_id=?')->execute([$result['resultId'],$questionId+1000000]);
    $pdo->prepare('UPDATE quiz_question_results SET difficulty=NULL WHERE result_id=?')->execute([$result['resultId']]);
    check(request('account-journey', [])['difficultyStats']['easy']['percent'] === null, 'legacy detail without difficulty is excluded rather than guessed');
    $pdo->prepare('UPDATE quiz_question_results SET difficulty=? WHERE result_id=?')->execute(['easy', $result['resultId']]);
    check(request('account-journey', ['userId'=>$otherUser])['practice'] === [], 'practice excludes solved questions and mistakes belonging to another user');
    $pdo->prepare("UPDATE quiz_question_results SET outcome='incorrect' WHERE result_id=?")->execute([$result['resultId']]);
    $practice = request('account-journey', [])['practice'];
    check(count($practice) === 1 && $practice[0]['count'] === 1 && !array_key_exists('questionIds', $practice[0]), 'practice offers each unresolved active question once');
    request('start-round', ['categoryId'=>'audit','practice'=>'true'], 422);
    $savedPracticeResults = [];
    foreach ([[1,2], [1,0]] as $attempts) {
        $practiceRound = request('start-round', ['categoryId'=>'audit','practice'=>true,'questionIds'=>[999999],'userId'=>$otherUser]);
        check($practiceRound['isPractice'] === true && array_column($practiceRound['questions'],'id') === [$questionId], 'practice selection is computed on server from session, ignoring supplied questions and user');
        $practiceSubmission = ['roundId'=>$practiceRound['roundId'],'answers'=>[['questionId'=>$questionId,'selectedAnswers'=>$attempts]],'practice'=>false];
        $practiceResult = request('save-result', $practiceSubmission);
        request('save-result', $practiceSubmission);
        $savedPracticeResults[] = $practiceResult['resultId'];
        check((int) $pdo->query('SELECT is_practice FROM quiz_results WHERE id=' . (int) $practiceResult['resultId'])->fetchColumn() === 1, 'result mode comes from frozen round and survives duplicate submission');
        $stillOpen = request('account-journey', [])['practice'];
        check($attempts === [1,2] ? count($stillOpen) === 1 : $stillOpen === [], 'real saved practice result updates unresolved questions immediately');
    }
    request('start-round', ['categoryId'=>'audit','practice'=>true], 409);
    foreach ($savedPracticeResults as $practiceResult) $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$practiceResult]);
    $extraPracticeQuestions = [];
    for ($i=0; $i<12; $i++) {
        $pdo->prepare('INSERT INTO quiz_questions(category_id,question,answers_json,correct_index,difficulty,image_url,tags_json) SELECT category_id,question,answers_json,correct_index,difficulty,image_url,tags_json FROM quiz_questions WHERE id=?')->execute([$questionId]);
        $extraQuestionId = (int) $pdo->lastInsertId();
        $extraPracticeQuestions[] = $extraQuestionId;
        $pdo->prepare("INSERT INTO quiz_question_results(result_id,user_id,question_id,question_version,difficulty,position,selected_answers,outcome,score,max_score) VALUES(?,?,?,?,'easy',1,'[1,2]','incorrect',0,2)")->execute([$result['resultId'],$userId,$extraQuestionId,$detail['question_version']]);
    }
    $boundedPractice = request('start-round', ['categoryId'=>'audit','practice'=>true]);
    check(count($boundedPractice['questions']) === 10 && count(array_unique(array_column($boundedPractice['questions'],'id'))) === 10, 'server caps fresh practice selection at ten distinct open questions');
    foreach ($extraPracticeQuestions as $extraQuestionId) {
        $pdo->prepare('DELETE FROM quiz_question_results WHERE result_id=? AND question_id=?')->execute([$result['resultId'],$extraQuestionId]);
        $pdo->prepare('DELETE FROM quiz_questions WHERE id=?')->execute([$extraQuestionId]);
    }
    $pdo->prepare('UPDATE quiz_questions SET difficulty=? WHERE id=?')->execute(['hero',$questionId]);
    check(request('account-journey', [])['practice'] === [], 'practice excludes questions whose scored content has changed');
    $pdo->prepare('UPDATE quiz_questions SET difficulty=? WHERE id=?')->execute(['easy',$questionId]);
    $pdo->exec("UPDATE quiz_categories SET enabled=0 WHERE id='audit'");
    check(request('account-journey', [])['practice'] === [], 'practice excludes archived categories');
    $pdo->exec("UPDATE quiz_categories SET enabled=1 WHERE id='audit'");
    $pdo->prepare('UPDATE quiz_questions SET active=0 WHERE id=?')->execute([$questionId]);
    check(request('account-journey', [])['practice'] === [], 'practice excludes inactive questions');
    $pdo->prepare('UPDATE quiz_questions SET active=1 WHERE id=?')->execute([$questionId]);
    $practiceResults = [];
    foreach (['skipped','second_try'] as $outcome) {
        $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)')->execute([$userId,'audit',0,2,0,1]);
        $practiceResult = (int) $pdo->lastInsertId();
        $practiceResults[] = $practiceResult;
        $pdo->prepare('INSERT INTO quiz_question_results(result_id,user_id,question_id,question_version,difficulty,position,selected_answers,outcome,score,max_score) VALUES(?,?,?,?,?,1,?,?,0,2)')->execute([$practiceResult,$userId,$questionId,$detail['question_version'],'easy','[]',$outcome]);
        $practice = request('account-journey', [])['practice'];
        check($outcome === 'skipped' ? count($practice) === 1 : $practice === [], 'practice latest-answer rule handles ' . $outcome);
    }
    foreach ($practiceResults as $practiceResult) $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$practiceResult]);
    $pdo->prepare("UPDATE quiz_question_results SET outcome='second_try' WHERE result_id=?")->execute([$result['resultId']]);
    $pdo->prepare('INSERT INTO quiz_results(user_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?)')->execute([$userId,1,2,1,1]);
    $legacyResult = (int) $pdo->lastInsertId();
    $legacyJourney = request('account-journey', []);
    check($legacyJourney['summary']['rounds'] === 2 && $legacyJourney['summary']['categories'] === 1 && $legacyJourney['summary']['topics'] === 0, 'legacy results without a selection remain in history without inventing a visited category or topic');
    $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$legacyResult]);
    $pdo->exec("UPDATE quiz_categories SET enabled=0 WHERE id='audit'");
    $journey = request('account-journey', []);
    check($journey['selections'][0]['available'] === false, 'archived selections retain history without a broken play link');
    $pdo->exec("UPDATE quiz_categories SET enabled=1 WHERE id='audit'");
    $extra = $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)');
    for ($i=0; $i<11; $i++) $extra->execute([$userId,'audit',2,2,1,1]);
    $journey = request('account-journey', []);
    check($journey['summary']['rounds'] === 12 && !array_key_exists('recent', $journey), 'passport keeps all-time counts without transferring unused recent history');
    $extra->execute([$userId,'audit',0,20,0,10]);
    $stats = request('account-journey', [])['selections'][0];
    check($stats['rounds'] === 13 && $stats['solved'] === 12 && $stats['totalQuestions'] === 22, 'success chart totals cover all rounds and different round sizes, not only recent ten');
    $pdo->prepare('DELETE FROM quiz_results WHERE user_id=? AND id<>?')->execute([$userId,$result['resultId']]);
    $pdo->prepare('DELETE FROM quiz_results WHERE user_id=?')->execute([$otherUser]);
    $pdo->prepare('DELETE FROM quiz_users WHERE id=?')->execute([$otherUser]);
    $pdo->prepare('UPDATE quiz_users SET deleted_at=NOW() WHERE id=?')->execute([$userId]);
    request('save-result', ['score'=>2,'maxScore'=>2,'solved'=>1,'total'=>1], 401);
    $pdo->prepare('UPDATE quiz_users SET deleted_at=NULL WHERE id=?')->execute([$userId]);
    check(true, 'result invariants and active-account requirement enforced');
    request('account-login', $login);
    request('account-delete', ['confirm'=>'DELETE'], 403);
    request('account-delete', ['confirm'=>'DELETE','currentPassword'=>$password]);
    request('account-me', [], 401);
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_user_sessions')->fetchColumn() === 0, 'account deletion requires password, revokes all sessions, and notification failure does not undo success');
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_question_results')->fetchColumn() === 0 && (int) $pdo->query('SELECT COUNT(*) FROM quiz_rounds WHERE user_id=' . $userId)->fetchColumn() === 0, 'account deletion erases question history and temporary answer snapshots');

    $pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key) VALUES(?,?,?,?)')->execute(['verify'.$suffix,'verify'.$suffix.'@example.test',password_hash($password,PASSWORD_DEFAULT),'hero']);
    $verificationUser = (int) $pdo->lastInsertId();
    $verification = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO quiz_email_verifications(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))')->execute([$verificationUser,hash('sha256',$verification)]);
    $verified = request('account-verify-email', ['token'=>$verification])['user'];
    $emptyJourney = request('account-journey', []);
    check($emptyJourney['summary'] === ['rounds'=>0,'categories'=>0,'topics'=>0] && $emptyJourney['practice'] === [] && $emptyJourney['difficultyStats']['easy']['percent'] === null, 'new account has honest empty statistics and no invented practice questions');
    $pdo->prepare('INSERT INTO quiz_results(user_id,category_id,score,max_score,solved,total_questions) VALUES(?,?,?,?,?,?)')->execute([$verificationUser,'audit',2,2,1,1]);
    $legacyOnlyResult = (int) $pdo->lastInsertId();
    $legacyOnlyJourney = request('account-journey', []);
    check($legacyOnlyJourney['summary']['rounds'] === 1 && $legacyOnlyJourney['practice'] === [] && $legacyOnlyJourney['difficultyStats']['easy']['total'] === 0 && $legacyOnlyJourney['difficultyStats']['hero']['percent'] === null, 'legacy-only account keeps saved rounds without guessing difficulty or mistakes');
    $pdo->prepare('DELETE FROM quiz_results WHERE id=?')->execute([$legacyOnlyResult]);
    request('account-me', []);
    request('account-verify-email', ['token'=>$verification], 400);
    check(true, 'verification produces usable session and cannot be replayed');

    $admin = request('admin-login', ['username'=>$env['QUIZ_HERO_ADMIN_USER'],'password'=>$password]);
    request('admin-question-delete', ['id'=>$questionId], 403);
    $csrf = 'invalid';
    request('admin-question-delete', ['id'=>$questionId], 403);
    $csrf = $admin['csrfToken'];
    request('admin-question-delete', ['id'=>$questionId], 403, "Origin: https://evil.example\r\n");
    check((int) $pdo->query('SELECT COUNT(*) FROM quiz_questions')->fetchColumn() === 1, 'admin writes reject missing/wrong CSRF and foreign Origin without mutation');
    $savedCookies = $cookies; $cookies = [];
    foreach (['admin-data', 'admin-users-list', 'admin-media-list', 'admin-question-feedback-list'] as $route) request($route, null, 401);
    foreach (['admin-question-save','admin-category-save','admin-category-delete','admin-user-delete','admin-question-feedback-delete','admin-media-delete','admin-question-import','admin-image-upload'] as $route) request($route, [], 401);
    $cookies = $savedCookies;
    check(true, 'admin read and write endpoints reject unauthenticated access');
    request('account-login', ['identifier'=>"' OR 1=1 --",'password'=>'invalid'], 401);
    $savedUserCookie = $cookies['quiz_hero_session'] ?? null; unset($cookies['quiz_hero_session']);
    request('account-me', ['userId'=>$verified['id'],'userToken'=>'legacy-bearer-is-ignored'], 401);
    if ($savedUserCookie !== null) $cookies['quiz_hero_session'] = $savedUserCookie;
    for ($i=0;$i<8;$i++) request('admin-login', ['username'=>'attack'.$suffix,'password'=>'invalid'], 401);
    request('admin-login', ['username'=>'attack'.$suffix,'password'=>'invalid'], 429);
    check(true, 'SQL injection login rejected, legacy bearer payload rejected, admin login rate limit enforced');
    request('admin-question-save', ['id'=>$questionId,'contentVersion'=>hash('sha256',json_encode($pdo->query('SELECT * FROM quiz_questions WHERE id=' . $questionId)->fetch(), JSON_THROW_ON_ERROR)),'categoryId'=>'audit','question'=>'Updated audit','answers'=>['A','B','C','D'],'correct'=>0,'difficulty'=>'easy','imageUrl'=>'/images/audit.png','tags'=>'Antike, antike, ','active'=>true,'sourceUrl'=>'https://example.test/source','imageAlt'=>'Audit image','reviewedBy'=>'Test editor','reviewedAt'=>'2026-01-01']);
    request('admin-question-save', ['id'=>$questionId,'contentVersion'=>'stale','categoryId'=>'audit','question'=>'Overwrite attempt','answers'=>['A','B','C','D'],'correct'=>0], 409);
    check($pdo->query('SELECT question FROM quiz_questions WHERE id=' . $questionId)->fetchColumn() === 'Updated audit', 'stale editor cannot overwrite a changed question');
    $saved = $pdo->query('SELECT image_url,tags_json FROM quiz_questions')->fetch();
    check($saved['image_url'] === '/images/audit.png' && json_decode($saved['tags_json'], true) === ['Antike'], 'question edit retains root-relative image and canonical tag IDs');
    request('admin-question-save', ['id'=>$questionId,'categoryId'=>'audit','question'=>'Unsafe','answers'=>['A','B','C','D'],'correct'=>0,'imageUrl'=>'images/../api/index.php'], 422);
    check($pdo->query('SELECT image_url FROM quiz_questions')->fetchColumn() === '/images/audit.png', 'invalid image rejected without clearing saved image');
    request('admin-category-save', ['id'=>'audit','contentVersion'=>hash('sha256',json_encode($pdo->query("SELECT * FROM quiz_categories WHERE id='audit'")->fetch(), JSON_THROW_ON_ERROR)),'title'=>'Audit','enabled'=>true,'badgeActive'=>false,'badgeText'=>'']);
    request('admin-category-save', ['id'=>'delete-me','title'=>'Delete me','enabled'=>false,'badgeActive'=>false,'badgeText'=>'']);
    $deleteQuestion = request('admin-question-save', ['categoryId'=>'delete-me','question'=>'Delete with category','answers'=>['A','B','C','D'],'correct'=>0,'active'=>false]);
    request('admin-category-delete', ['id'=>'delete-me','confirmation'=>'wrong'], 422);
    request('admin-category-delete', ['id'=>'delete-me','confirmation'=>'delete-me','deleteQuestions'=>false], 409);
    check((int) $pdo->query("SELECT COUNT(*) FROM quiz_categories WHERE id = 'delete-me'")->fetchColumn() === 1
        && (int) $pdo->query('SELECT COUNT(*) FROM quiz_questions WHERE id = ' . (int) $deleteQuestion['id'])->fetchColumn() === 1,
        'category deletion keeps category and questions without explicit cascade consent');
    request('admin-category-delete', ['id'=>'delete-me','confirmation'=>'delete-me','deleteQuestions'=>true]);
    check((int) $pdo->query("SELECT COUNT(*) FROM quiz_categories WHERE id = 'delete-me'")->fetchColumn() === 0
        && (int) $pdo->query('SELECT COUNT(*) FROM quiz_questions WHERE id = ' . (int) $deleteQuestion['id'])->fetchColumn() === 0,
        'category deletion requires exact confirmation and cascades to questions');
    $public = request('public-data');
    check($public['categories'][0]['questions'][0]['sourceUrl'] === 'https://example.test/source' && $public['categories'][0]['questions'][0]['imageAlt'] === 'Audit image', 'editorial fields round-trip through database and public export');
    request('admin-question-save', ['categoryId'=>'audit','question'=>'bad source','answers'=>['A','B','C','D'],'correct'=>0,'sourceUrl'=>'javascript:alert(1)'], 422);
    request('admin-question-save', ['categoryId'=>'audit','question'=>'bad date','answers'=>['A','B','C','D'],'correct'=>0,'reviewedAt'=>'2026-02-31'], 422);
    request('admin-question-save', ['categoryId'=>'audit','question'=>[],'answers'=>['A','B','C','D']], 422);
    request('admin-question-save', ['categoryId'=>'missing','question'=>'Missing category','answers'=>['A','B','C','D']], 422);
    check(true, 'unsafe source URLs, impossible dates, malformed text and missing categories rejected');
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
    $resendMail = 'resend' . $suffix . '@example.test';
    $pdo->prepare('INSERT INTO quiz_users(username,email,password_hash,avatar_key) VALUES(?,?,?,?)')->execute(['resend'.$suffix,$resendMail,password_hash($password,PASSWORD_DEFAULT),'hero']);
    $resendId = (int) $pdo->lastInsertId();
    $pdo->prepare('INSERT INTO quiz_email_verifications(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 1 DAY))')->execute([$resendId,hash('sha256','old-link')]);
    $known = request('account-resend-verification', ['email'=>$resendMail]);
    $unknown = request('account-resend-verification', ['email'=>'unknown@example.test']);
    check($known === $unknown && (int) $pdo->query("SELECT COUNT(*) FROM quiz_email_verifications WHERE user_id=$resendId")->fetchColumn() === 1, 'failed resend preserves old link and does not reveal account existence');
    for ($i=0; $i<3; $i++) request('account-resend-verification', ['email'=>'unknown@example.test']);
    request('account-resend-verification', ['email'=>'unknown@example.test'], 429);
    check(true, 'resend rate limit enforced');

    // Restart only the isolated server with a loopback SMTP receiver.
    proc_terminate($server); proc_close($server); $server = null;
    $smtpServer = proc_open([PHP_BINARY, __DIR__.'/smtp-fixture.php', $runtime], [['pipe','r'],['file',$log,'a'],['file',$log,'a']], $smtpPipes);
    for ($i=0; $i<50 && !is_file($runtime.'/smtp-address'); $i++) usleep(100000);
    $smtpAddress = trim(file_get_contents($runtime.'/smtp-address'));
    $env['QUIZ_HERO_MAIL_TRANSPORT'] = 'smtp';
    $env['QUIZ_HERO_SMTP_HOST'] = '127.0.0.1';
    $env['QUIZ_HERO_SMTP_PORT'] = explode(':', $smtpAddress)[1];
    $env['QUIZ_HERO_SMTP_SECURE'] = 'none'; $env['QUIZ_HERO_SMTP_USER'] = ''; $env['QUIZ_HERO_SMTP_PASSWORD'] = '';
    // New runtime scope resets only test rate limits.
    foreach (glob($runtime . '/quiz-hero-rate-limits/*.json') ?: [] as $file) unlink($file);
    $server = proc_open([PHP_BINARY, '-S', $address, '-t', dirname(__DIR__) . '/public'], [['pipe','r'], ['file',$log,'a'], ['file',$log,'a']], $pipes, dirname(__DIR__), $env);
    for ($i=0; $i<50; $i++) { $probe=@stream_socket_client('tcp://'.$address,$errno,$errstr,0.1); if ($probe) { fclose($probe); break; } usleep(100000); }
    function mail_token(string $parameter): string {
        global $runtime;
        $lines = file($runtime.'/smtp-mails', FILE_IGNORE_NEW_LINES);
        foreach (array_reverse($lines) as $line) if (preg_match('/'.preg_quote($parameter, '/').'=([a-f0-9]{64})/', json_decode($line, true), $match)) return $match[1];
        throw new RuntimeException('Expected mail link missing');
    }
    $mailUser = 'smtp'.$suffix;
    request('account-register', ['username'=>$mailUser,'email'=>$mailUser.'@example.test','password'=>$password,'privacyAccepted'=>true]);
    $original = mail_token('verifyToken');
    request('account-resend-verification', ['email'=>$mailUser.'@example.test']);
    $replacement = mail_token('verifyToken');
    request('account-verify-email', ['token'=>$original], 400);
    $mailAccount = request('account-verify-email', ['token'=>$replacement])['user'];
    $mailAccountCookies = $cookies; $mailAccountCsrf = $userCsrf;
    request('account-login', ['identifier'=>$mailUser,'password'=>$password]);
    request('account-request-password-reset', ['email'=>$mailUser.'@example.test']);
    $resetLink = mail_token('resetToken');
    request('account-reset-password', ['token'=>$resetLink,'password'=>$newPassword]);
    $cookies = $mailAccountCookies; $userCsrf = $mailAccountCsrf;
    request('account-me', [], 401);
    request('account-login', ['identifier'=>$mailUser,'password'=>$newPassword]);
    check($original !== $replacement, 'local SMTP: registration, resend, verification, login, password reset and session revocation end-to-end');
    echo "{$checks} integration checks passed.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    if (is_resource($smtpServer)) { proc_terminate($smtpServer); proc_close($smtpServer); }
    foreach (['smtp-address','smtp-mails'] as $file) @unlink($runtime.'/'.$file);
    @unlink($log);
    foreach (glob($runtime . '/quiz-hero-rate-limits/*.json') ?: [] as $file) unlink($file);
    if (is_dir($runtime . '/quiz-hero-rate-limits')) rmdir($runtime . '/quiz-hero-rate-limits');
    foreach (glob($runtime . '/sess_*') ?: [] as $file) unlink($file);
    rmdir($runtime);
    clear_test_tables();
}
