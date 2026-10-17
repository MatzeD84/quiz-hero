<?php
declare(strict_types=1);

function send_account_mail(string $to, string $subject, string $message, ?string $htmlMessage = null): void
{
    $from = env_value('QUIZ_HERO_MAIL_FROM', 'info@quiz-hero.de');
    $transport = env_value('QUIZ_HERO_MAIL_TRANSPORT', 'log');
    $encodedSubject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8')
        : $subject;
    $headers = [
        'From: Quiz-Hero <' . $from . '>',
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'X-Mailer: Quiz-Hero',
    ];
    $mailBody = $message;
    if ($htmlMessage !== null) {
        $boundary = 'quizhero-' . bin2hex(random_bytes(12));
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $mailBody = "--{$boundary}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $message . "\r\n\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $htmlMessage . "\r\n\r\n"
            . "--{$boundary}--";
    } else {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    }

    if ($transport === 'smtp' && smtp_send_account_mail($to, $from, $encodedSubject, $headers, $mailBody)) {
        return;
    }
    if ($transport === 'mail' && @mail($to, $encodedSubject, $mailBody, implode("\r\n", $headers))) {
        return;
    }
    // Explicit local development transport only. Never log delivery failures or auth links in the webroot.
    if ($transport === 'log' && env_value('QUIZ_HERO_ALLOW_DEV_ACCOUNT_LOGIN', 'false') === 'true') {
        $dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . '/quiz-hero-private-mail';
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new RuntimeException('Local mail directory unavailable.');
        }
        $file = $dir . '/mail.log';
        $handle = fopen($file, 'ab');
        if ($handle === false) {
            throw new RuntimeException('Local mail log unavailable.');
        }
        chmod($file, 0600);
        flock($handle, LOCK_EX);
        fwrite($handle, '[' . gmdate(DATE_ATOM) . "] To: {$to}\nSubject: {$subject}\n{$mailBody}\n\n");
        flock($handle, LOCK_UN);
        fclose($handle);
        return;
    }
    error_log('Quiz-Hero: account mail delivery failed.');
    throw new RuntimeException('E-Mail konnte nicht versendet werden.');
}

function send_notification_mail(string $to, string $subject, string $message, ?string $htmlMessage = null): void
{
    try {
        send_account_mail($to, $subject, $message, $htmlMessage);
    } catch (Throwable $exception) {
        // The underlying action is already committed. A notification failure must not claim it failed.
        error_log('Quiz-Hero notification delivery failed.');
    }
}

function smtp_send_account_mail(string $to, string $from, string $encodedSubject, array $headers, string $body): bool
{
    $host = trim((string) env_value('QUIZ_HERO_SMTP_HOST', ''));
    if ($host === '') {
        error_log('Quiz-Hero SMTP host is missing.');
        return false;
    }

    $port = (int) env_value('QUIZ_HERO_SMTP_PORT', '587');
    $secure = strtolower(trim((string) env_value('QUIZ_HERO_SMTP_SECURE', 'tls')));
    $username = trim((string) env_value('QUIZ_HERO_SMTP_USER', ''));
    $password = (string) env_value('QUIZ_HERO_SMTP_PASSWORD', '');
    $timeout = max(5, (int) env_value('QUIZ_HERO_SMTP_TIMEOUT', '15'));
    $server = $secure === 'ssl' ? 'ssl://' . $host : $host;
    $socket = @fsockopen($server, $port, $errno, $errstr, $timeout);
    if (!$socket) {
        error_log("Quiz-Hero SMTP connection failed: {$errno} {$errstr}");
        return false;
    }

    stream_set_timeout($socket, $timeout);

    try {
        smtp_expect($socket, [220]);
        smtp_command($socket, 'EHLO quiz-hero.de', [250]);

        if ($secure === 'tls' || $secure === 'starttls') {
            smtp_command($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP STARTTLS konnte nicht aktiviert werden.');
            }
            smtp_command($socket, 'EHLO quiz-hero.de', [250]);
        }

        if ($username !== '') {
            smtp_command($socket, 'AUTH LOGIN', [334]);
            smtp_command($socket, base64_encode($username), [334], false);
            smtp_command($socket, base64_encode($password), [235], false);
        }

        smtp_command($socket, 'MAIL FROM:<' . smtp_address($from) . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . smtp_address($to) . '>', [250, 251]);
        smtp_command($socket, 'DATA', [354]);

        $messageHeaders = array_merge([
            'To: ' . smtp_address($to),
            'Subject: ' . $encodedSubject,
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@quiz-hero.de>',
        ], $headers);
        fwrite($socket, implode("\r\n", $messageHeaders) . "\r\n\r\n" . smtp_dot_stuff($body) . "\r\n.\r\n");
        smtp_expect($socket, [250]);
        smtp_command($socket, 'QUIT', [221]);
        fclose($socket);
        return true;
    } catch (Throwable $exception) {
        error_log('Quiz-Hero SMTP error: ' . $exception->getMessage());
        @fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return false;
    }
}

function smtp_address(string $email): string
{
    $email = normalize_email($email);
    if ($email === '') {
        throw new RuntimeException('Ungültige SMTP-Adresse.');
    }
    return $email;
}

function smtp_command($socket, string $command, array $expectedCodes, bool $appendLineBreak = true): void
{
    fwrite($socket, $command . ($appendLineBreak ? "\r\n" : "\r\n"));
    smtp_expect($socket, $expectedCodes);
}

function smtp_expect($socket, array $expectedCodes): void
{
    $response = '';
    $code = 0;
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^(\d{3})\s/', $line, $matches)) {
            $code = (int) $matches[1];
            break;
        }
    }
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('Unerwartete SMTP-Antwort: ' . trim($response));
    }
}

function smtp_dot_stuff(string $body): string
{
    $body = preg_replace("/\r\n|\r|\n/", "\r\n", $body) ?? $body;
    return preg_replace('/^\./m', '..', $body) ?? $body;
}

function notify_registration_created(string $username, string $email): void
{
    $recipient = normalize_email(env_value('QUIZ_HERO_REGISTRATION_NOTIFY_EMAIL', env_value('QUIZ_HERO_MAIL_FROM', '')));
    if ($recipient === '') {
        return;
    }

    send_notification_mail(
        $recipient,
        'Neue Quiz-Hero Registrierung',
        "Hallo,\n\nes hat sich ein neuer User bei Quiz-Hero registriert.\n\nUsername: {$username}\nE-Mail: {$email}\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nViele Grüße\nQuiz-Hero",
        account_registration_notice_mail_html($username, $email)
    );
}

function send_account_deleted_mail(string $email, string $username): void
{
    $recipient = normalize_email($email);
    if ($recipient === '') {
        return;
    }

    $displayName = $username !== '' ? $username : 'Quiz-Hero';
    send_notification_mail(
        $recipient,
        'Quiz-Hero Account gelöscht',
        "Hallo {$displayName},\n\ndein Quiz-Hero Account wurde gelöscht.\n\nDeine persönlichen Accountdaten wurden entfernt. Deine bisherigen Quiz-Ergebnisse bleiben nur anonymisiert erhalten.\n\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nWenn du deinen Account nicht selbst gelöscht hast, antworte bitte auf diese E-Mail.\n\nViele Grüße\nQuiz-Hero",
        account_deleted_mail_html($username)
    );
}

function notify_question_feedback_created(string $question, array $types, string $comment, ?int $userId): void
{
    $recipient = normalize_email(env_value('QUIZ_HERO_FEEDBACK_NOTIFY_EMAIL', env_value('QUIZ_HERO_SMTP_USER', env_value('QUIZ_HERO_REGISTRATION_NOTIFY_EMAIL', env_value('QUIZ_HERO_MAIL_FROM', '')))));
    if ($recipient === '') {
        return;
    }

    $typeText = implode(', ', array_map('question_feedback_type_label', $types));
    $userText = $userId !== null ? 'User-ID: ' . $userId : 'Nicht angemeldet';
    $subject = 'Neues Quiz-Hero Frage-Feedback';
    $message = "Hallo,\n\nes wurde Feedback zu einer Quiz-Frage gesendet.\n\nFrage: {$question}\nTyp: {$typeText}\nKommentar: " . ($comment !== '' ? $comment : '-') . "\nUser: {$userText}\nZeitpunkt: " . date('d.m.Y H:i') . "\n\nViele Grüße\nQuiz-Hero";
    send_notification_mail($recipient, $subject, $message, question_feedback_mail_html($question, $types, $comment, $userText));
}
