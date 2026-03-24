export const dynamic = 
'force-static'
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Image URL is required', { status: 400 });
  }

  try {
    // Use a temporary proxy for development if needed, or fetch directly.
    const fetchUrl = imageUrl;
    
    const response = await fetch(fetchUrl, {
      cache: 'force-cache', // Cache the logo since it won't change
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`, await response.text());
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const imageBytes = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';

    return new NextResponse(imageBytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching image via proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
