import type { Business } from "../types/business";

const businesses: Business[] = [
  {
    id: 1,
    name: "Third Eye Bookshop",
    rating: 4.9,
    reviews: 67,
    city: "Portland, OR",
    category: "Retail",
    tags: ["books", "philosophy"],
  },
  {
    id: 2,
    name: "Joe's Coffee",
    rating: 4.8,
    reviews: 123,
    city: "Seattle, WA",
    category: "Café",
    tags: ["coffee", "pastries"],
  },
  {
    id: 3,
    name: "Tech World",
    rating: 4.6,
    reviews: 42,
    city: "San Francisco, CA",
    category: "Retail",
    tags: ["electronics", "gadgets"],
  },
  {
    id: 4,
    name: "The Golden Fork",
    rating: 4.7,
    reviews: 198,
    city: "Austin, TX",
    category: "Restaurant",
    tags: ["american", "burgers", "lunch"],
  },
  {
    id: 5,
    name: "Moonrise Bar",
    rating: 4.5,
    reviews: 84,
    city: "Nashville, TN",
    category: "Bar",
    tags: ["cocktails", "live music"],
  },
  {
    id: 6,
    name: "Bloom & Co",
    rating: 4.8,
    reviews: 55,
    city: "Portland, OR",
    category: "Retail",
    tags: ["flowers", "gifts"],
  },
];

export default businesses;
