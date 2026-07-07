/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  title: string;
  tagline: string;
  price: number;
  originalPrice: number;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  images: string[];
  stock: number;
  rating: number;
  category: string;
  deliveryInfo: string;
  warranty: string;
  colors?: string[];
  sizes?: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  adminReply?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  totalAmount: number;
  promoCode?: string;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  orderDate: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  transactionId?: string; // for bKash/Nagad
  selectedColor?: string;
  selectedSize?: string;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  currency: 'BDT' | 'USD';
  shippingFee: number;
  bkashNumber?: string;
  nagadNumber?: string;
  supportEmail: string;
  adminPasscode: string;
}

export interface AppData {
  product: Product;
  reviews: Review[];
  orders: Order[];
  promoCodes: PromoCode[];
  settings: StoreSettings;
}
