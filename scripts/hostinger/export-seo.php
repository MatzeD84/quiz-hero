<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(1); }
$config = require __DIR__ . '/config.php';
$_GET = ['action' => 'seo-export', 'v' => '1'];
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_X_QUIZ_HERO_SEO_TOKEN'] = $config['QUIZ_HERO_SEO_EXPORT_TOKEN'];
require dirname(__DIR__) . '/public_html/api/index.php';
