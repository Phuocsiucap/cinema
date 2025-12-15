import api from './api';
import type { Actor } from '../types/movie';

const ACTOR_API = '/actors';

export const actorService = {
  // Search actors by name
  searchActors: async (name: string, limit: number = 10): Promise<Actor[]> => {
    return api.get<Actor[]>(`${ACTOR_API}/search?name=${encodeURIComponent(name)}&limit=${limit}`);
  },

  // Get list of all actors
  getActors: async (skip: number = 0, limit: number = 50): Promise<Actor[]> => {
    return api.get<Actor[]>(`${ACTOR_API}/?skip=${skip}&limit=${limit}`);
  },

  // Get actor info by ID
  getActor: async (id: string): Promise<Actor> => {
    return api.get<Actor>(`${ACTOR_API}/${id}`);
  },
};

export default actorService;
