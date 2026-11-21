export type UserRole = 'BUYER' | 'SUPPLIER';

export type RFQStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'FORCE_CLOSED';

export type ExtensionTriggerType = 'BID_RECEIVED' | 'ANY_RANK_CHANGE' | 'L1_RANK_CHANGE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  supplier_id?: number | null;
  company_name?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  supplier_id?: number | null;
  company_name?: string | null;
}

export interface AuctionConfig {
  id: number;
  rfq_id: number;
  british_auction_enabled: boolean;
  trigger_window_minutes: number;
  extension_duration_minutes: number;
  extension_trigger_type: ExtensionTriggerType;
}

export interface RFQ {
  id: number;
  reference_id: string;
  name: string;
  buyer_id: number;
  buyer_name?: string | null;
  bid_start_time: string;
  original_close_time: string;
  current_close_time: string;
  forced_close_time: string;
  pickup_service_date: string;
  status: RFQStatus;
  created_at: string;
  current_lowest_bid?: number | null;
  lowest_bidder_name?: string | null;
  total_bids_count: number;
  total_suppliers_count: number;
  is_extended: boolean;
  auction_config?: AuctionConfig | null;
}

export interface Quotation {
  id: number;
  rfq_id: number;
  supplier_id: number;
  supplier_company_name?: string | null;
  carrier_name: string;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  total_amount: number;
  transit_time: string;
  quote_validity: string;
  submitted_at: string;
  is_latest: boolean;
  rank?: string | null;
}

export interface SupplierRankItem {
  supplier_id: number;
  company_name: string;
  rank: string;
  total_amount: number;
  carrier_name: string;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  transit_time: string;
  quote_validity: string;
  submitted_at: string;
  is_current_user: boolean;
}

export interface RFQRankings {
  rfq_id: number;
  total_suppliers: number;
  current_lowest_bid?: number | null;
  l1_supplier_id?: number | null;
  l1_company_name?: string | null;
  rankings: SupplierRankItem[];
}

export interface ActivityLog {
  id: number;
  rfq_id: number;
  supplier_id?: number | null;
  supplier_company_name?: string | null;
  event_type: string;
  event_description: string;
  previous_close_time?: string | null;
  updated_close_time?: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_auctions: number;
  active_auctions: number;
  completed_auctions: number;
  force_closed_auctions: number;
  total_submitted_bids: number;
  total_suppliers_participating: number;
  recent_rfqs: RFQ[];
  recent_activity: ActivityLog[];
  activity_chart_data: {
    date: string;
    bids_count: number;
    extensions_count: number;
  }[];
}
