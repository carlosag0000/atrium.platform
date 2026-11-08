<?php
// The careers admin moved into the website dashboard at /admin (API: /api/admin.php).
http_response_code(410);
header('Content-Type: application/json');
echo '{"error":"moved","to":"/admin"}';
