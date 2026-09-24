export type Restaurant = {
  n: string; c: string; e: string; g: string; r: number; rv: string;
  t: number; d: string; o: string; badge: string; k: "local" | "chain"; cu: string;
};
export type MenuItem = { n: string; p: number; was: number; v: number; e: string; best: number; d: string };
export type CartItem = { n: string; p: number; was: number; q: number; e: string; best: number };
export type QOpt = { v: string; e: string; l: string };
export type QDef = { kick: string; title: string; hint: string; opts: QOpt[] };

export const ARMS = ["discount", "restaurants"] as const;
export type Arm = (typeof ARMS)[number];

export const ARM = {
  discount: {
    offersTitle: "Offers for you",
    offers: [
      { id: "d_flat100", kick: "First order", big: "₹100 OFF", e: "🎉" },
      { id: "d_60pc", kick: "Today only", big: "60% OFF", e: "🔥" },
      { id: "d_free", kick: "Every order", big: "₹0 DELIVERY", e: "🛵" },
      { id: "d_bogo", kick: "Weekend", big: "BUY 1 GET 1", e: "🍿" },
    ],
  },
  restaurants: {
    offersTitle: "New in Gachibowli",
    offers: [
      { id: "r_regulars", kick: "Your regulars", big: "NOW HERE", e: "📍" },
      { id: "r_biryani", kick: "Hyderabad", big: "BIRYANI ST.", e: "🍛" },
      { id: "r_tiffin", kick: "From 7 am", big: "TIFFIN OPEN", e: "🥞" },
      { id: "r_late", kick: "Late night", big: "OPEN TILL 2", e: "🌙" },
    ],
  },
};

export const RL_PRICES = [15, 25, 35, 49];
export const WALLET_AMOUNTS = [120, 150, 200, 250];
export const PROTECT_PRICES = [9, 19, 29, 39];

export const BILLS = [
  { id: "per_order", name: "Pay per order", desc: "A ₹15 fee on each order. Nothing else added." },
  { id: "membership", name: "Ownly Plus · ₹99 a month", desc: "No per-order fee. Cancel any time." },
  { id: "protected", name: "Order Protection", desc: "₹15 order fee plus cover if it arrives late, cold or wrong." },
];

export const OFFERS = [
  { id: "flat100", name: "₹100 off this order", desc: "Comes off this bill right now." },
  { id: "wallet", name: "Ownly Money", desc: "Goes to your next order. Nothing to remember." },
  { id: "recur10", name: "10% off every order for 30 days", desc: "Applies on this bill and the ones after." },
];

export const DELIVERY = [
  { id: "standard", name: "Standard", mins: 42, fee: 0, desc: "A rider is assigned after the kitchen starts.", tradeoff: "Can wait longer when it is busy." },
  { id: "rapido_link", name: "Rapido Link", mins: 25, fee: 30, desc: "A Rapido captain heading your way brings it.", tradeoff: "They may drop a passenger first." },
];

export const RESTAURANTS: Restaurant[] = [
  { n: "Paradise Biryani", c: "Biryani · Hyderabadi", e: "🍛", g: "#7c3b2c", r: 4.3, rv: "32K+", t: 38, d: "2.1 km", o: "Items at ₹99", badge: "BEST IN BIRYANI", k: "local", cu: "Biryani" },
  { n: "Bawarchi", c: "Biryani · Mughlai", e: "🍗", g: "#8d5a17", r: 4.1, rv: "18K+", t: 41, d: "3.4 km", o: "50% OFF up to ₹100", badge: "", k: "local", cu: "Biryani" },
  { n: "Shah Ghouse", c: "Biryani · Cafe", e: "🥘", g: "#3b5b37", r: 4.2, rv: "24K+", t: 44, d: "4.0 km", o: "Free delivery", badge: "", k: "local", cu: "Biryani" },
  { n: "Mehfil", c: "Biryani · Andhra", e: "🍚", g: "#6d4123", r: 4.0, rv: "9K+", t: 36, d: "2.8 km", o: "20% OFF", badge: "", k: "local", cu: "Biryani" },
  { n: "Cream Stone", c: "Desserts · Ice cream", e: "🍨", g: "#6d3d6d", r: 4.5, rv: "12K+", t: 29, d: "1.4 km", o: "Buy 1 Get 1", badge: "BEST IN DESSERTS", k: "local", cu: "Desserts" },
  { n: "Karachi Bakery", c: "Bakery · Snacks", e: "🍪", g: "#8d6a17", r: 4.4, rv: "7K+", t: 33, d: "2.6 km", o: "", badge: "", k: "local", cu: "Desserts" },
  { n: "Murgan Tiffins", c: "South Indian · Tiffins", e: "🥞", g: "#8d3844", r: 4.3, rv: "11K+", t: 31, d: "1.9 km", o: "Items at ₹49", badge: "", k: "local", cu: "South Indian" },
  { n: "Vivaha Bhojanambu", c: "Andhra · Meals", e: "🍲", g: "#2d5560", r: 4.1, rv: "6K+", t: 43, d: "3.8 km", o: "", badge: "", k: "local", cu: "South Indian" },
  { n: "Punjabi Affair", c: "North Indian · Curry", e: "🍜", g: "#a35217", r: 4.0, rv: "4K+", t: 42, d: "3.2 km", o: "", badge: "", k: "local", cu: "North Indian" },
  { n: "Barbeque Nation", c: "North Indian · Grill", e: "🍢", g: "#7a3520", r: 4.2, rv: "15K+", t: 45, d: "4.1 km", o: "₹150 OFF", badge: "", k: "chain", cu: "North Indian" },
  { n: "Domino's", c: "Pizza · Fast food", e: "🍕", g: "#9e2e2e", r: 4.1, rv: "41K+", t: 28, d: "1.6 km", o: "Items at ₹39", badge: "BEST IN PIZZA", k: "chain", cu: "Pizza" },
  { n: "KFC", c: "Fried chicken", e: "🍗", g: "#8d382e", r: 4.0, rv: "29K+", t: 30, d: "2.0 km", o: "Bucket deal", badge: "", k: "chain", cu: "Fast food" },
  { n: "Roastery Coffee House", c: "Cafe · Coffee", e: "☕", g: "#5c4432", r: 4.5, rv: "8K+", t: 34, d: "3.1 km", o: "", badge: "TOP RATED", k: "local", cu: "Cafe" },
  { n: "Chai Point", c: "Tea · Snacks", e: "🫖", g: "#6b5230", r: 4.1, rv: "5K+", t: 26, d: "1.2 km", o: "", badge: "FASTEST", k: "chain", cu: "Cafe" },
];

export const MENUS: Record<string, MenuItem[]> = {
  Biryani: [
    { n: "Chicken Dum Biryani", p: 280, was: 340, v: 0, e: "🍛", best: 1, d: "Boneless, dum, salan and raita" },
    { n: "Mutton Biryani", p: 360, was: 420, v: 0, e: "🍖", best: 1, d: "Hyderabadi kacchi style" },
    { n: "Veg Dum Biryani", p: 220, was: 0, v: 1, e: "🍚", best: 0, d: "Seasonal vegetables" },
    { n: "Chicken 65", p: 210, was: 250, v: 0, e: "🍗", best: 1, d: "Spicy fried chicken" },
  ],
  Desserts: [
    { n: "Death by Chocolate", p: 190, was: 230, v: 1, e: "🍫", best: 1, d: "Brownie and hot fudge" },
    { n: "Butterscotch Sundae", p: 170, was: 0, v: 1, e: "🍨", best: 1, d: "Crunch and cream" },
    { n: "Walnut Brownie", p: 150, was: 180, v: 1, e: "🍪", best: 0, d: "Served warm" },
  ],
  "South Indian": [
    { n: "Ghee Podi Idli", p: 110, was: 0, v: 1, e: "🍚", best: 1, d: "Four idlis, ghee and gunpowder" },
    { n: "Masala Dosa", p: 120, was: 150, v: 1, e: "🥞", best: 1, d: "Crisp dosa, potato masala" },
    { n: "Andhra Veg Meals", p: 180, was: 0, v: 1, e: "🍱", best: 1, d: "Rice, curries, rasam, curd" },
  ],
  "North Indian": [
    { n: "Paneer Butter Masala", p: 260, was: 310, v: 1, e: "🍛", best: 1, d: "Tomato gravy, cream" },
    { n: "Dal Makhani", p: 220, was: 0, v: 1, e: "🥘", best: 1, d: "Slow-cooked" },
    { n: "Butter Naan", p: 60, was: 0, v: 1, e: "🥖", best: 0, d: "Tandoor-baked" },
  ],
  Pizza: [
    { n: "Margherita", p: 199, was: 0, v: 1, e: "🍕", best: 1, d: "Cheese and tomato" },
    { n: "Farmhouse", p: 359, was: 429, v: 1, e: "🍕", best: 1, d: "Onion, capsicum, mushroom" },
    { n: "Garlic Breadsticks", p: 129, was: 159, v: 1, e: "🥖", best: 0, d: "With herb dip" },
  ],
  "Fast food": [
    { n: "Zinger Burger", p: 189, was: 229, v: 0, e: "🍔", best: 1, d: "Crispy fillet" },
    { n: "Chicken Bucket (6)", p: 499, was: 599, v: 0, e: "🍗", best: 1, d: "Six pieces" },
    { n: "Peri Peri Fries", p: 99, was: 0, v: 1, e: "🍟", best: 0, d: "Regular" },
  ],
  Cafe: [
    { n: "Cold Coffee", p: 180, was: 0, v: 1, e: "🥤", best: 1, d: "Double shot over ice" },
    { n: "Grilled Veg Sandwich", p: 190, was: 220, v: 1, e: "🥪", best: 1, d: "Sourdough, pesto" },
    { n: "Masala Chai", p: 40, was: 0, v: 1, e: "🫖", best: 0, d: "Cutting" },
  ],
};

export const DISHES = [
  { n: "Chicken biryani", e: "🍛", cu: "Biryani" },
  { n: "Mutton biryani", e: "🍖", cu: "Biryani" },
  { n: "Dosa", e: "🥞", cu: "South Indian" },
  { n: "Pizza", e: "🍕", cu: "Pizza" },
  { n: "Burger", e: "🍔", cu: "Fast food" },
  { n: "Ice cream", e: "🍨", cu: "Desserts" },
  { n: "Paneer butter masala", e: "🍛", cu: "North Indian" },
  { n: "Chai", e: "🫖", cu: "Cafe" },
];

export const CATS = [
  { e: "🍛", n: "Biryani" },
  { e: "🍕", n: "Pizza" },
  { e: "🍨", n: "Desserts" },
  { e: "🥞", n: "South Indian" },
  { e: "🍜", n: "North Indian" },
  { e: "🍔", n: "Fast food" },
  { e: "☕", n: "Cafe" },
];

export const QBANK: Record<string, QDef> = {
  why_offer: { kick: "Quick one", title: "Why this offer?", hint: "Tap one.", opts: [
    { v: "now_certain", e: "💰", l: "I want money off now" },
    { v: "more_later", e: "👛", l: "More money later is better" },
    { v: "adds_up", e: "🔁", l: "It saves more over time" },
    { v: "wont_return", e: "🤷", l: "I may not order here again" },
    { v: "distrust_future", e: "🧐", l: "I don't trust later offers" },
  ]},
  why_filter: { kick: "Quick one", title: "What were you looking for?", hint: "Tap one.", opts: [
    { v: "cheapest", e: "💰", l: "Something cheap" },
    { v: "quickest", e: "⚡", l: "Something fast" },
    { v: "trustable", e: "✅", l: "A place I trust" },
    { v: "browsing", e: "👀", l: "Just browsing" },
  ]},
  why_dish: { kick: "Quick one", title: "Why {sub}?", hint: "Tap one.", opts: [
    { v: "craving", e: "🤤", l: "I'm craving it" },
    { v: "default", e: "🔁", l: "I order this a lot" },
    { v: "time_of_day", e: "🕐", l: "I eat this at this time" },
    { v: "sharing", e: "👥", l: "Ordering for more people" },
    { v: "safe", e: "🛡", l: "Hard to get this wrong" },
  ]},
  why_rest: { kick: "Quick one", title: "Why this restaurant?", hint: "Tap one.", opts: [
    { v: "only_place", e: "🎯", l: "They make it best" },
    { v: "consistent", e: "✅", l: "It's always good" },
    { v: "value", e: "💰", l: "Good price" },
    { v: "fastest", e: "⚡", l: "Closest / fastest" },
    { v: "habit", e: "🔁", l: "I always pick them" },
  ]},
  app_gap: { kick: "Quick one", title: "Is {sub} on the food app you use most?", hint: "Tap one.", opts: [
    { v: "yes_easy", e: "👍", l: "Yes" },
    { v: "yes_costly", e: "💸", l: "Yes, but it's costly there" },
    { v: "no", e: "🚫", l: "No" },
    { v: "dont_know", e: "🤷", l: "Not sure" },
  ]},
  missing_dish: { kick: "Quick one", title: "We don't have {sub}. What next?", hint: "Tap one.", opts: [
    { v: "other_dish", e: "🍽", l: "Order something else here" },
    { v: "other_app", e: "📱", l: "Open the app I use most" },
    { v: "find_place", e: "🔎", l: "Find another restaurant" },
    { v: "not_order", e: "❌", l: "Don't order" },
    { v: "rarely_want", e: "🤷", l: "I only wanted it today" },
  ]},
  missing_action: { kick: "Quick one", title: "{sub} isn't here. What next?", hint: "Tap one.", opts: [
    { v: "other_place", e: "🔄", l: "Try another place here" },
    { v: "other_app", e: "📱", l: "Open the app I use most" },
    { v: "other_food", e: "🍽", l: "Order different food" },
    { v: "not_order", e: "❌", l: "Don't order" },
  ]},
  why_item: { kick: "Quick one", title: "Why add {sub}?", hint: "Tap one.", opts: [
    { v: "came_for_it", e: "🎯", l: "This is what I wanted" },
    { v: "bestseller", e: "⭐", l: "It was a bestseller" },
    { v: "price", e: "💰", l: "The price looked good" },
    { v: "picture", e: "📸", l: "It looked tasty" },
    { v: "portion", e: "🍽", l: "The portion is right" },
  ]},
  why_bill: { kick: "Quick one", title: "Why this way to pay?", hint: "Tap one.", opts: [
    { v: "cheapest_now", e: "💰", l: "It's the cheapest" },
    { v: "order_often", e: "📉", l: "I order often, so a plan is worth it" },
    { v: "no_third_sub", e: "🚫", l: "I don't want another membership" },
    { v: "want_cover", e: "🛡", l: "I want a refund if it goes wrong" },
    { v: "doubt_refund", e: "🧐", l: "I don't trust the refund" },
    { v: "new_app", e: "🤷", l: "It's new — I won't commit yet" },
  ]},
  why_delivery: { kick: "Quick one", title: "Why this delivery?", hint: "Tap one.", opts: [
    { v: "worth_it", e: "⚡", l: "Faster is worth the extra" },
    { v: "not_worth", e: "💰", l: "Not worth paying extra" },
    { v: "rider_idea", e: "🛵", l: "A nearby rider is fine" },
    { v: "hungry_now", e: "🍽", l: "I want it soon" },
    { v: "risk", e: "⚠", l: "Faster sounds less reliable" },
  ]},
  rapido_link_trust: { kick: "Quick one", title: "Any worry if a Rapido rider brings the food?", hint: "Tap one.", opts: [
    { v: "nothing", e: "👍", l: "No, it's fine" },
    { v: "food_safety", e: "🍱", l: "Food may not stay sealed / warm" },
    { v: "detour", e: "🗺", l: "They might drop a passenger first" },
    { v: "no_tracking", e: "📍", l: "I can't track it well" },
    { v: "late_anyway", e: "⏱", l: "It might still be late" },
  ]},
  meal_slot: { kick: "Quick one", title: "When do you usually order this?", hint: "Tap one.", opts: [
    { v: "breakfast", e: "🌅", l: "Breakfast" },
    { v: "lunch", e: "🍽", l: "Lunch" },
    { v: "evening", e: "🫖", l: "Evening snack" },
    { v: "dinner", e: "🌆", l: "Dinner" },
    { v: "late_night", e: "🌙", l: "Late night" },
  ]},
};

export function rupee(n: number) {
  return `₹${Math.round(n)}`;
}

export function menuFor(r: Restaurant | null): MenuItem[] {
  if (!r) return MENUS.Biryani;
  return MENUS[r.cu] || MENUS.Biryani;
}

export function priceOf(
  cart: CartItem[],
  billId: string,
  delId: string,
  offerId: string,
  protectPrice: number,
  rlPrice: number,
) {
  const S = cart.reduce((a, c) => a + c.p * c.q, 0);
  const del = DELIVERY.find((d) => d.id === delId) || DELIVERY[0];
  const delivery = del.id === "rapido_link" ? rlPrice : del.fee;
  let platform = 0;
  let member = 0;
  if (billId === "per_order") platform = 15;
  if (billId === "protected") platform = 15 + protectPrice;
  if (billId === "membership") {
    platform = 0;
    member = 99;
  }
  let discount = 0;
  if (offerId === "flat100") discount = Math.min(100, S);
  if (offerId === "recur10") discount = Math.round(0.1 * S);
  const taxable = Math.max(0, S - discount) + platform + delivery;
  const gst = Math.round(0.05 * taxable);
  return {
    S,
    discount,
    platform,
    delivery,
    member,
    gst,
    mins: del.mins,
    total: taxable + gst + member,
    perOrder: taxable + gst,
  };
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
