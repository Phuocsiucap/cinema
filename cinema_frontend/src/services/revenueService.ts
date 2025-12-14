import api from './api';

export interface CinemaEntityInfo {
  city: string;
  total_rooms: number;
}

export interface RoomEntityInfo {
  cinema_name: string;
  seat_capacity: number;
  screen_type?: string | null;
}

export interface MovieEntityInfo {
  genre: string;
  rating?: string | null;
  director?: string | null;
}

export type EntityInfo = CinemaEntityInfo | RoomEntityInfo | MovieEntityInfo;

export interface ComparisonItem {
  entity_id: string;
  entity_name: string;
  entity_info: EntityInfo;
  revenue: number;
  tickets_sold: number;
  avg_ticket_price: number;
  occupancy_rate: number;
  shows_count: number;
  percentage: number;
}

export interface RevenueData {
  comparison_type: 'cinema' | 'room' | 'movie';
  period_type: string;
  start_date: string;
  end_date: string;
  total_entities: number;
  data: ComparisonItem[];
}

export interface RevenueDetailItem {
  date: string; // ISO date string
  revenue: number;
  tickets_sold: number;
}

export interface RevenueDetailResponse {
  entity_id: string;
  entity_name: string;
  period_type: string;
  total_revenue: number;
  total_tickets: number;
  data: RevenueDetailItem[];
}

export interface RevenueParams {
  periodType: 'day' | 'month' | 'year';
  startDate: string;
  endDate: string;
  filterType: 'cinema' | 'room' | 'movie';
  limit?: number;
  sortBy?: 'revenue' | 'tickets' | 'occupancy';
}

export const revenueService = {
  async getRevenueData(params: RevenueParams): Promise<RevenueData> {
    try {
      const queryParams = new URLSearchParams({
        period_type: params.periodType,
        start_date: params.startDate,
        end_date: params.endDate,
        comparison_type: params.filterType,
        limit: (params.limit || 10).toString(),
        sort_by: params.sortBy || 'revenue'
      });
      
      const data = await api.get<RevenueData>(`/revenue/?${queryParams}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      throw error;
    }
  }
  ,
  async getRevenueDetail(entityType: 'cinema' | 'room' | 'movie', entityId: string, startDate: string, endDate: string): Promise<RevenueDetailResponse> {
    try {
      const queryParams = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const data = await api.get<RevenueDetailResponse>(`/revenue/detail/${entityType}/${entityId}?${queryParams}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch revenue detail:', error);
      throw error;
    }
  }
};
