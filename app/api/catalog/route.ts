import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '../../../lib/tokens';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO5Tss2wroIryFIpJ8SBmvuLCX2-DfIc8kn3PXznMqS4zDptE_cXXf80KR6UI0Y5Bk/exec';

export async function GET() {
  try {
    // Fetch from Google Apps Script
    // We add action=getCatalog to distinguish the request type
    const res = await fetch(`${GAS_URL}?action=getCatalog`, { 
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