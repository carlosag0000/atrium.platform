<?php
// Copy to config.php ON THE SERVER ONLY (public_html/api/config.php). Never commit config.php.
// owner_email + admin_password_sha256 (= sha256(salt . '|' . password)) create the first dashboard
// account on its first login; after that, passwords are stored per user with password_hash().
return [
    'db_name' => 'u105453487_careers',
    'db_user' => 'u105453487_careers',
    'db_pass' => 'CHANGE_ME',
    'salt' => 'CHANGE_ME_random_string',
    'owner_email' => 'you@example.com',
    'admin_password_sha256' => 'CHANGE_ME',
];
