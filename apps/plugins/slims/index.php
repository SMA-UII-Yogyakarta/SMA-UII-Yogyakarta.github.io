<?php
/**
 * Lab Digital API
 *
 * Plugin SLiMS untuk platform Digital Lab SMA UII Yogyakarta.
 * Menyediakan REST endpoint untuk verifikasi data anggota perpustakaan.
 *
 * Endpoint : GET /plugins/lab-digital-api/?action=verify&nis={nis}
 * Auth     : Header X-Lab-API-Key
 *
 * Kompatibel dengan SLiMS 9.x (Bulian)
 *
 * CATATAN SKEMA:
 *   - member_id  = NIS (Nomor Induk Siswa), bukan NISN
 *   - Tidak ada field NISN di database SLiMS ini
 *   - inst_name  = nama institusi/kelas
 *   - expire_date = tanggal kadaluarsa keanggotaan
 */

defined('INDEX_AUTH') or die('Direct access not allowed!');

// ── Helpers ───────────────────────────────────────────────────────────────

function lab_api_response(int $code, array $data): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function lab_api_sanitize_string(string $input): string
{
    // Hapus karakter non-alphanumeric kecuali strip dan underscore
    return preg_replace('/[^a-zA-Z0-9\-_]/', '', trim($input));
}

// ── Headers ───────────────────────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// CORS — hanya izinkan origin platform lab
$allowed_origin = getenv('LAB_ORIGIN') ?: 'https://lab.smauiiyk.sch.id';
header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-Lab-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Hanya izinkan GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    lab_api_response(405, ['error' => 'Method not allowed']);
}

// ── Autentikasi ───────────────────────────────────────────────────────────

$api_key   = $_SERVER['HTTP_X_LAB_API_KEY'] ?? '';
$valid_key = getenv('LAB_API_KEY') ?: '';

if (empty($valid_key)) {
    // Konfigurasi belum selesai — jangan expose detail error
    error_log('[lab-digital-api] LAB_API_KEY environment variable not set');
    lab_api_response(503, ['error' => 'Service unavailable']);
}

// Gunakan hash_equals untuk mencegah timing attack
if (!hash_equals($valid_key, $api_key)) {
    lab_api_response(401, ['error' => 'Unauthorized']);
}

// ── Rate limiting sederhana via session (opsional, jika session tersedia) ─
// SLiMS sudah handle session, tapi plugin ini dipanggil tanpa session user
// Rate limiting sebaiknya dilakukan di nginx-proxy level

// ── Router ────────────────────────────────────────────────────────────────

$action = lab_api_sanitize_string($_GET['action'] ?? '');

switch ($action) {

    case 'verify':
        $nis = lab_api_sanitize_string($_GET['nis'] ?? '');

        if (empty($nis)) {
            lab_api_response(400, ['error' => 'Parameter nis diperlukan']);
        }

        // Batasi panjang untuk mencegah abuse
        if (strlen($nis) > 20) {
            lab_api_response(400, ['error' => 'Parameter nis tidak valid']);
        }

        try {
            /** @var \SLiMS\DB $dbs */
            $dbs = \SLiMS\DB::getInstance('mysqli');

            // Parameterized query — tidak ada risiko SQL injection
            $stmt = $dbs->prepare("
                SELECT
                    m.member_id,
                    m.member_name,
                    m.member_email,
                    m.inst_name,
                    m.expire_date,
                    m.is_pending,
                    mt.member_type_name
                FROM member m
                LEFT JOIN mst_member_type mt ON m.member_type_id = mt.member_type_id
                WHERE m.member_id = :nis
                LIMIT 1
            ");
            $stmt->execute([':nis' => $nis]);
            $member = $stmt->fetch(\PDO::FETCH_ASSOC);

        } catch (\Exception $e) {
            error_log('[lab-digital-api] DB error: ' . $e->getMessage());
            lab_api_response(503, ['error' => 'Database error']);
        }

        if (!$member) {
            lab_api_response(404, ['found' => false]);
        }

        // Hitung status kadaluarsa
        $is_expired = false;
        if (!empty($member['expire_date']) && $member['expire_date'] !== '0000-00-00') {
            try {
                $expire = new DateTime($member['expire_date']);
                $is_expired = $expire < new DateTime();
            } catch (\Exception $e) {
                $is_expired = true;
            }
        }

        // Kembalikan hanya field yang dibutuhkan — jangan expose data sensitif
        lab_api_response(200, [
            'found'       => true,
            'nis'         => $member['member_id'],
            'name'        => $member['member_name'],
            'email'       => $member['member_email'] ?? '',
            'class'       => $member['inst_name'] ?? '',
            'member_type' => $member['member_type_name'] ?? '',
            'expire_date' => $member['expire_date'],
            'is_expired'  => $is_expired,
            'is_pending'  => (bool)($member['is_pending'] ?? false),
        ]);
        break;

    default:
        lab_api_response(400, ['error' => 'Action tidak dikenal. Tersedia: verify']);
}
