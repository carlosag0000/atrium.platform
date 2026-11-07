<?php
// Copy to config.php ON THE SERVER ONLY (public_html/careers-api/config.php). Never commit config.php.
// admin_password_sha256 = sha256(salt . '|' . password), e.g.:
//   python3 -c "import hashlib;print(hashlib.sha256(b'SALT|PASSWORD').hexdigest())"
// Use a long random password: the admin login also locks out after 8 wrong tries in 15 minutes.
return [
    'db_name' => 'u105453487_careers',
    'db_user' => 'u105453487_careers',
    'db_pass' => 'CHANGE_ME',
    'admin_password_sha256' => 'CHANGE_ME',
    'salt' => 'CHANGE_ME_random_string',
];
