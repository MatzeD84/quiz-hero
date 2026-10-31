# Anmeldung und E-Mail-Bestätigung

Die Bestätigungsmail weist nach, dass die E-Mail-Adresse erreichbar ist. Ihr Link bestätigt ausschließlich die Adresse und meldet den Account nicht an. Anschließend erscheint die Loginmaske mit „E-Mail bestätigt. Du kannst dich jetzt anmelden.“ Für den Zugang ist das bei der Registrierung vergebene Passwort erforderlich.

So ermöglicht ein weitergeleiteter oder abgefangener Bestätigungslink allein keinen direkten Kontozugriff. Ein vollständig kompromittiertes Postfach bleibt wegen möglicher Passwortzurücksetzungen trotzdem ein Risiko.

Der Link ist zeitlich begrenzt und nur einmal verwendbar. Eine bereits bestehende Anmeldung bleibt bei der Bestätigung unverändert; sie wird weder ersetzt noch abgemeldet. Vorhandene, früher ausgestellte Bestätigungslinks bleiben gültig, bewirken aber ebenfalls keine automatische Anmeldung mehr.

Die Änderung benötigt keine Datenbankmigration und ändert keine Passwörter, Nutzerdaten oder bestehenden Sitzungen. Veröffentlichung und technische Prüfung werden im [Production-Protokoll](HOSTINGER-PRODUCTION.md) festgehalten.
