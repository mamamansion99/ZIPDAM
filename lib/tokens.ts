import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SHIPPING_FEE = 20;

export const DEMO_USER = {
  userId: 'U1234567890abcdef',
  displayName: 'ลูกค้า ZIPDAM',
  pictureUrl: 'https://picsum.photos/100/100'
};

// Mock Data with Thai features
export const MOCK_PRODUCTS = [
  {
    id: 'p1',
    brand: 'Okamoto',
    name: '003 Platinum',
    size: '52mm',
    packSize: 2,
    price: 85,
    promoPrice: 79,
    imageKey: 'okamoto-003',
    type: 'Condom',
    features: ['บาง', 'ผิวเรียบ']
  },
  {
    id: 'p2',
    brand: 'Onetouch',
    name: 'Strawberry',
    size: '52mm',
    packSize: 3,
    price: 55,
    imageKey: 'onetouch-straw',
    type: 'Condom',
    features: ['กลิ่นสตรอเบอร์รี่', 'ผิวไม่เรียบ']
  },
  {
    id: 'p3',
    brand: 'Durex',
    name: 'Kingtex',
    size: '49mm',
    packSize: 3,
    price: 60,
    imageKey: 'durex-king',
    type: 'Condom',
    features: ['กระชับ', 'คลาสสิค']
  },
  {
    id: 'p4',
    brand: 'Onetouch',
    name: 'Natural Gel',
    size: '75ml',
    packSize: 1,
    price: 120,
    promoPrice: 99,
    imageKey: 'onetouch-gel',
    type: 'Gel',
    features: ['สูตรน้ำ']
  },
  {
    id: 'p5',
    brand: 'Okamoto',
    name: 'XL',
    size: '54mm',
    packSize: 2,
    price: 95,
    imageKey: 'okamoto-xl',
    type: 'Condom',
    features: ['ไซส์ใหญ่', 'สวมใส่สบาย']
  },
   {
    id: 'p6',
    brand: 'Durex',
    name: 'Chocolate',
    size: '52.5mm',
    packSize: 3,
    price: 75,
    imageKey: 'durex-choc',
    type: 'Condom',
    features: ['กลิ่นช็อกโกแลต', 'ผิวไม่เรียบ']
  }
] as const;
