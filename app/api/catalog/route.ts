import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '../../../lib/tokens';

export async function GET() {
  // In a real app, this would fetch from Google Apps Script with cache headers
  // const res = await fetch(process.env.GAS_URL + '?action=getCatalog', { next: { revalidate: 300 } });
  
  // Return mock for now
  return NextResponse.json({
    products: MOCK_PRODUCTS
  });
}