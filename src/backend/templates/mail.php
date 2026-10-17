<?php
declare(strict_types=1);

function account_verification_mail_html(string $link): string
{
    $safeLink = htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Registrierung bestätigen</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#222;font-weight:800;">Willkommen bei Quiz-Hero</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#5f666b;">Bestätige kurz deine E-Mail-Adresse, dann ist dein Account bereit.</p>
              <a href="{$safeLink}" style="display:inline-block;background:#3f3f3f;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:14px 22px;border-radius:4px;">E-Mail bestätigen</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Der Link ist 24 Stunden gültig. Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#747b80;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#226184;word-break:break-all;">{$safeLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function account_password_reset_mail_html(string $link): string
{
    $safeLink = htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Passwort zurücksetzen</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#222;font-weight:800;">Passwort zurücksetzen</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.55;color:#5f666b;">Du hast ein neues Passwort für deinen Quiz-Hero Account angefordert. Lege es über den Button neu fest.</p>
              <a href="{$safeLink}" style="display:inline-block;background:#3f3f3f;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:14px 22px;border-radius:4px;">Passwort neu festlegen</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Der Link ist 1 Stunde gültig. Wenn du das nicht warst, kannst du diese E-Mail ignorieren.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#747b80;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#226184;word-break:break-all;">{$safeLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function account_registration_notice_mail_html(string $username, string $email): string
{
    $safeUsername = htmlspecialchars($username, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCreatedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Quiz-Hero Registrierung</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;color:#222;font-weight:800;text-align:center;">Neue Registrierung</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#5f666b;text-align:center;">Ein neuer Quiz-Hero Account wurde angelegt.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fafb;border:1px solid #dbe8ee;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;font-size:14px;line-height:1.5;color:#747b80;">Username</td>
                  <td style="padding:14px 16px;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeUsername}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#747b80;">E-Mail</td>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeEmail}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#747b80;">Zeitpunkt</td>
                  <td style="padding:14px 16px;border-top:1px solid #dbe8ee;font-size:14px;line-height:1.5;color:#222;font-weight:700;text-align:right;">{$safeCreatedAt}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function account_deleted_mail_html(string $username): string
{
    $safeUsername = htmlspecialchars($username !== '' ? $username : 'Quiz-Hero', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeDeletedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz-Hero Account gelöscht</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 28px 12px;">
              <img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;color:#222;font-weight:800;">Account gelöscht</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#5f666b;">Hallo {$safeUsername}, dein Quiz-Hero Account wurde gelöscht.</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#747b80;">Deine persönlichen Accountdaten wurden entfernt. Deine bisherigen Quiz-Ergebnisse bleiben nur anonymisiert erhalten.</p>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#747b80;">Zeitpunkt: {$safeDeletedAt}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f6fafb;border-top:1px solid #dbe8ee;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#747b80;">Wenn du deinen Account nicht selbst gelöscht hast, antworte bitte auf diese E-Mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function question_feedback_mail_html(string $question, array $types, string $comment, string $userText): string
{
    $safeQuestion = htmlspecialchars($question, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeTypes = htmlspecialchars(implode(', ', array_map('question_feedback_type_label', $types)), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeComment = htmlspecialchars($comment !== '' ? $comment : '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeUserText = htmlspecialchars($userText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCreatedAt = htmlspecialchars(date('d.m.Y H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $logoUrl = htmlspecialchars(public_base_url() . '/images/website/avatar/logo.png', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neues Quiz-Hero Feedback</title>
</head>
<body style="margin:0;padding:0;background:#eef4f6;color:#222;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f6;margin:0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #c9dbe5;border-radius:8px;overflow:hidden;">
          <tr><td align="center" style="padding:28px 28px 12px;"><img src="{$logoUrl}" alt="Quiz-Hero" width="84" height="84" style="display:block;border:0;width:84px;height:84px;object-fit:contain;"></td></tr>
          <tr>
            <td style="padding:0 32px 30px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;color:#222;font-weight:800;text-align:center;">Neues Frage-Feedback</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#747b80;">Zeitpunkt: {$safeCreatedAt}</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#747b80;">Frage</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#222;font-weight:700;">{$safeQuestion}</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#747b80;">Meldungstyp</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#222;">{$safeTypes}</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#747b80;">Kommentar</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#222;">{$safeComment}</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#747b80;">{$safeUserText}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}
