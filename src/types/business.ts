export type BusinessHours = {
  days: string;
  time: string;
};

export type Business = {
  id: string | number;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  city: string;
  category: string;
  tags: string[];
  icon: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  gallery?: string[];
  source?: "preview" | "google_places" | "openstreetmap";
  externalId?: string;
  featured?: boolean;
  // Detail page fields
  aiSummary?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: BusinessHours[];
};
