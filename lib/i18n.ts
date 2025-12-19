export const TH = {
  greeting: "สวัสดี",
  searchPlaceholder: "ค้นหาสินค้า / คุณสมบัติ / แบรนด์...",
  tabQuick: "สั่งไว",
  tabBrowse: "เลือกสินค้า",
  sectionFavorites: "รายการโปรด",
  sectionBundles: "ชุดสั่งเร็ว",
  quickParseLabel: "สั่งด่วน (พิมพ์เอง)",
  quickParsePlaceholder: "เช่น Durex 2, Gel 1",
  quickParseAdd: "เพิ่ม",
  quickParseHint: "พิมพ์ชื่อและจำนวนเพื่อเพิ่มทันที",
  myEssentials: "ซื้อบ่อย",
  edit: "แก้ไข",
  add: "เพิ่ม",
  addBundle: "เพิ่มชุดนี้",
  promo: "ลดพิเศษ",
  cart: "ตะกร้า",
  items: "รายการ",
  total: "รวม",
  shipping: "ค่าส่ง",
  subtotal: "ยอดรวมสินค้า",
  placeOrder: "ยืนยันสั่งซื้อ",
  addedToCart: "เพิ่มลงตะกร้าแล้ว",
  emptyFavorites: "ยังไม่มีรายการโปรด",
  emptyCart: "ตะกร้ายังว่าง",
  emptyBrowse: "ไม่พบสินค้าตามเงื่อนไข",
  remove: "ลบ",
  checkout: "ชำระเงิน",
  experimental: "ทดลองใช้: พิมพ์ชื่อแบรนด์และจำนวน",
  orderSuccessTitle: "สั่งซื้อสำเร็จ",
  orderSuccessMessage: "สรุปรายการสินค้านั้นได้ส่งไปในแชท LINE พร้อมราคาเรียบร้อยแล้วครับ",
  orderSuccessHint: "กดปิดหน้านี้และกลับไปที่ LINE ได้เลยครับ",
  orderSuccessCTA: "ปิดหน้านี้และกลับไปที่ LINE",
  // Filters
  filterAll: "ทั้งหมด",
  filterCondom: "ถุงยาง",
  filterGel: "เจล",
  filterSize: "ขนาด",
  filterSizeAll: "ทุกขนาด",
};

export const formatTHB = (amount: number) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    maximumFractionDigits: 0 
  }).format(amount);
};
