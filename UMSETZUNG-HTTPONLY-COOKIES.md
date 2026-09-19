# Benutzeranmeldung mit HttpOnly-Cookie und CSRF-Schutz

Stand: 19. September 2026. Die Änderungen sind lokal umgesetzt und geprüft. Es wurde nichts committet, gemergt oder produktiv veröffentlicht.

## Verhalten

Das zufällige, serverseitig widerrufbare Sitzungstoken wird nur noch als Cookie `quiz_hero_session` übertragen. Das Cookie gilt für den gesamten Ursprung, ist `HttpOnly` und `SameSite=Lax`; auf der konfigurierten HTTPS-Produktionsadresse wird zusätzlich `Secure` gesetzt. In der Datenbank bleibt ausschließlich der SHA-256-Hash. Die maximale Laufzeit von sieben Tagen und das Inaktivitätslimit von 24 Stunden bleiben bestehen.

Login, E-Mail-Bestätigung, Passwortreset und lokaler Entwicklungslogin setzen das Cookie und liefern öffentliche Profildaten sowie ein getrenntes CSRF-Token. Das CSRF-Token liegt im Sitzungsspeicher des Browsertabs und wird bei Accountänderung, Kontolöschung, Logout, Ergebnisspeicherung und angemeldetem Fragenfeedback im Header `X-Quiz-Hero-CSRF` gesendet. `account-me` dient nach einem Seitenaufruf zur Prüfung der Cookie-Sitzung und erneuten Bereitstellung des CSRF-Tokens.

Der LocalStorage enthält weiterhin die nicht geheimen Profildaten für die sofortige Darstellung, aber kein Sitzungs- oder CSRF-Token. Die API ignoriert frühere `userId`-/`userToken`-Payloads; ohne gültiges Cookie entsteht daraus keine Anmeldung. Logout löscht die aktuelle Datenbanksitzung und das Cookie. Passwortänderung und Reset widerrufen alle bisherigen Sitzungen und stellen eine neue aus. Kontolöschung widerruft alle Sitzungen und entfernt das Cookie.

## Geprüfte Sicherheitsgrenzen

- Loginantworten enthalten kein Sitzungstoken.
- Das Cookie ist für JavaScript nicht über `document.cookie` lesbar.
- Fehlendes oder falsches CSRF-Token sowie ein fremder Origin werden bei geschützten Benutzeraktionen abgewiesen.
- Zwei Logins bleiben unabhängige Sitzungen; Logout einer Sitzung beendet die andere nicht.
- Passwortwechsel, Reset, absolute Laufzeit, Inaktivitätslimit und gelöschte Accounts beenden alte Sitzungen.
- Alte Bearer-Payloads ohne Cookie werden abgewiesen.
- Cookie-Werte werden in der Datenbank nicht im Klartext gespeichert.

## Tests

- `node --test tests/contracts.test.mjs`: neun erfolgreiche Tests, darunter Cookie-Credentials, CSRF-Header und Ausschluss geheimer Werte aus LocalStorage/Payloads.
- `tests/integration.php`: 40 erfolgreiche PHP-/MySQL-Prüfungen in der isolierten Datenbank `quiz_hero_audit_cookie`.
- PHP-Syntaxprüfung für `api/user-sessions.php`, `api/index.php` und `tests/integration.php` erfolgreich.
- Chrome auf `http://localhost:8080`: Entwicklungslogin, Profildatenabruf, CSRF-Ablehnung ohne Header, Ergebnisspeicherung mit Header und Logout geprüft. `document.cookie` blieb leer, LocalStorage enthielt nur Profildaten, und `account-me` antwortete nach Logout mit HTTP 401.

Diese Prüfung ist eine gezielte Sicherheits- und Regressionstestreihe, kein vollständiger externer Penetrationstest. Vor dem manuellen Produktionsdeploy müssen HTTPS, das tatsächlich gesetzte `Secure`-Attribut und die vollständigen Login-/Accountabläufe auf der Zielumgebung erneut geprüft werden. Die Umstellung meldet vorhandene Browser-Sitzungen einmalig ab, weil frühere LocalStorage-Bearertokens nicht mehr akzeptiert werden.
