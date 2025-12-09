import api from './api';
import type { Actor } from '../types/movie';

const ACTOR_API = '/actors';

export const actorService = {
  // Tìm kiếm actor theo tên
  searchActors: async (name: string, limit: number = 10): Promise<Actor[]> => {
    return api.get<Actor[]>(`${ACTOR_API}/search?name=${encodeURIComponent(name)}&limit=${limit}`);
  },

  // Lấy danh sách tất cả actors
  getActors: async (skip: number = 0, limit: number = 50): Promise<Actor[]> => {
    return api.get<Actor[]>(`${ACTOR_API}/?skip=${skip}&limit=${limit}`);
  },

  // Lấy thông tin actor theo ID
  getActor: async (id: string): Promise<Actor> => {
    return api.get<Actor>(`${ACTOR_API}/${id}`);
  },
};

export default actorService;
