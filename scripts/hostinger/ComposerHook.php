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
        // Hostinger applies web disable_functions to CLI too. Start a dedicated
        // CLI interpreter for the build; no web PHP settings are changed.
        if (!function_exists('pcntl_exec')) throw new \RuntimeException('Hostinger CLI requires pcntl_exec for the isolated build interpreter');
        pcntl_exec(PHP_BINARY, ['-d', 'disable_functions=', $root . '/scripts/hostinger/build-from-git.php']);
        throw new \RuntimeException('Could not start Hostinger CLI build');
    }
}
