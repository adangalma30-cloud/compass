export type BusinessHours = {
  days: string;
  time: string;
};

export type Business = {
  id: number;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  city: string;
  category: string;
  tags: string[];
  icon: string;
  featured?: boolean;
  // Detail page fields
  aiSummary?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: BusinessHours[];
};
