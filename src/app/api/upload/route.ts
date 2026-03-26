import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Filename and body are required' }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    
    // returns { url: "https://...", downloadUrl: "...", pathname: "..." }
    return NextResponse.json(blob);
  } catch (err: any) {
    console.error("Vercel Blob Upload Error:", err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
