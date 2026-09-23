export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  etaMin: number;
  priceForTwo: number;
  rating: number;
  tags: string[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: "paradise",
    name: "Paradise Biryani",
    cuisine: "Hyderabadi · Biryani",
    etaMin: 32,
    priceForTwo: 450,
    rating: 4.4,
    tags: ["biryani", "hyderabadi", "paradise", "paradise biryani"],
  },
  {
    id: "north-kitchen",
    name: "North Kitchen",
    cuisine: "North Indian",
    etaMin: 28,
    priceForTwo: 380,
    rating: 4.2,
    tags: ["north indian", "north", "thali", "curry"],
  },
  {
    id: "roll-street",
    name: "Roll Street",
    cuisine: "Rolls · Quick bites",
    etaMin: 22,
    priceForTwo: 280,
    rating: 4.1,
    tags: ["rolls", "roll", "kathi", "wrap"],
  },
  {
    id: "slice-factory",
    name: "Slice Factory",
    cuisine: "Pizza · Italian",
    etaMin: 30,
    priceForTwo: 520,
    rating: 4.0,
    tags: ["pizza", "pasta", "italian"],
  },
  {
    id: "brew-cafe",
    name: "Brew & Bite Cafe",
    cuisine: "Cafe · Beverages",
    etaMin: 25,
    priceForTwo: 350,
    rating: 4.3,
    tags: ["cafe", "coffee", "breakfast"],
  },
];

export const QUICK_CHIPS = [
  { label: "Biryani", term: "biryani" },
  { label: "North Indian", term: "north indian" },
  { label: "Rolls", term: "rolls" },
  { label: "Sushi", term: "sushi" },
  { label: "Pizza", term: "pizza" },
  { label: "Cafe", term: "cafe" },
] as const;

export const MENU_ITEMS = [
  { id: "item1", name: "Chicken Dum Biryani", price: 249 },
  { id: "item2", name: "Double Ka Meetha", price: 89 },
] as const;

export function searchRestaurants(query: string): Restaurant[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return RESTAURANTS.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q) || q.includes(t)),
  );
}
