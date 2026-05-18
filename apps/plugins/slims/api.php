<?php
/**
 * Lab Digital API — Standalone Entry Point
 *
 * File ini diakses langsung via HTTP (bukan melalui SLiMS plugin system).
 * Dipanggil oleh platform Digital Lab sebagai REST API.
 *
 * URL: /plugins/lab-digital-api/api.php?action=verify&nis={nis}
 * Auth: Header X-Lab-API-Key
 */

// Bootstrap SLiMS untuk akses DB
define('INDEX_AUTH', 1); // SLiMS requires INDEX_AUTH == 1
$slims_root = '/var/www/html/slims';
if (!file_exists($slims_root . '/sysconfig.inc.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Service unavailable']);
    exit;
}

// Load SLiMS bootstrap — mendefinisikan SB, LIB, dan konstanta lainnya
require_once $slims_root . '/sysconfig.inc.php';

// ── Helpers ───────────────────────────────────────────────────────────────

function lab_api_response(int $code, array $data): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function lab_api_sanitize_nis(string $input): string
{
    return preg_replace('/[^a-zA-Z0-9\-_]/', '', trim($input));
}

// ── Headers ───────────────────────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

$allowed_origin = getenv('LAB_ORIGIN') ?: 'https://lab.smauiiyk.sch.id';
header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-Lab-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    lab_api_response(405, ['error' => 'Method not allowed']);
}

// ── Auth ──────────────────────────────────────────────────────────────────

$api_key   = $_SERVER['HTTP_X_LAB_API_KEY'] ?? '';
$valid_key = getenv('LAB_API_KEY') ?: '';

if (empty($valid_key)) {
    error_log('[lab-digital-api] LAB_API_KEY not configured');
    lab_api_response(503, ['error' => 'Service unavailable']);
}

if (!hash_equals($valid_key, $api_key)) {
    lab_api_response(401, ['error' => 'Unauthorized']);
}

// ── Router ────────────────────────────────────────────────────────────────

$action = lab_api_sanitize_nis($_GET['action'] ?? '');

switch ($action) {

    case 'verify':
        $nis = lab_api_sanitize_nis($_GET['nis'] ?? '');

        if (empty($nis) || strlen($nis) > 20) {
            lab_api_response(400, ['error' => 'Parameter nis tidak valid']);
        }

        try {
            $dbs  = \SLiMS\DB::getInstance('mysqli');
            $stmt = $dbs->prepare("
                SELECT
                    m.member_id,
                    m.member_name,
                    m.member_email,
                    m.gender,
                    m.birth_date,
                    m.member_phone,
                    m.member_address,
                    m.expire_date,
                    m.is_pending,
                    mt.member_type_name
                FROM member m
                LEFT JOIN mst_member_type mt ON m.member_type_id = mt.member_type_id
                WHERE m.member_id = ?
                LIMIT 1
            ");
            $stmt->execute([$nis]);
            $result = $stmt->get_result();
            $member = $result ? $result->fetch_assoc() : null;
        } catch (\Exception $e) {
            error_log('[lab-digital-api] DB error: ' . $e->getMessage());
            lab_api_response(503, ['error' => 'Database error']);
        }

        if (!$member) {
            lab_api_response(404, ['found' => false]);
        }

        $is_expired = false;
        if (!empty($member['expire_date']) && $member['expire_date'] !== '0000-00-00') {
            try {
                $is_expired = new DateTime($member['expire_date']) < new DateTime();
            } catch (\Exception $e) {
                $is_expired = true;
            }
        }

        lab_api_response(200, [
            'found'       => true,
            'nis'         => $member['member_id'],
            'name'        => $member['member_name'],
            'email'       => $member['member_email'] ?? '',
            'gender'      => (string)$member['gender'] === '0' ? 'L' : 'P',
            'birth_date'  => $member['birth_date'],
            'phone'       => $member['member_phone'] ?? '',
            'address'     => $member['member_address'] ?? '',
            'member_type' => $member['member_type_name'] ?? '',
            'expire_date' => $member['expire_date'],
            'is_expired'  => $is_expired,
            'is_pending'  => (bool)($member['is_pending'] ?? false),
        ]);
        break;

    case 'top-visitors':
        $limit = min((int)($_GET['limit'] ?? 30), 100);
        $days  = (int)($_GET['days'] ?? 0); // 0 = all time

        try {
            $dbs = \SLiMS\DB::getInstance('mysqli');
            $where = $days > 0
                ? "WHERE vc.checkin_date >= DATE_SUB(NOW(), INTERVAL ? DAY)"
                : "WHERE vc.member_id IS NOT NULL AND vc.member_id != ''";

            $sql = "
                SELECT
                    vc.member_id,
                    vc.member_name,
                    COUNT(*) AS visit_count,
                    MAX(vc.checkin_date) AS last_visit,
                    mt.member_type_name
                FROM visitor_count vc
                LEFT JOIN member m ON vc.member_id = m.member_id
                LEFT JOIN mst_member_type mt ON m.member_type_id = mt.member_type_id
                $where
                GROUP BY vc.member_id, vc.member_name
                ORDER BY visit_count DESC
                LIMIT ?
            ";

            $stmt = $dbs->prepare($sql);
            if ($days > 0) {
                $stmt->execute([$days, $limit]);
            } else {
                $stmt->execute([$limit]);
            }

            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        } catch (\Exception $e) {
            error_log('[lab-digital-api] DB error: ' . $e->getMessage());
            lab_api_response(503, ['error' => 'Database error']);
        }

        $ranked = [];
        foreach ($rows as $i => $r) {
            $ranked[] = [
                'rank'        => $i + 1,
                'member_id'   => $r['member_id'],
                'name'        => $r['member_name'],
                'member_type' => $r['member_type_name'] ?? '-',
                'visit_count' => (int)$r['visit_count'],
                'last_visit'  => $r['last_visit'],
            ];
        }

        lab_api_response(200, [
            'total'    => count($ranked),
            'days'     => $days ?: 'all',
            'visitors' => $ranked,
        ]);
        break;

    default:
        lab_api_response(400, ['error' => 'Action tidak dikenal. Tersedia: verify, top-visitors']);
}
