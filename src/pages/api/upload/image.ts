import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);
  if (user.status !== 'active') return createErrorResponse('Forbidden', 403);

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return createErrorResponse('File gambar diperlukan', 400, { code: 'MISSING_FILE' });
    }

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return createErrorResponse(
        'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.',
        422,
        { code: 'INVALID_FILE_TYPE' }
      );
    }

    // Validasi ukuran file
    if (file.size > MAX_SIZE_BYTES) {
      return createErrorResponse(
        'Ukuran file terlalu besar. Maksimal 2MB.',
        422,
        { code: 'FILE_TOO_LARGE' }
      );
    }

    // Konversi ke base64 data URL — disimpan langsung ke DB
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return createSuccessResponse({ url: dataUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    return createErrorResponse('Gagal mengupload gambar', 500);
  }
};
