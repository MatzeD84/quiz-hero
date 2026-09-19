<?php
declare(strict_types=1);
// Loopback-only SMTP receiver for integration tests. Never forwards mail.
$directory = $argv[1];
$server = stream_socket_server('tcp://127.0.0.1:0');
file_put_contents($directory . '/smtp-address', stream_socket_get_name($server, false));
while ($client = @stream_socket_accept($server, 60)) {
    fwrite($client, "220 local-test ESMTP\r\n");
    $body = '';
    $data = false;
    while (($line = fgets($client)) !== false) {
        if ($data) {
            if (rtrim($line, "\r\n") === '.') {
                file_put_contents($directory . '/smtp-mails', json_encode($body) . "\n", FILE_APPEND | LOCK_EX);
                fwrite($client, "250 stored\r\n");
                $data = false;
            } else $body .= $line;
        } elseif (str_starts_with($line, 'DATA')) {
            fwrite($client, "354 send message\r\n"); $data = true;
        } elseif (str_starts_with($line, 'QUIT')) {
            fwrite($client, "221 bye\r\n"); break;
        } else fwrite($client, "250 OK\r\n");
    }
    fclose($client);
}
