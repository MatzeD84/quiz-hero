# Hostinger production

Production URL: https://quiz-hero.de. Hostinger Git deployment remains on branch `hostinger`. The working Beta design is separate.

The existing website root `/home/u199598707/domains/quiz-hero-stage.matzeverse.de` is retained intentionally: `quiz-hero.de` is its Hostinger alias. Both names share the same release, uploads and database. This is not an isolated staging environment. The former staging hostname redirects to production; create a separate database and website before using it for development again.

`deployment/hostinger.json` controls the build origin and environment. Production builds require `ALLOW_PRODUCTION_BUILD=true`; the Hostinger build hook sets this only after validating the reviewed production target. Set the private server configuration's `SITE_URL` to the same origin. Credentials remain outside Git.

Source deployment never imports quiz JSON or restores a database. Questions, accounts and uploaded media remain in the existing database and shared uploads. The content worker generates SEO pages from the live database separately.

Mail: `info@quiz-hero.de` is the intended mailbox. DNS contains Hostinger MX, SPF, DKIM and DMARC. Website transactional mail additionally requires server-side SMTP configuration; mailbox existence alone does not configure the application. Never commit SMTP passwords.

Validation: production build, contract tests, PHP lint, HTTPS release/API checks, canonical URLs, redirects and sitemap. Before rollout back up the private runtime configuration and take a database backup; keep the previous release available for rollback.

During the initial DNS migration only, the worker can be run with `QUIZ_HERO_VERIFY_IP=46.202.158.83` to verify the Hostinger origin despite stale recursive DNS caches. TLS verification stays enabled. This variable is not stored in cron; subsequent automatic deployments verify public DNS normally.
