<?php
// database.php - Database functions (Fixed for existing tables)

// Include configuration
require_once 'config.php';

// Function to check if a column exists in a table
function columnExists($table, $column) {
    global $mysqli;
    $sql = "SHOW COLUMNS FROM $table LIKE '$column'";
    $result = $mysqli->query($sql);
    return $result && $result->num_rows > 0;
}

// Function to get all songs
function getSongs() {
    global $mysqli;
    
    $sql = "SELECT * FROM songs ORDER BY title";
    $result = $mysqli->query($sql);
    
    $songs = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }
    }
    
    return $songs;
}

// Function to get a single song by ID
function getSongById($id) {
    global $mysqli;
    
    $sql = "SELECT * FROM songs WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->fetch_assoc();
}

// Function to add a new song (compatible version)
function addSong($title, $artist, $featuring, $album, $duration, $lyrics, $cover_image, $audio_file) {
    global $mysqli;
    
    // Check if timestamp columns exist
    $hasTimestamps = columnExists('songs', 'created_at');
    
    if ($hasTimestamps) {
        $sql = "INSERT INTO songs (title, artist, featuring, album, duration, lyrics, cover_image, audio_file, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    } else {
        $sql = "INSERT INTO songs (title, artist, featuring, album, duration, lyrics, cover_image, audio_file) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    }
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("ssssisss", $title, $artist, $featuring, $album, $duration, $lyrics, $cover_image, $audio_file);
    
    if ($stmt->execute()) {
        return $mysqli->insert_id;
    }
    
    return false;
}

// Function to update a song (compatible version)
function updateSong($id, $title, $artist, $featuring, $album, $duration, $lyrics, $cover_image = null, $audio_file = null) {
    global $mysqli;
    
    // Check if timestamp columns exist
    $hasTimestamps = columnExists('songs', 'updated_at');
    
    if ($cover_image && $audio_file) {
        if ($hasTimestamps) {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, cover_image = ?, audio_file = ?, updated_at = NOW() WHERE id = ?";
        } else {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, cover_image = ?, audio_file = ? WHERE id = ?";
        }
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("ssssisssi", $title, $artist, $featuring, $album, $duration, $lyrics, $cover_image, $audio_file, $id);
    } elseif ($cover_image) {
        if ($hasTimestamps) {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, cover_image = ?, updated_at = NOW() WHERE id = ?";
        } else {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, cover_image = ? WHERE id = ?";
        }
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("ssssissi", $title, $artist, $featuring, $album, $duration, $lyrics, $cover_image, $id);
    } elseif ($audio_file) {
        if ($hasTimestamps) {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, audio_file = ?, updated_at = NOW() WHERE id = ?";
        } else {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, audio_file = ? WHERE id = ?";
        }
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("ssssissi", $title, $artist, $featuring, $album, $duration, $lyrics, $audio_file, $id);
    } else {
        if ($hasTimestamps) {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ?, updated_at = NOW() WHERE id = ?";
        } else {
            $sql = "UPDATE songs SET title = ?, artist = ?, featuring = ?, album = ?, duration = ?, lyrics = ? WHERE id = ?";
        }
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("ssssisi", $title, $artist, $featuring, $album, $duration, $lyrics, $id);
    }
    
    return $stmt->execute();
}

// Function to delete a song
function deleteSong($id) {
    global $mysqli;
    
    // First get the song details to delete the files
    $sql = "SELECT cover_image, audio_file FROM songs WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $song = $result->fetch_assoc();
    
    if ($song) {
        // Delete the files if they exist
        if (!empty($song['cover_image']) && file_exists($song['cover_image'])) {
            unlink($song['cover_image']);
        }
        if (!empty($song['audio_file']) && file_exists($song['audio_file'])) {
            unlink($song['audio_file']);
        }
        
        // Now delete the database record
        $sql = "DELETE FROM songs WHERE id = ?";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("i", $id);
        
        return $stmt->execute();
    }
    
    return false;
}

// Function to search songs
function searchSongs($query) {
    global $mysqli;
    
    $searchTerm = "%{$query}%";
    $sql = "SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR featuring LIKE ? ORDER BY title";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("ssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }
    }
    
    return $songs;
}

// Function to get songs by artist
function getSongsByArtist($artist) {
    global $mysqli;
    
    $sql = "SELECT * FROM songs WHERE artist = ? ORDER BY title";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("s", $artist);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }
    }
    
    return $songs;
}

// Function to get songs by album
function getSongsByAlbum($album) {
    global $mysqli;
    
    $sql = "SELECT * FROM songs WHERE album = ? ORDER BY title";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("s", $album);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }
    }
    
    return $songs;
}

// Function to get total songs count
function getTotalSongs() {
    global $mysqli;
    
    $sql = "SELECT COUNT(*) as total FROM songs";
    $result = $mysqli->query($sql);
    
    if ($result) {
        $row = $result->fetch_assoc();
        return $row['total'];
    }
    
    return 0;
}

// Function to get recent songs (compatible version)
function getRecentSongs($limit = 10) {
    global $mysqli;
    
    // Check if we have created_at column for ordering
    $hasTimestamps = columnExists('songs', 'created_at');
    
    if ($hasTimestamps) {
        $sql = "SELECT * FROM songs ORDER BY created_at DESC LIMIT ?";
    } else {
        // Fallback to ordering by ID if no timestamp column
        $sql = "SELECT * FROM songs ORDER BY id DESC LIMIT ?";
    }
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }
    }
    
    return $songs;
}

// Function to create or update the songs table
function createSongsTable() {
    global $mysqli;
    
    // First check if table exists
    $sql = "SHOW TABLES LIKE 'songs'";
    $result = $mysqli->query($sql);
    
    if ($result->num_rows == 0) {
        // Table doesn't exist, create it with all columns
        $sql = "CREATE TABLE songs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            artist VARCHAR(255) NOT NULL,
            featuring VARCHAR(255) DEFAULT '',
            album VARCHAR(255) NOT NULL,
            duration INT NOT NULL,
            lyrics TEXT,
            cover_image VARCHAR(500) DEFAULT '',
            audio_file VARCHAR(500) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        return $mysqli->query($sql);
    } else {
        // Table exists, check and add missing columns
        $columnsToAdd = array();
        
        if (!columnExists('songs', 'created_at')) {
            $columnsToAdd[] = "ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
        }
        
        if (!columnExists('songs', 'updated_at')) {
            $columnsToAdd[] = "ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
        }
        
        // Add missing columns if any
        if (!empty($columnsToAdd)) {
            $sql = "ALTER TABLE songs " . implode(', ', $columnsToAdd);
            return $mysqli->query($sql);
        }
        
        return true; // Table exists and is up to date
    }
}

// Function to ensure upload directories exist
function ensureUploadDirectories() {
    $directories = ['covers', 'music'];
    
    foreach ($directories as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// Initialize the database and directories
createSongsTable();
ensureUploadDirectories();
?>