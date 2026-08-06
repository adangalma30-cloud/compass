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
};
