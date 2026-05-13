import api from '../api/axiosConfig';
import type { EventCategory } from '../types/category';

const fallbackCategories: EventCategory[] = [
  { slug: 'general', label_es: 'General', label_en: 'General', icon: 'sparkles', color: '#00f2ff', sort_order: 10 },
  { slug: 'food_drinks', label_es: 'Comida y copas', label_en: 'Food & drinks', icon: 'utensils', color: '#f97316', sort_order: 20 },
  { slug: 'sports', label_es: 'Deporte', label_en: 'Sports', icon: 'dumbbell', color: '#22c55e', sort_order: 30 },
  { slug: 'music', label_es: 'Musica', label_en: 'Music', icon: 'music', color: '#a855f7', sort_order: 40 },
  { slug: 'art_culture', label_es: 'Arte y cultura', label_en: 'Art & culture', icon: 'palette', color: '#ec4899', sort_order: 50 },
  { slug: 'gaming', label_es: 'Gaming', label_en: 'Gaming', icon: 'gamepad-2', color: '#38bdf8', sort_order: 60 },
  { slug: 'outdoors', label_es: 'Aire libre', label_en: 'Outdoors', icon: 'trees', color: '#84cc16', sort_order: 70 },
  { slug: 'nightlife', label_es: 'Noche', label_en: 'Nightlife', icon: 'moon-star', color: '#6366f1', sort_order: 80 },
  { slug: 'learning', label_es: 'Aprendizaje', label_en: 'Learning', icon: 'book-open', color: '#eab308', sort_order: 90 },
  { slug: 'networking', label_es: 'Networking', label_en: 'Networking', icon: 'users-round', color: '#14b8a6', sort_order: 100 },
];

export const categoryService = {
  async getCategories() {
    try {
      const response = await api.get<EventCategory[]>('/posts/categories');
      return response.data.length ? response.data : fallbackCategories;
    } catch {
      return fallbackCategories;
    }
  },
};

export const getCategoryLabel = (category: EventCategory | undefined, language: string) => {
  if (!category) return '';
  return language.startsWith('es') ? category.label_es : category.label_en;
};

export const fallbackEventCategories = fallbackCategories;
