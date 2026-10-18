<?php
declare(strict_types=1);

function admin_image_upload(bool $replace = false): void
{
    require_method('POST');
    require_admin_csrf();
    rate_limit('admin-image-upload', 40, 300);

    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 0 && $contentLength > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES + 1048576) {
        json_response(['ok' => false, 'error' => 'Das Bild ist zu groß. Maximal erlaubt sind 6 MB.'], 413);
    }

    $oldPath = '';
    if ($replace) {
        $oldPath = normalize_local_image_path((string) ($_POST['path'] ?? ''));
        $known = array_column(list_uploaded_media(), null, 'path');
        if ($oldPath === '' || !isset($known[$oldPath])) {
            json_response(['ok' => false, 'error' => 'Das ausgewählte Bild wurde nicht gefunden.'], 404);
        }
        if (!hash_equals($known[$oldPath]['version'], (string) ($_POST['version'] ?? ''))) {
            json_response(['ok' => false, 'error' => 'Das Bild oder seine Verwendungen wurden geändert. Bitte neu auswählen.'], 409);
        }
    }
    $context = $replace ? 'media' : clean_string($_POST['context'] ?? 'question', 40);
    $rawCategoryId = clean_string($_POST['categoryId'] ?? '', 120);
    if ($rawCategoryId === '' && $context === 'category') {
        $rawCategoryId = clean_string($_POST['categoryTitle'] ?? '', 120);
    }
    if ($rawCategoryId === '' && $context === 'media') {
        $rawCategoryId = 'media';
    }
    if ($rawCategoryId === '') {
        json_response(['ok' => false, 'error' => 'Kategorie fehlt.'], 422);
    }
    $categoryId = slugify($rawCategoryId);

    if (!in_array($context, ['category', 'media'], true)) {
        $stmt = db()->prepare('SELECT id FROM quiz_categories WHERE id = :id');
        $stmt->execute(['id' => $categoryId]);
        if (!$stmt->fetch()) {
            json_response(['ok' => false, 'error' => 'Kategorie wurde nicht gefunden.'], 422);
        }
    }

    $file = $_FILES['image'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        json_response(['ok' => false, 'error' => 'Bitte wähle eine Bilddatei aus.'], 422);
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        json_response(['ok' => false, 'error' => upload_error_message((int) $file['error'])], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES) {
        json_response(['ok' => false, 'error' => 'Das Bild darf maximal 6 MB groß sein.'], 413);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        json_response(['ok' => false, 'error' => 'Upload konnte nicht verarbeitet werden.'], 400);
    }

    $imageInfo = @getimagesize($tmpName);
    if ($imageInfo === false) {
        json_response(['ok' => false, 'error' => 'Die Datei ist kein gültiges Bild.'], 422);
    }

    $mime = detect_mime_type($tmpName);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($allowed[$mime])) {
        json_response(['ok' => false, 'error' => 'Erlaubt sind JPG, PNG und WebP. SVG/HTML/PHP sind nicht erlaubt.'], 422);
    }

    $baseDir = QUIZ_HERO_PUBLIC_ROOT . '/images/uploads';
    $uploadFolder = match ($context) {
        'category' => 'categories/' . $categoryId,
        'media' => 'media',
        default => $categoryId,
    };
    $categoryDir = $baseDir . '/' . $uploadFolder;
    if (!is_dir($categoryDir) && !mkdir($categoryDir, 0755, true) && !is_dir($categoryDir)) {
        json_response(['ok' => false, 'error' => 'Upload-Ordner konnte nicht erstellt werden.'], 500);
    }

    $originalName = pathinfo((string) ($file['name'] ?? 'quiz-bild'), PATHINFO_FILENAME);
    $safeName = slugify($originalName);
    $extension = $allowed[$mime];
    if (!$replace && uploaded_image_name_exists($categoryDir, $safeName)) {
        json_response(['ok' => false, 'error' => 'In dieser Kategorie gibt es bereits ein Bild mit diesem Dateinamen. Bitte benenne die Datei um oder entferne das vorhandene Bild.'], 409);
    }

    $filename = sprintf('%s-%s.%s', $safeName, bin2hex(random_bytes(6)), $extension);
    $target = $categoryDir . '/' . $filename;
    if (file_exists($target)) {
        json_response(['ok' => false, 'error' => 'In dieser Kategorie gibt es bereits ein Bild mit diesem Dateinamen. Bitte benenne die Datei um.'], 409);
    }

    if (!move_uploaded_file($tmpName, $target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'], 500);
    }

    @chmod($target, 0644);

    $relativePath = sprintf('images/uploads/%s/%s', $uploadFolder, $filename);
    $replaced = 0;
    if ($replace) {
        $pdo = db();
        try {
            $pdo->beginTransaction();
            // Lock the current catalog before checking usage and updating all aliases.
            $questions = $pdo->query('SELECT id,image_url FROM quiz_questions ORDER BY id FOR UPDATE')->fetchAll();
            $categories = $pdo->query('SELECT id,icon FROM quiz_categories ORDER BY id FOR UPDATE')->fetchAll();
            $references = load_media_references();
            $currentVersion = media_version($oldPath, $references[$oldPath] ?? []);
            if (!hash_equals($currentVersion, (string) ($_POST['version'] ?? ''))) {
                $pdo->rollBack();
                @unlink($target);
                json_response(['ok' => false, 'error' => 'Die Verwendungen wurden inzwischen geändert. Bitte neu auswählen.'], 409);
            }
            foreach (['quiz_questions' => [$questions, 'image_url'], 'quiz_categories' => [$categories, 'icon']] as $table => [$rows, $column]) {
                $update = $pdo->prepare("UPDATE {$table} SET {$column}=? WHERE id=?");
                foreach ($rows as $row) {
                    if (normalize_local_image_path((string) ($row[$column] ?? '')) !== $oldPath) continue;
                    $update->execute([$relativePath, $row['id']]);
                    $replaced++;
                }
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            @unlink($target);
            throw $error;
        }
    }
    json_response([
        'ok' => true,
        'apiVersion' => QUIZ_HERO_API_VERSION,
        'path' => $relativePath,
        'replaced' => $replaced,
        'mimeType' => $mime,
        'size' => $size,
        'width' => (int) ($imageInfo[0] ?? 0),
        'height' => (int) ($imageInfo[1] ?? 0),
    ]);
}

function admin_media_list(): void
{
    require_method('GET');
    require_admin();
    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION, 'media' => list_uploaded_media()]);
}

function admin_media_delete(): void
{
    require_method('POST');
    require_admin_csrf();
    $data = read_json_body();
    $path = normalize_uploaded_media_path((string) ($data['path'] ?? ''));
    if ($path === '') {
        json_response(['ok' => false, 'error' => 'Bildpfad fehlt.'], 422);
    }

    $media = list_uploaded_media();
    $entry = null;
    foreach ($media as $item) {
        if ($item['path'] === $path) {
            $entry = $item;
            break;
        }
    }
    if (!$entry) {
        json_response(['ok' => false, 'error' => 'Bild wurde nicht gefunden.'], 404);
    }
    if (!empty($entry['used']) || !empty($entry['historical'])) {
        json_response(['ok' => false, 'error' => 'Bild wird noch verwendet und kann nicht geloescht werden.'], 409);
    }

    $root = realpath(QUIZ_HERO_PUBLIC_ROOT . '/images/uploads');
    $target = realpath(QUIZ_HERO_PUBLIC_ROOT . '/' . $path);
    if ($root === false || $target === false || !str_starts_with($target, $root . DIRECTORY_SEPARATOR)) {
        json_response(['ok' => false, 'error' => 'Ungültiger Bildpfad.'], 400);
    }
    if (!is_file($target) || !unlink($target)) {
        json_response(['ok' => false, 'error' => 'Bild konnte nicht geloescht werden.'], 500);
    }

    json_response(['ok' => true, 'apiVersion' => QUIZ_HERO_API_VERSION]);
}

function list_uploaded_media(): array
{
    $baseDir = QUIZ_HERO_PUBLIC_ROOT . '/images/uploads';
    $references = load_media_references();
    $historical = historical_media_paths();
    $items = [];
    $indexed = [];

    if (is_dir($baseDir)) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file instanceof SplFileInfo || !$file->isFile()) {
                continue;
            }
            $item = build_media_item($file->getPathname(), $references, $historical);
            if (!$item) {
                continue;
            }
            $items[] = $item;
            $indexed[$item['path']] = true;
        }
    }

    foreach (array_keys($references + $historical) as $relative) {
        if (isset($indexed[$relative])) {
            continue;
        }
        $absolute = QUIZ_HERO_PUBLIC_ROOT . '/' . $relative;
        if (!is_file($absolute)) {
            continue;
        }
        $item = build_media_item($absolute, $references, $historical);
        if ($item) {
            $items[] = $item;
        }
    }

    usort($items, static fn(array $a, array $b): int => strcmp($a['filename'], $b['filename']));
    return $items;
}

function build_media_item(string $path, array $references, array $historical = []): ?array
{
    $mime = detect_mime_type($path);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        return null;
    }
    $relative = str_replace('\\', '/', substr($path, strlen(QUIZ_HERO_PUBLIC_ROOT) + 1));
    if (!str_starts_with($relative, 'images/')) {
        return null;
    }
    $info = @getimagesize($path) ?: [];
    $usage = $references[$relative] ?? [];
    $categories = array_values(array_unique(array_filter(array_map(
        static fn(array $ref): string => (string) ($ref['categoryId'] ?? ''),
        $usage
    ))));
    $tags = array_values(array_unique(array_merge(...array_map(
        static fn(array $ref): array => $ref['tags'] ?? [],
        $usage ?: [[]]
    ))));
    sort($categories);
    sort($tags);

    return [
        'path' => $relative,
        'filename' => basename($relative),
        'folder' => dirname($relative) === '.' ? '' : dirname($relative),
        'url' => '../' . $relative,
        'mimeType' => $mime,
        'size' => filesize($path) ?: 0,
        'modifiedAt' => date(DATE_ATOM, filemtime($path) ?: time()),
        'width' => (int) ($info[0] ?? 0),
        'height' => (int) ($info[1] ?? 0),
        'used' => count($usage) > 0,
        'usage' => $usage,
        'categories' => $categories,
        'tags' => $tags,
        'version' => media_version($relative, $usage),
        'historical' => isset($historical[$relative]),
        'deletable' => str_starts_with($relative, 'images/uploads/') && count($usage) === 0 && !isset($historical[$relative]),
    ];
}

function load_media_references(): array
{
    $references = [];
    $pdo = db();
    $questions = $pdo->query('SELECT id, category_id, question, image_url, tags_json FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> "" ORDER BY id')->fetchAll();
    foreach ($questions as $question) {
        $path = normalize_local_image_path((string) ($question['image_url'] ?? ''));
        if ($path === '') {
            continue;
        }
        $references[$path][] = [
            'type' => 'question',
            'id' => (int) $question['id'],
            'title' => clean_string($question['question'] ?? '', 140),
            'categoryId' => $question['category_id'],
            'tags' => decode_json_field($question['tags_json'] ?? null, []),
        ];
    }

    $categories = $pdo->query('SELECT id, title, icon FROM quiz_categories WHERE icon IS NOT NULL AND icon <> "" ORDER BY id')->fetchAll();
    foreach ($categories as $category) {
        $path = normalize_local_image_path((string) ($category['icon'] ?? ''));
        if ($path === '') {
            continue;
        }
        $references[$path][] = [
            'type' => 'category',
            'id' => $category['id'],
            'title' => $category['title'],
            'categoryId' => $category['id'],
            'tags' => [],
        ];
    }

    return $references;
}

function media_version(string $relative, array $usage): string
{
    $root = realpath(QUIZ_HERO_PUBLIC_ROOT . '/images');
    $path = realpath(QUIZ_HERO_PUBLIC_ROOT . '/' . $relative);
    $hash = $root !== false && $path !== false && str_starts_with($path, $root . DIRECTORY_SEPARATOR) && is_file($path)
        ? hash_file('sha256', $path) : '';
    return hash('sha256', $hash . json_encode($usage, JSON_THROW_ON_ERROR));
}

function historical_media_paths(): array
{
    $paths = [];
    foreach (db()->query('SELECT snapshot_json FROM quiz_question_versions') as $row) {
        $snapshot = decode_json_field($row['snapshot_json'], []);
        $path = normalize_local_image_path((string) ($snapshot['imageUrl'] ?? ''));
        if ($path !== '') $paths[$path] = true;
    }
    foreach (db()->query('SELECT questions_json FROM quiz_rounds') as $row) {
        foreach (decode_json_field($row['questions_json'], []) as $question) {
            $path = normalize_local_image_path((string) ($question['imageUrl'] ?? ''));
            if ($path !== '') $paths[$path] = true;
        }
    }
    return $paths;
}

function normalize_local_image_path(string $path): string
{
    $path = trim(str_replace('\\', '/', $path));
    if ($path === '' || preg_match('/^https?:\/\//i', $path)) {
        return '';
    }
    $path = preg_replace('/[?#].*$/', '', $path) ?? '';
    $path = ltrim($path, '/');
    if (str_starts_with($path, '../')) {
        $path = substr($path, 3);
    }
    if (!str_starts_with($path, 'images/')) {
        return '';
    }
    if (str_contains($path, '../')) {
        return '';
    }
    return $path;
}

function normalize_uploaded_media_path(string $path): string
{
    $path = normalize_local_image_path($path);
    if ($path === '' || !str_starts_with($path, 'images/uploads/')) {
        return '';
    }
    return $path;
}

function uploaded_image_name_exists(string $directory, string $safeName): bool
{
    $patterns = [
        $directory . '/' . $safeName . '-*.jpg',
        $directory . '/' . $safeName . '-*.png',
        $directory . '/' . $safeName . '-*.webp',
        $directory . '/' . $safeName . '.jpg',
        $directory . '/' . $safeName . '.png',
        $directory . '/' . $safeName . '.webp',
    ];

    foreach ($patterns as $pattern) {
        if (glob($pattern, GLOB_NOSORT)) {
            return true;
        }
    }

    return false;
}

function detect_mime_type(string $path): string
{
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return (string) (mime_content_type($path) ?: '');
}

function upload_error_message(int $error): string
{
    return match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Das Bild ist zu groß.',
        UPLOAD_ERR_PARTIAL => 'Das Bild wurde nur teilweise hochgeladen.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server-Upload-Ordner fehlt.',
        UPLOAD_ERR_CANT_WRITE => 'Bild konnte nicht auf dem Server gespeichert werden.',
        UPLOAD_ERR_EXTENSION => 'Upload wurde von einer PHP-Erweiterung gestoppt.',
        default => 'Upload fehlgeschlagen.',
    };
}
