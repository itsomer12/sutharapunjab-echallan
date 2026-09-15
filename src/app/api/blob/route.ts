import { get } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Authenticate the request before serving the Blob
  const token = cookies().get('token')?.value;
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const pathname = request.nextUrl.searchParams.get('pathname');
  if (!pathname) {
    return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
  }

  const result = await get(pathname, {
    access: 'private',
  });

  if (result === null) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Cache-Control': 'private, no-cache',
      'Content-Type': result.blob.contentType ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
