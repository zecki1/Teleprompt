import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
];

export async function OPTIONS(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin') || 'https://teleprompt.vercel.app';
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Admin SDK not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsResponse(
      { error: 'Unauthorized' },
      401,
      request.headers.get('origin')
    );
  }

  try {
    const token = authHeader.slice(7);
    await adminAuth.verifyIdToken(token);
  } catch {
    return corsResponse(
      { error: 'Invalid token' },
      401,
      request.headers.get('origin')
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return corsResponse(
      { error: 'Filename and body are required' },
      400,
      request.headers.get('origin')
    );
  }

  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  if (!ALLOWED_TYPES.includes(contentType)) {
    return corsResponse(
      { error: `File type not allowed: ${contentType}` },
      400,
      request.headers.get('origin')
    );
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    return corsResponse(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      400,
      request.headers.get('origin')
    );
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
      contentType,
    });

    return corsResponse(blob, 200, request.headers.get('origin'));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';

    console.error("Vercel Blob Upload Error:", errorMessage);

    return corsResponse(
      { error: errorMessage },
      500,
      request.headers.get('origin')
    );
  }
}

function corsResponse(body: unknown, status: number, origin: string | null) {
  const response = NextResponse.json(body, { status });
  const allowedOrigin = origin || 'https://teleprompt.vercel.app';
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return response;
}
