<?php
// config.php - Database configuration

// Database connection settings
define('DB_SERVER', '127.0.0.1');
define('DB_USERNAME', 'root');
define('DB_NAME', 'music_player');

// Support multiple password options: env var, 'root', ''
$possible_passwords = array_unique(array_filter([
    getenv('DB_PASSWORD') !== false && getenv('DB_PASSWORD') !== '' ? getenv('DB_PASSWORD') : null,
    'root',
    ''
], function($v) { return $v !== null; }));

$mysqli = false;
$active_password = '';

foreach ($possible_passwords as $pwd) {
    try {
        $conn = @new mysqli(DB_SERVER, DB_USERNAME, $pwd, DB_NAME);
        if ($conn && !$conn->connect_error) {
            $mysqli = $conn;
            $active_password = $pwd;
            break;
        }
    } catch (Throwable $t) {
        // Continue trying
    }
}

define('DB_PASSWORD', $active_password);

// Check connection
if ($mysqli === false || $mysqli->connect_error) {
    die("ERROR: Could not connect to database: " . ($mysqli ? $mysqli->connect_error : 'Unknown error'));
}

// Set charset to utf8mb4
$mysqli->set_charset("utf8mb4");
?>