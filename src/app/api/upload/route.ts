import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json(
      { error: 'Filename and body are required' }, 
      { status: 400 }
    );
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    
    // Retorna { url: "https://...", downloadUrl: "...", pathname: "..." }
    return NextResponse.json(blob);
  } catch (err) {
    // Tratamento de erro sem 'any':
    // Verificamos se o erro é uma instância da classe Error para acessar .message com segurança
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    
    console.error("Vercel Blob Upload Error:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}