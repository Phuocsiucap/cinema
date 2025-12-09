import api from './api';

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  banner_url?: string;
  is_active: boolean;
  applicable_to?: 'ALL' | 'MOVIES' | 'COMBOS' | 'TICKETS';
  applicable_items?: string[];
  min_tickets?: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionCreate {
  title: string;
  description?: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  start_date?: string;
  end_date?: string;
  banner_url?: string;
  is_active?: boolean;
  applicable_to?: 'ALL' | 'MOVIES' | 'COMBOS' | 'TICKETS';
  applicable_items?: string[];
  min_tickets?: number;
}

export interface PromotionUpdate {
  title?: string;
  description?: string;
  code?: string;
  discount_type?: 'PERCENTAGE' | 'FIXED';
  discount_value?: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  start_date?: string;
  end_date?: string;
  banner_url?: string;
  is_active?: boolean;
  applicable_to?: 'ALL' | 'MOVIES' | 'COMBOS' | 'TICKETS';
  applicable_items?: string[];
  min_tickets?: number;
}

export interface PromotionListResponse {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ValidatePromotionResponse {
  valid: boolean;
  promotion: {
    id: string;
    title: string;
    code: string;
    discount_type: string;
    discount_value: number;
  };
  discount_amount: number;
  final_amount: number;
}

class PromotionService {
  // Admin: Get all promotions with pagination
  async getPromotions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PromotionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    return api.get<PromotionListResponse>(`/promotions?${queryParams}`);
  }

  // Admin: Get promotion by ID
  async getPromotion(id: string): Promise<Promotion> {
    return api.get<Promotion>(`/promotions/${id}`);
  }

  // Admin: Create promotion
  async createPromotion(data: PromotionCreate): Promise<Promotion> {
    return api.post<Promotion>('/promotions', data);
  }

  // Admin: Update promotion
  async updatePromotion(id: string, data: PromotionUpdate): Promise<Promotion> {
    return api.put<Promotion>(`/promotions/${id}`, data);
  }

  // Admin: Delete promotion
  async deletePromotion(id: string): Promise<{ message: string; id: string }> {
    return api.delete<{ message: string; id: string }>(`/promotions/${id}`);
  }

  // Public: Get active promotions
  async getActivePromotions(): Promise<Promotion[]> {
    return api.get<Promotion[]>('/promotions/active');
  }

  // Public: Validate promotion code
  async validatePromotionCode(code: string, totalAmount: number): Promise<ValidatePromotionResponse> {
    return api.post<ValidatePromotionResponse>('/promotions/validate', {
      code,
      total_amount: totalAmount,
    });
  }
}

export const promotionService = new PromotionService();
export default promotionService;
