import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '../../../lib/tokens';

export async function GET() {
  const gasUrl = process.env.GAS_URL;
  if (!gasUrl) {
    return NextResponse.json({ ok: false, error: 'Missing GAS_URL env' }, { status: 500 });
  }

  try {
    // Fetch from Google Apps Script
    // We add action=getCatalog to distinguish the request type
    const res = await fetch(`${gasUrl}?action=getCatalog`, { 
      next: { revalidate: 60 } // Cache for 60 seconds
    } as any);

    if (!res.ok) {
      throw new Error('Failed to fetch from GAS');
    }

    const data = await res.json();
    
    // Ensure we return the products array. 
    // If GAS returns { products: [...] } we use it, otherwise fall back to MOCK
    if (data && data.products) {
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ products: MOCK_PRODUCTS });
  } catch (error) {
    console.error("Catalog Fetch Error:", error);
    // Fallback to mock data so the app doesn't break if GAS is down/unreachable
    return NextResponse.json({
      products: MOCK_PRODUCTS
    });
  }
}
