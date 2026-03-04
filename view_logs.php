<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Laravel Log Viewer ===\n\n";

$logFile = __DIR__ . '/storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "❌ Log file not found: {$logFile}\n";
    exit;
}

$fileSize = filesize($logFile);
echo "Log file: {$logFile}\n";
echo "Size: " . number_format($fileSize / 1024, 2) . " KB\n\n";

// Read last 100 lines
$lines = 100;
$handle = fopen($logFile, 'r');
$linecounter = 0;
$pos = -2;
$beginning = false;
$text = [];

if ($handle) {
    while ($linecounter < $lines) {
        $t = " ";
        while ($t != "\n") {
            if (fseek($handle, $pos, SEEK_END) == -1) {
                $beginning = true;
                break;
            }
            $t = fgetc($handle);
            $pos--;
        }
        if ($beginning) {
            rewind($handle);
        }
        $text[$linecounter] = fgets($handle);
        if ($beginning) break;
        $linecounter++;
    }
    fclose($handle);
}

$text = array_reverse($text);

// Display logs with color coding
foreach ($text as $line) {
    if (empty(trim($line))) continue;
    
    // Color code based on log level
    if (strpos($line, 'ERROR') !== false || strpos($line, 'CRITICAL') !== false) {
        echo "\033[31m"; // Red
    } elseif (strpos($line, 'WARNING') !== false) {
        echo "\033[33m"; // Yellow  
    } elseif (strpos($line, 'INFO') !== false) {
        echo "\033[32m"; // Green
    } elseif (strpos($line, 'DEBUG') !== false) {
        echo "\033[36m"; // Cyan
    }
    
    echo $line;
    echo "\033[0m"; // Reset color
}

echo "\n=== End of Logs ===\n";
echo "\nTo see more logs, run: tail -n 200 storage/logs/laravel.log\n";
