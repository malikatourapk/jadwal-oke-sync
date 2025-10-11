export type PPOBServiceType = 
  | 'pulsa'
  | 'paket-data'
  | 'pln-token'
  | 'pln-postpaid'
  | 'pdam'
  | 'bpjs'
  | 'telkom'
  | 'tv-cable'
  | 'game-voucher'
  | 'e-wallet';

export interface PPOBService {
  id: string;
  type: PPOBServiceType;
  name: string;
  icon: string;
  description: string;
}

export interface PPOBProduct {
  id: string;
  serviceType: PPOBServiceType;
  productName: string;
  price: number;
  adminFee: number;
  profit?: number;
  provider?: string;
}

export interface PPOBTransaction {
  id: string;
  serviceType: PPOBServiceType;
  productName: string;
  customerNumber: string;
  amount: number;
  adminFee: number;
  total: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  refNumber?: string;
}
