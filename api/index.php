<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require QUIZ_HERO_ROOT . '/src/backend/modules.php';

const QUIZ_HERO_API_VERSION = '1';
const QUIZ_HERO_MAX_IMAGE_UPLOAD_BYTES = 6291456;
const QUIZ_HERO_CONSENT_VERSION = '2026-06-30';
const QUIZ_HERO_USERNAME_MAX_LENGTH = 50;

$action = $_GET['action'] ?? 'public-data';
$apiVersion = trim((string) ($_GET['v'] ?? QUIZ_HERO_API_VERSION));

if ($apiVersion !== QUIZ_HERO_API_VERSION) {
    json_response([
        'ok' => false,
        'error' => 'Nicht unterstuetzte API-Version.',
        'supportedVersions' => [QUIZ_HERO_API_VERSION],
    ], 400);
}

try {
    match ($action) {
        'public-data' => public_data(),
        'avatars' => json_response(array_values(hero_avatars())),
        'start-round' => start_round(),
        'save-result' => save_result(),
        'question-feedback-save' => question_feedback_save(),
        'account-register' => account_register(),
        'account-resend-verification' => account_resend_verification(),
        'account-verify-email' => account_verify_email(),
        'account-login' => account_login(),
        'account-dev-login' => account_dev_login(),
        'account-me' => account_me(),
        'account-journey' => account_journey(),
        'account-logout' => account_logout(),
        'account-update' => account_update(),
        'account-delete' => account_delete(),
        'account-request-password-reset' => account_request_password_reset(),
        'account-reset-password' => account_reset_password(),
        'admin-login' => admin_login(),
        'admin-logout' => admin_logout(),
        'admin-me' => admin_me(),
        'admin-data' => admin_data(),
        'seo-export' => seo_export(),
        'admin-question-save' => admin_question_save(),
        'admin-question-import' => admin_question_import(),
        'admin-question-delete' => admin_question_delete(),
        'admin-category-save' => admin_category_save(),
        'admin-category-delete' => admin_category_delete(),
        'admin-image-upload' => admin_image_upload(),
        'admin-media-list' => admin_media_list(),
        'admin-media-delete' => admin_media_delete(),
        'admin-users-list' => admin_users_list(),
        'admin-user-delete' => admin_user_delete(),
        'admin-question-feedback-list' => admin_question_feedback_list(),
        'admin-question-feedback-delete' => admin_question_feedback_delete(),
        default => json_response(['ok' => false, 'error' => 'Unbekannte API-Aktion.'], 404),
    };
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    json_response(['ok' => false, 'error' => 'Datenbankfehler. Bitte Konfiguration prüfen.'], 500);
} catch (Throwable $exception) {
    // Transaction cleanup is automatic on disconnect; never expose mail bodies or tokens.
    error_log('Quiz-Hero request failed: ' . get_class($exception));
    json_response(['ok' => false, 'error' => 'Serverfehler.'], 500);
}
