<?php
declare(strict_types=1);
namespace QuizHero\Hostinger;

final class ComposerHook
{
    public static function deploy(): void
    {
        $root = dirname(__DIR__, 2);
        if (PHP_SAPI !== 'cli' || !is_file($root . '/.hostinger-server')) {
            echo "Local Composer installation; server deployment skipped.\n";
            return;
        }
        // hPanel Git jobs have short execution limits. The Hostinger cron worker
        // builds an immutable commit snapshot without blocking the Git callback.
        $target = json_decode(file_get_contents($root . '/deployment/hostinger.json'), true, 512, JSON_THROW_ON_ERROR);
        $site = $target['siteRoot'];
        if (realpath($root) !== $site . '/shared/source') throw new \RuntimeException('Unexpected repository location');
        file_put_contents($site . '/private/deploy-requested', gmdate(DATE_ATOM) . "\n");
        echo "Git updated. Hostinger deployment worker will build the new commit.\n";
    }
}
