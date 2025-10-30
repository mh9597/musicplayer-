<?php
// upload.php - Handle song uploads with enhanced features

// Include database functions
require_once 'database.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process form data
    $title = trim($_POST['title']);
    $artist = trim($_POST['artist']);
    $featuring = trim($_POST['featuring']);
    $album = trim($_POST['album']);
    $duration = (int)$_POST['duration']; // Duration is already converted from MM:SS to seconds
    $lyrics = trim($_POST['lyrics']);
    
    // Validation
    if (empty($title) || empty($artist) || empty($album) || empty($lyrics) || $duration <= 0) {
        $error = "Please fill all required fields with valid data.";
    }
    
    // File upload handling
    $coverImagePath = '';
    $audioFilePath = '';
    
    // Check if audio file is uploaded
    if (!isset($_FILES['audio_file']) || $_FILES['audio_file']['error'] !== UPLOAD_ERR_OK) {
        $error = "Please upload an audio file.";
    }
    
    if (empty($error)) {
        // Ensure upload directories exist
        ensureUploadDirectories();
        
        // Upload cover image
        if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
            $coverTmpName = $_FILES['cover_image']['tmp_name'];
            $coverExtension = strtolower(pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION));
            
            // Validate image file
            $allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($coverExtension, $allowedImageTypes)) {
                $coverName = 'cover_' . time() . '_' . uniqid() . '.' . $coverExtension;
                $coverDestination = 'covers/' . $coverName;
                
                if (move_uploaded_file($coverTmpName, $coverDestination)) {
                    $coverImagePath = $coverDestination;
                } else {
                    $error = "Failed to upload cover image.";
                }
            } else {
                $error = "Invalid image format. Please use JPG, PNG, GIF, or WebP.";
            }
        } else {
            // Use a default placeholder image if no cover is uploaded
            $coverImagePath = "https://placehold.co/500x500/3d3d62/ffffff?text=" . urlencode($title);
        }
        
        // Upload audio file
        if (empty($error) && isset($_FILES['audio_file']) && $_FILES['audio_file']['error'] === UPLOAD_ERR_OK) {
            $audioTmpName = $_FILES['audio_file']['tmp_name'];
            $audioExtension = strtolower(pathinfo($_FILES['audio_file']['name'], PATHINFO_EXTENSION));
            
            // Validate audio file
            $allowedAudioTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
            if (in_array($audioExtension, $allowedAudioTypes)) {
                $audioName = 'audio_' . time() . '_' . uniqid() . '.' . $audioExtension;
                $audioDestination = 'music/' . $audioName;
                
                if (move_uploaded_file($audioTmpName, $audioDestination)) {
                    $audioFilePath = $audioDestination;
                } else {
                    $error = "Failed to upload audio file.";
                }
            } else {
                $error = "Invalid audio format. Please use MP3, WAV, OGG, M4A, or AAC.";
            }
        }
        
        // Add to database
        if (empty($error) && !empty($title) && !empty($artist) && !empty($audioFilePath)) {
            $songId = addSong($title, $artist, $featuring, $album, $duration, $lyrics, $coverImagePath, $audioFilePath);
            
            if ($songId) {
                $success = "Song uploaded successfully!";
                // Redirect to main page with success message
                header("Location: index.php?message=" . urlencode($success));
                exit();
            } else {
                $error = "Error uploading song to database.";
                
                // Clean up uploaded files if database insertion failed
                if (!empty($coverImagePath) && file_exists($coverImagePath)) {
                    unlink($coverImagePath);
                }
                if (!empty($audioFilePath) && file_exists($audioFilePath)) {
                    unlink($audioFilePath);
                }
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Song - Harmony Player</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .upload-container {
            background: rgba(20, 20, 35, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
            width: 100%;
            max-width: 600px;
        }
        
        .upload-container h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #e94560;
            font-size: 28px;
        }
        
        .error, .success {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            animation: fadeIn 0.5s ease;
        }
        
        .error {
            background: rgba(255, 68, 68, 0.2);
            border-left: 4px solid #ff4444;
            color: #ffcccc;
        }
        
        .success {
            background: rgba(76, 175, 80, 0.2);
            border-left: 4px solid #4caf50;
            color: #ccffcc;
        }
        
        .upload-form {
            display: grid;
            gap: 20px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            margin-bottom: 8px;
            font-weight: 500;
            color: #f1f1f1;
        }
        
        .form-group input,
        .form-group textarea {
            padding: 12px 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            font-size: 16px;
            transition: border-color 0.3s, background-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #e94560;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .form-group textarea {
            height: 100px;
            resize: vertical;
        }
        
        .form-group input[type="file"] {
            padding: 8px;
            cursor: pointer;
        }
        
        .submit-btn {
            background: linear-gradient(135deg, #e94560, #8a2be2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s;
            margin-top: 20px;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(233, 69, 96, 0.4);
        }
        
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        
        .back-link a {
            color: #e94560;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .back-link a:hover {
            color: #ff577f;
        }
        
        .duration-help {
            font-size: 12px;
            color: #a9a9a9;
            margin-top: 5px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
            .upload-container {
                padding: 20px;
            }
            
            .upload-container h2 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="upload-container">
        <h2><i class="fas fa-upload"></i> Upload New Song</h2>
        
        <?php if (!empty($error)): ?>
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($success)): ?>
            <div class="success">
                <i class="fas fa-check-circle"></i>
                <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>
        
        <form action="upload.php" method="post" enctype="multipart/form-data" class="upload-form" id="uploadForm">
            <div class="form-group">
                <label for="title">
                    <i class="fas fa-music"></i> Song Title *
                </label>
                <input type="text" id="title" name="title" required 
                       value="<?php echo isset($_POST['title']) ? htmlspecialchars($_POST['title']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="artist">
                    <i class="fas fa-user"></i> Artist *
                </label>
                <input type="text" id="artist" name="artist" required 
                       value="<?php echo isset($_POST['artist']) ? htmlspecialchars($_POST['artist']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="featuring">
                    <i class="fas fa-users"></i> Featuring (optional)
                </label>
                <input type="text" id="featuring" name="featuring" 
                       placeholder="Feat. Artist1, Artist2"
                       value="<?php echo isset($_POST['featuring']) ? htmlspecialchars($_POST['featuring']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="album">
                    <i class="fas fa-compact-disc"></i> Album *
                </label>
                <input type="text" id="album" name="album" required 
                       value="<?php echo isset($_POST['album']) ? htmlspecialchars($_POST['album']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="durationInput">
                    <i class="fas fa-clock"></i> Duration *
                </label>
                <input type="text" id="durationInput" placeholder="03:45" 
                       pattern="[0-9]{1,2}:[0-5][0-9]" 
                       title="Please enter time in MM:SS format" required>
                <input type="hidden" id="duration" name="duration">
                <div class="duration-help">Enter in MM:SS format (e.g., 03:45 for 3 minutes 45 seconds)</div>
            </div>
            
            <div class="form-group">
                <label for="lyrics">
                    <i class="fas fa-quote-right"></i> Lyrics Excerpt *
                </label>
                <textarea id="lyrics" name="lyrics" required 
                          placeholder="Enter a memorable line or verse from the song..."><?php echo isset($_POST['lyrics']) ? htmlspecialchars($_POST['lyrics']) : ''; ?></textarea>
            </div>
            
            <div class="form-group">
                <label for="cover_image">
                    <i class="fas fa-image"></i> Cover Image
                </label>
                <input type="file" id="cover_image" name="cover_image" accept="image/*">
                <div class="duration-help">Supported formats: JPG, PNG, GIF, WebP (Optional - a placeholder will be used if not provided)</div>
            </div>
            
            <div class="form-group">
                <label for="audio_file">
                    <i class="fas fa-file-audio"></i> Audio File *
                </label>
                <input type="file" id="audio_file" name="audio_file" accept="audio/*" required>
                <div class="duration-help">Supported formats: MP3, WAV, OGG, M4A, AAC</div>
            </div>
            
            <button type="submit" class="submit-btn">
                <i class="fas fa-upload"></i> Upload Song
            </button>
        </form>
        
        <div class="back-link">
            <a href="index.php">
                <i class="fas fa-arrow-left"></i> Back to Music Player
            </a>
        </div>
    </div>
    
    <script>
        // Duration input conversion (MM:SS to seconds)
        document.getElementById('durationInput').addEventListener('input', function() {
            const timeValue = this.value;
            const timePattern = /^(\d{1,2}):([0-5]\d)$/;
            const hiddenDuration = document.getElementById('duration');
            
            if (timePattern.test(timeValue)) {
                const [, minutes, seconds] = timeValue.match(timePattern);
                const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
                hiddenDuration.value = totalSeconds;
                this.style.borderColor = '#4caf50';
            } else {
                hiddenDuration.value = '';
                this.style.borderColor = timeValue ? '#ff4444' : 'rgba(255, 255, 255, 0.1)';
            }
        });
        
        // Form validation
        document.getElementById('uploadForm').addEventListener('submit', function(e) {
            const hiddenDuration = document.getElementById('duration');
            const audioFile = document.getElementById('audio_file');
            
            if (!hiddenDuration.value) {
                e.preventDefault();
                alert('Please enter a valid duration in MM:SS format (e.g., 03:45)');
                document.getElementById('durationInput').focus();
                return false;
            }
            
            if (!audioFile.files.length) {
                e.preventDefault();
                alert('Please select an audio file');
                audioFile.focus();
                return false;
            }
            
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            submitBtn.disabled = true;
        });
        
        // File size validation
        document.getElementById('audio_file').addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const maxSize = 50 * 1024 * 1024; // 50MB
                if (file.size > maxSize) {
                    alert('Audio file is too large. Please select a file smaller than 50MB.');
                    this.value = '';
                }
            }
        });
        
        document.getElementById('cover_image').addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    alert('Image file is too large. Please select a file smaller than 5MB.');
                    this.value = '';
                }
            }
        });
    </script>
</body>
</html>