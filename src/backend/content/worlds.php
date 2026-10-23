<?php
declare(strict_types=1);

function question_world_ids(int $questionId): array
{
    $stmt = db()->prepare('SELECT world_id FROM quiz_question_worlds WHERE question_id=? ORDER BY world_id');
    $stmt->execute([$questionId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/** Used by save and import; never silently invent worlds from arbitrary input. */
function world_id_errors(mixed $ids, bool $allowEmpty = false): array
{
    if (!is_array($ids) || !array_is_list($ids) || (!$allowEmpty && count($ids) < 1) || count($ids) > 30) return ['Quizwelten als Liste mit höchstens 30 gültigen IDs angeben. Mindestens eine direkte oder geerbte Quizwelt ist für Fragen erforderlich.'];
    foreach ($ids as $id) if (!is_string($id) || !preg_match('/^[a-z0-9][a-z0-9-]{0,119}$/D', $id)) return ['Ungültige Quizwelt-ID.'];
    $known = db()->query('SELECT id FROM quiz_worlds')->fetchAll(PDO::FETCH_COLUMN);
    return array_diff($ids, $known) ? ['Eine ausgewählte Quizwelt existiert nicht.'] : [];
}

function category_world_ids(string $categoryId): array
{
    $stmt=db()->prepare('SELECT world_id FROM quiz_category_worlds WHERE category_id=? ORDER BY world_id');
    $stmt->execute([$categoryId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function replace_category_worlds(string $categoryId, array $ids): void
{
    db()->prepare('DELETE FROM quiz_category_worlds WHERE category_id=?')->execute([$categoryId]);
    $stmt=db()->prepare('INSERT INTO quiz_category_worlds(category_id,world_id) VALUES(?,?)');
    foreach (array_unique($ids) as $id) $stmt->execute([$categoryId,$id]);
}

/** Keep provenance in both the API and optimistic content version. */
function question_with_worlds(array $row, array $direct, array $inherited): array
{
    $row['directWorldIds']=$direct;
    $row['inheritedWorldIds']=$inherited;
    $effective=array_values(array_unique([...$direct,...$inherited]));
    sort($effective,SORT_STRING);
    $row['worldIds']=$effective;
    return $row;
}

function replace_question_worlds(int $questionId, array $ids): void
{
    db()->prepare('DELETE FROM quiz_question_worlds WHERE question_id=?')->execute([$questionId]);
    $stmt = db()->prepare('INSERT INTO quiz_question_worlds(question_id,world_id) VALUES(?,?)');
    foreach (array_unique($ids) as $id) $stmt->execute([$questionId, $id]);
}

function admin_world_save(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    if (!is_string($data['title'] ?? null) || !is_string($data['description'] ?? '') || !is_bool($data['enabled'] ?? null)) json_response(['ok'=>false,'error'=>'Titel, Beschreibung und Aktivierung prüfen.'],422);
    $title = clean_string($data['title'],120);
    if ($title === '') json_response(['ok'=>false,'error'=>'Name der Quizwelt fehlt.'],422);
    $description = clean_string($data['description'] ?? '',255);
    $pdo = db();
    $pdo->beginTransaction();
    $id = $data['id'] ?? '';
    if (!is_string($id)) json_response(['ok'=>false,'error'=>'Ungültige Quizwelt.'],422);
    if ($id !== '') {
        $stmt=$pdo->prepare('SELECT * FROM quiz_worlds WHERE id=? FOR UPDATE');$stmt->execute([$id]);
        assert_content_version($stmt->fetch() ?: null,$data);
        $pdo->prepare('UPDATE quiz_worlds SET title=?,description=?,enabled=?,revision=revision+1 WHERE id=?')->execute([$title,$description,(int)$data['enabled'],$id]);
    } else {
        $base=slugify($title);
        $check=$pdo->prepare('SELECT id FROM quiz_worlds WHERE id=?');
        for ($i=1; $i<=1000; $i++) {
            $id=substr($base,0,110).($i===1?'':'-'.$i);$check->execute([$id]);
            if (!$check->fetchColumn()) break;
        }
        try {
            $pdo->prepare('INSERT INTO quiz_worlds(id,title,description,enabled) VALUES(?,?,?,?)')->execute([$id,$title,$description,(int)$data['enabled']]);
        } catch (PDOException $error) {
            $pdo->rollBack();
            if (($error->errorInfo[1] ?? null) === 1062) json_response(['ok'=>false,'error'=>'Eine Quizwelt wurde gleichzeitig angelegt. Bitte erneut speichern.'],409);
            throw $error;
        }
    }
    $pdo->commit();
    json_response(['ok'=>true,'id'=>$id]);
}
