<?php
declare(strict_types=1);

// Provision as api/config.local.php on the staging server; never commit real credentials.
return [
    'QUIZ_HERO_DB_HOST' => 'localhost',
    'QUIZ_HERO_DB_PORT' => '3306',
    'QUIZ_HERO_DB_NAME' => 'HOSTINGER_DATABASE_NAME',
    'QUIZ_HERO_DB_USER' => 'HOSTINGER_DATABASE_USER',
    'QUIZ_HERO_DB_PASSWORD' => 'SET_PRIVATELY',
    'QUIZ_HERO_ADMIN_USER' => 'stage-admin',
    'QUIZ_HERO_ADMIN_PASSWORD_HASH' => 'SET_NEW_PASSWORD_HASH_PRIVATELY',
    'QUIZ_HERO_USER_TOKEN_SECRET' => 'SET_NEW_RANDOM_SECRET_PRIVATELY',
    'QUIZ_HERO_SEO_EXPORT_TOKEN' => 'SET_NEW_RANDOM_SECRET_PRIVATELY',
    'SITE_URL' => 'https://quiz-hero-stage.matzeverse.de',
    'QUIZ_HERO_MAIL_FROM' => 'info@quiz-hero.de',
    // No real account/notification mail until a staging mail destination is configured.
    'QUIZ_HERO_MAIL_TRANSPORT' => 'disabled',
    'QUIZ_HERO_ALLOW_DEV_ACCOUNT_LOGIN' => 'false',
    'QUIZ_HERO_SERVER_MANAGED_HEADERS' => 'true',
];
