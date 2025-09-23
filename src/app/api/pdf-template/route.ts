
import { NextResponse } from 'next/server';

export async function GET() {
  const pdfUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/templates%2FFebruary2023.pdf?alt=media&token=06231415-0e28-473f-96e0-c18630fc3744';

  try {
    const response = await fetch(pdfUrl, {
      cache: 'no-store', // Ensure we always get the latest version
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF template from storage: ${response.status} ${response.statusText}`);
    }

    const pdfBytes = await response.arrayBuffer();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
