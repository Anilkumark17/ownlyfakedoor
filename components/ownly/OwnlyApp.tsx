"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ARM,
  ARMS,
  BILLS,
  CATS,
  CartItem,
  DELIVERY,
  DISHES,
  OFFERS,
  RESTAURANTS,
  Restaurant,
  pickRandom,
  priceOf,
  rupee,
  menuFor,
  PROTECT_PRICES,
  RL_PRICES,
  WALLET_AMOUNTS,
  type Arm,
} from "@/lib/ownly/catalog";
import { logOwnlyEvent } from "@/lib/ownly/track";
import { STORAGE_KEYS } from "@/lib/constants";
import { QuestionSheet, type PendingQ } from "./QuestionSheet";

type Screen = "home" | "search" | "list" | "menu" | "delivery" | "cart" | "stop" | "end";
type Filter = "all" | "offers" | "fast" | "rated";

function lsGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

type Props = {
  sessionId: string;
  source: string;
  username: string;
  displayName: string;
  isDirectParticipant?: boolean;
};

function logoutOwnly(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  router.push("/login");
}

export function OwnlyApp({ sessionId, source, username, displayName, isDirectParticipant }: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [variant, setVariant] = useState<Arm>("discount");
  const [rlPrice, setRlPrice] = useState(25);
  const [walletAmt, setWalletAmt] = useState(150);
  const [protectPrice, setProtectPrice] = useState(19);
  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState("");
  const [dishQ, setDishQ] = useState("");
  const [restQ, setRestQ] = useState("");
  const [dishSelected, setDishSelected] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [delId, setDelId] = useState("standard");
  const [billId, setBillId] = useState("per_order");
  const [offerId, setOfferId] = useState("");
  const [qQueue, setQQueue] = useState<PendingQ[]>([]);
  const afterQ = useRef<(() => void) | null>(null);
  const started = useRef(false);
  const [ready, setReady] = useState(false);

  const track = useCallback((name: string, payload: Record<string, string | number | boolean> = {}) => {
    void logOwnlyEvent(sessionId, name, { ...payload, screen, username }, { variant, source, username });
  }, [sessionId, variant, source, screen, username]);

  useEffect(() => {
    const v = (lsGet("fd_variant") as Arm) || pickRandom(ARMS);
    lsSet("fd_variant", v);
    setVariant(v);
    const rl = Number(lsGet("fd_rlprice")) || pickRandom(RL_PRICES);
    lsSet("fd_rlprice", String(rl));
    setRlPrice(rl);
    const w = Number(lsGet("fd_wallet")) || pickRandom(WALLET_AMOUNTS);
    lsSet("fd_wallet", String(w));
    setWalletAmt(w);
    const p = Number(lsGet("fd_protect")) || pickRandom(PROTECT_PRICES);
    lsSet("fd_protect", String(p));
    setProtectPrice(p);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!sessionId || !ready || started.current) return;
    started.current = true;
    track("experiment_view", { entry_screen: "home" });
    track("landing_page_view", { variant_key: variant });
  }, [sessionId, ready, variant, track]);

  const lastShownQ = useRef("");
  useEffect(() => {
    const current = qQueue[0];
    if (!current) {
      lastShownQ.current = "";
      return;
    }
    const key = `${current.id}:${current.sub || ""}`;
    if (lastShownQ.current === key) return;
    lastShownQ.current = key;
    track("micro_shown", { q_id: current.id, subject: current.sub || "" });
  }, [qQueue, track]);

  useEffect(() => {
    return () => {
      if (started.current) {
        void logOwnlyEvent(sessionId, "prototype_exit", { furthest_step: screen, reason: "unmount", username }, { variant, source, username });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const ask = (qs: PendingQ[], then?: () => void) => {
    afterQ.current = then || null;
    setQQueue(qs);
  };
  const finishQ = () => {
    const next = afterQ.current;
    afterQ.current = null;
    setQQueue([]);
    next?.();
  };
  const answerQ = (id: string, answer: string, subject: string) => {
    track("micro_answer", { q_id: id, answer, subject });
    setQQueue((q) => {
      const rest = q.slice(1);
      if (rest.length === 0) setTimeout(finishQ, 0);
      return rest;
    });
  };
  const skipQ = (id: string, subject: string) => {
    track("micro_answer", { q_id: id, answer: "skipped", subject });
    setQQueue((q) => {
      const rest = q.slice(1);
      if (rest.length === 0) setTimeout(finishQ, 0);
      return rest;
    });
  };

  const feed = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      if (cat && r.cu !== cat) return false;
      if (filter === "fast") return r.t <= 32;
      if (filter === "rated") return r.r >= 4.2;
      if (filter === "offers") return !!r.o;
      return true;
    });
  }, [cat, filter]);

  const dishHits = useMemo(() => {
    const q = dishQ.trim().toLowerCase();
    if (!q) return DISHES;
    return DISHES.filter((d) => d.n.toLowerCase().includes(q));
  }, [dishQ]);

  const restHits = useMemo(() => {
    const q = restQ.trim().toLowerCase();
    if (!q) return RESTAURANTS.slice(0, 8);
    return RESTAURANTS.filter((r) => r.n.toLowerCase().includes(q) || r.c.toLowerCase().includes(q));
  }, [restQ]);

  const listRests = useMemo(() => {
    if (!dishSelected) return RESTAURANTS;
    const d = DISHES.find((x) => x.n === dishSelected);
    if (!d) return RESTAURANTS;
    return RESTAURANTS.filter((r) => r.cu === d.cu);
  }, [dishSelected]);

  const cartCount = cart.reduce((a, c) => a + c.q, 0);
  const priced = priceOf(cart, billId, delId, offerId, protectPrice, rlPrice);
  const code = sessionId.slice(0, 8).toUpperCase();

  const openRest = (r: Restaurant) => {
    setRestaurant(r);
    track("restaurant_card_click", { restaurant_name: r.n, rest_kind: r.k, category: r.cu });
    ask([{ id: "why_rest", sub: r.n }, { id: "app_gap", sub: r.n }], () => {
      setScreen("menu");
      track("menu_view", { restaurant_name: r.n, dish: dishSelected });
    });
  };

  const addItem = (name: string) => {
    if (!restaurant) return;
    const m = menuFor(restaurant).find((x) => x.n === name);
    if (!m) return;
    setCart((c) => {
      const hit = c.find((x) => x.n === name);
      if (hit) return c.map((x) => (x.n === name ? { ...x, q: x.q + 1 } : x));
      return [...c, { n: m.n, p: m.p, was: m.was, q: 1, e: m.e, best: m.best }];
    });
    track("item_added", { item_name: name, item_price: m.p, restaurant_name: restaurant.n, dish: dishSelected });
    ask([{ id: "why_item", sub: name }]);
  };

  const placeOrder = () => {
    track("place_order_click", {
      bill_id: billId,
      delivery_id: delId,
      offer: offerId,
      bill_total: priced.total,
      restaurant_name: restaurant?.n || "",
      dish: dishSelected,
      item_price: cart.reduce((a, c) => a + c.p * c.q, 0),
      n_selected: cartCount,
      wallet_amt: walletAmt,
      rl_price: rlPrice,
      protect_price: protectPrice,
    });
    track("honest_stop_view", { furthest_step: "cart" });
    track("research_disclosure_view", {});
    setScreen("stop");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-[#f4f4f2] pb-16">
      <div className="sticky top-0 z-30 border-b border-[#e8e8e4] bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#17211d]">{displayName}</p>
            <p className="text-[10px] font-semibold text-[#888]">
              {isDirectParticipant ? "Direct Ownly" : "From Rapido"} · @{username}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logoutOwnly(router)}
            className="shrink-0 rounded-lg border border-[#ddd] px-3 py-1.5 text-[11px] font-extrabold text-[#555]"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="sticky top-[52px] z-20 bg-[#fff4d6] px-3 py-1.5 text-center text-[11px] font-extrabold text-[#6a4700]">
        Research prototype · not a live order
      </div>

      {screen === "home" && (
        <div className="flex-1 pb-24">
          <div className="px-4 pt-3">
            <p className="text-xs text-[#888]">📍 Gachibowli</p>
            <p className="text-sm font-bold">DLF Cyber City Road</p>
            <button
              type="button"
              onClick={() => { setScreen("search"); track("search_tap"); track("dish_search_view"); }}
              className="mt-3 w-full rounded-xl bg-white px-3 py-3 text-left text-sm text-[#888] shadow-sm"
            >
              🔍 Search “biryani”
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto px-4">
            {(["all", "offers", "fast", "rated"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  track("filter_tab_click", { detail: f });
                  if (f !== "all") ask([{ id: "why_filter", sub: f }]);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${filter === f ? "bg-[#17211d] text-white" : "bg-white text-[#555]"}`}
              >
                {f === "all" ? "ALL" : f === "offers" ? "OFFERS" : f === "fast" ? "FAST" : "RATED 4+"}
              </button>
            ))}
          </div>
          <h3 className="px-4 pt-4 text-sm font-extrabold">{ARM[variant].offersTitle}</h3>
          <div className="grid grid-cols-2 gap-2 px-4 pt-2">
            {ARM[variant].offers.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => track("offer_card_click", { offer: o.id })}
                className="rounded-xl bg-[#17211d] p-3 text-left text-white"
              >
                <div className="text-lg">{o.e}</div>
                <div className="text-[10px] uppercase opacity-70">{o.kick}</div>
                <div className="text-sm font-extrabold">{o.big}</div>
              </button>
            ))}
          </div>
          <h3 className="px-4 pt-4 text-sm font-extrabold">What&apos;s on your mind?</h3>
          <div className="flex gap-2 overflow-x-auto px-4 pt-2">
            {CATS.map((c) => (
              <button
                key={c.n}
                type="button"
                onClick={() => { setCat(cat === c.n ? "" : c.n); track("category_chip_click", { category: c.n }); }}
                className={`shrink-0 rounded-xl px-3 py-2 text-center text-xs ${cat === c.n ? "bg-[#e2562b] text-white" : "bg-white"}`}
              >
                <div className="text-lg">{c.e}</div>
                {c.n}
              </button>
            ))}
          </div>
          <h3 className="px-4 pt-4 text-sm font-extrabold">Top restaurants</h3>
          <div className="space-y-2 px-4 pt-2">
            {feed.map((r) => (
              <button key={r.n} type="button" onClick={() => openRest(r)} className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left">
                <span className="grid h-12 w-12 place-items-center rounded-xl text-xl" style={{ background: r.g, color: "#fff" }}>{r.e}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{r.n}</span>
                  <span className="block text-xs text-[#777]">{r.c} · ★ {r.r} · {r.t} min</span>
                </span>
                <span className="rounded bg-[#eee] px-1.5 py-0.5 text-[10px] font-bold">{r.t} MINS</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === "search" && (
        <div className="flex-1 px-4 pb-8">
          <button type="button" className="py-3 text-sm font-bold" onClick={() => setScreen("home")}>‹ Back</button>
          <p className="text-sm font-bold">What do you feel like eating?</p>
          <input
            value={dishQ}
            onChange={(e) => {
              setDishQ(e.target.value);
              if (e.target.value.length >= 2) track("search_query", { query: e.target.value, source_screen: "dish" });
            }}
            placeholder="biryani, dosa, pizza…"
            className="mt-2 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 py-3"
          />
          <div className="mt-2 space-y-1">
            {dishHits.map((d) => (
              <button
                key={d.n}
                type="button"
                onClick={() => {
                  setDishSelected(d.n);
                  track("dish_selected", { dish: d.n, category: d.cu, query: dishQ });
                  ask([{ id: "why_dish", sub: d.n }, { id: "meal_slot", sub: d.n }], () => setScreen("list"));
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left"
              >
                <span>{d.e}</span> {d.n}
              </button>
            ))}
            {dishQ.trim() && dishHits.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  track("dish_added_custom", { dish: dishQ });
                  ask([{ id: "missing_dish", sub: dishQ }]);
                }}
                className="w-full rounded-lg bg-[#fff4d6] px-3 py-3 text-sm font-semibold"
              >
                We don&apos;t have “{dishQ}”. Tell us what you would do.
              </button>
            )}
          </div>
          <p className="mt-5 text-sm font-bold">Or go straight to a place</p>
          <input
            value={restQ}
            onChange={(e) => {
              setRestQ(e.target.value);
              if (e.target.value.length >= 2) track("search_query", { query: e.target.value, source_screen: "restaurant" });
            }}
            placeholder="a restaurant you order from…"
            className="mt-2 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 py-3"
          />
          <div className="mt-2 space-y-1">
            {restHits.map((r) => (
              <button
                key={r.n}
                type="button"
                onClick={() => {
                  track("restaurant_search_selected", { restaurant_name: r.n, query: restQ, dish: dishSelected });
                  openRest(r);
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left"
              >
                <span>{r.e}</span>
                <span><b>{r.n}</b><span className="block text-xs text-[#777]">{r.c}</span></span>
              </button>
            ))}
            {restQ.trim() && restHits.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  track("restaurant_added_custom", { restaurant_name: restQ });
                  ask([{ id: "missing_action", sub: restQ }]);
                }}
                className="w-full rounded-lg bg-[#fff4d6] px-3 py-3 text-sm font-semibold"
              >
                “{restQ}” isn&apos;t here. What next?
              </button>
            )}
          </div>
        </div>
      )}

      {screen === "list" && (
        <div className="flex-1 px-4 pb-8">
          <button type="button" className="py-3 text-sm font-bold" onClick={() => setScreen("search")}>‹ Back</button>
          <h3 className="font-extrabold">Places for {dishSelected || "you"}</h3>
          <div className="mt-2 space-y-2">
            {listRests.map((r) => (
              <button key={r.n} type="button" onClick={() => openRest(r)} className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left">
                <span className="text-xl">{r.e}</span>
                <span className="flex-1"><b>{r.n}</b><span className="block text-xs text-[#777]">★ {r.r} · {r.t} min</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === "menu" && restaurant && (
        <div className="flex-1 pb-28">
          <div className="bg-[#17211d] px-4 pb-4 pt-3 text-white">
            <button type="button" className="text-sm font-bold" onClick={() => setScreen(dishSelected ? "list" : "home")}>‹ Back</button>
            <h2 className="mt-2 text-xl font-extrabold">{restaurant.n}</h2>
            <p className="text-sm opacity-80">{restaurant.t} mins · {restaurant.d} · ★ {restaurant.r}</p>
          </div>
          <div className="space-y-2 px-4 pt-4">
            {menuFor(restaurant).map((m) => {
              const q = cart.find((c) => c.n === m.n)?.q || 0;
              return (
                <div key={m.n} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                  <div>
                    <p className="font-extrabold">{m.e} {m.n}</p>
                    <p className="text-xs text-[#777]">{m.d}</p>
                    <p className="mt-1 text-sm font-bold">{rupee(m.p)}{m.was ? <s className="ml-2 text-[#aaa]">{rupee(m.was)}</s> : null}</p>
                  </div>
                  {q > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm font-bold text-[#e2562b]">
                      <button
                        type="button"
                        onClick={() => {
                          setCart((c) => c.map((x) => x.n === m.n ? { ...x, q: x.q - 1 } : x).filter((x) => x.q > 0));
                          track("item_qty_changed", { item_name: m.n, n_selected: q - 1, restaurant_name: restaurant.n });
                        }}
                      >−</button>
                      {q}
                      <button type="button" onClick={() => addItem(m.n)}>+</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => addItem(m.n)} className="rounded-lg border border-[#e2562b] px-3 py-1 text-xs font-extrabold text-[#e2562b]">ADD</button>
                  )}
                </div>
              );
            })}
          </div>
          {cartCount > 0 && (
            <button type="button" onClick={() => { setScreen("delivery"); track("delivery_screen_view", { restaurant_name: restaurant.n, rl_price: rlPrice }); }} className="fixed bottom-16 left-1/2 z-10 w-[min(440px,92%)] -translate-x-1/2 rounded-xl bg-[#1a8a4a] py-3 font-extrabold text-white">
              {cartCount} item{cartCount === 1 ? "" : "s"} · Continue ›
            </button>
          )}
        </div>
      )}

      {screen === "delivery" && (
        <div className="flex-1 pb-24">
          <div className="bg-[#17211d] px-4 pb-4 pt-3 text-white">
            <button type="button" className="text-sm font-bold" onClick={() => setScreen("menu")}>‹ Back</button>
            <h2 className="mt-2 text-xl font-extrabold">How fast do you want it?</h2>
          </div>
          <div className="space-y-2 px-4 pt-4">
            {DELIVERY.map((d) => {
              const fee = d.id === "rapido_link" ? rlPrice : d.fee;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDelId(d.id);
                    track("delivery_option_chosen", { delivery_id: d.id, mins: d.mins, rl_price: rlPrice });
                    const qs: PendingQ[] = [{ id: "why_delivery", sub: d.name }];
                    if (d.id === "rapido_link") qs.push({ id: "rapido_link_trust" });
                    ask(qs);
                  }}
                  className={`w-full rounded-xl border p-3 text-left ${delId === d.id ? "border-[#1a8a4a] bg-[#e8f6ee]" : "border-[#eee] bg-white"}`}
                >
                  <div className="flex justify-between">
                    <b>{d.name}</b>
                    <span className="text-sm font-extrabold">{d.mins} min · {fee ? `+${rupee(fee)}` : "No charge"}</span>
                  </div>
                  <p className="text-xs text-[#666]">{d.desc}</p>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { track("delivery_confirmed", { delivery_id: delId, rl_price: rlPrice }); setScreen("cart"); track("cart_view", { restaurant_name: restaurant?.n || "", n_selected: cartCount, item_price: cart.reduce((a, c) => a + c.p * c.q, 0) }); }} className="fixed bottom-4 left-1/2 w-[min(440px,92%)] -translate-x-1/2 rounded-xl bg-[#1a8a4a] py-3 font-extrabold text-white">
            Continue
          </button>
        </div>
      )}

      {screen === "cart" && (
        <div className="flex-1 pb-28">
          <div className="bg-[#17211d] px-4 pb-4 pt-3 text-white">
            <button type="button" className="text-sm font-bold" onClick={() => setScreen("menu")}>‹ Back</button>
            <h2 className="mt-2 text-lg font-extrabold">{restaurant?.n || "Your order"}</h2>
          </div>
          <div className="space-y-3 px-4 pt-4">
            <div className="rounded-xl bg-white p-3">
              {cart.map((c) => (
                <div key={c.n} className="flex items-center justify-between py-1 text-sm">
                  <span>{c.e} {c.n} × {c.q}</span>
                  <b>{rupee(c.p * c.q)}</b>
                </div>
              ))}
              <div className="mt-2 space-y-1 border-t pt-2 text-xs text-[#555]">
                {priced.discount > 0 && <div className="flex justify-between text-[#1a8a4a]"><span>Offer</span><span>−{rupee(priced.discount)}</span></div>}
                <div className="flex justify-between"><span>Platform fee</span><span>{rupee(priced.platform)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{priced.delivery ? rupee(priced.delivery) : "No charge"}</span></div>
                {priced.member > 0 && <div className="flex justify-between"><span>Ownly Plus</span><span>{rupee(priced.member)}</span></div>}
                <div className="flex justify-between"><span>GST (5%)</span><span>{rupee(priced.gst)}</span></div>
                <div className="flex justify-between text-sm font-extrabold text-black"><span>To pay</span><span>{rupee(priced.total)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-extrabold">Offers you can use</h4>
              {OFFERS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    const next = offerId === o.id ? "" : o.id;
                    setOfferId(next);
                    if (!next) track("offer_removed", { offer: o.id });
                    else {
                      track("offer_applied", { offer: o.id, wallet_amt: walletAmt });
                      ask([{ id: "why_offer", sub: o.id === "wallet" ? `₹${walletAmt} in Ownly Money` : o.name }]);
                    }
                  }}
                  className={`mb-2 w-full rounded-xl border p-3 text-left ${offerId === o.id ? "border-[#1a8a4a] bg-[#e8f6ee]" : "border-[#eee] bg-white"}`}
                >
                  <b>{o.id === "wallet" ? `₹${walletAmt} in Ownly Money` : o.name}</b>
                  <p className="text-xs text-[#666]">{o.desc}</p>
                </button>
              ))}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-extrabold">Choose how you pay</h4>
              {BILLS.map((b) => {
                const p = priceOf(cart, b.id, delId, offerId, protectPrice, rlPrice);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBillId(b.id);
                      track("bill_option_chosen", { bill_id: b.id, bill_total: p.total, protect_price: protectPrice });
                      ask([{ id: "why_bill", sub: b.name }]);
                    }}
                    className={`mb-2 w-full rounded-xl border p-3 text-left ${billId === b.id ? "border-[#1a8a4a] bg-[#e8f6ee]" : "border-[#eee] bg-white"}`}
                  >
                    <div className="flex justify-between"><b>{b.name}</b><b>{rupee(p.total)}</b></div>
                    <p className="text-xs text-[#666]">{b.id === "protected" ? `₹15 fee + ₹${protectPrice} cover.` : b.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={placeOrder} className="fixed bottom-4 left-1/2 w-[min(440px,92%)] -translate-x-1/2 rounded-xl bg-[#1a8a4a] py-3 font-extrabold text-white">
            Place Order · {rupee(priced.total)}
          </button>
        </div>
      )}

      {screen === "stop" && (
        <div className="flex-1 px-5 pt-8">
          <p className="text-4xl">✋</p>
          <h2 className="mt-2 text-2xl font-extrabold">We can&apos;t place this order.</h2>
          <p className="mt-3 text-sm leading-relaxed">This is a research prototype. Nothing was charged. No restaurant was contacted.</p>
          <div className="mt-5 rounded-xl bg-white p-4 text-center">
            <p className="text-xs uppercase text-[#888]">Your code</p>
            <p className="text-2xl font-extrabold tracking-widest">{code}</p>
          </div>
          <button type="button" onClick={() => { track("followup_consent_given", { contact_channel: "survey" }); setScreen("end"); }} className="mt-5 w-full rounded-xl bg-[#e2562b] py-3 font-extrabold text-white">
            Done
          </button>
        </div>
      )}

      {screen === "end" && (
        <div className="flex-1 px-5 pt-16 text-center">
          <h2 className="text-2xl font-extrabold">Thanks — that&apos;s everything.</h2>
          <p className="mt-2 text-sm text-[#666]">You can go back to Rapido or close this page.</p>
          <p className="mt-4 text-xl font-extrabold tracking-widest">{code}</p>
          <button
            type="button"
            onClick={() => {
              track("prototype_exit", { furthest_step: "end", completed_posttest: true });
              if (isDirectParticipant) logoutOwnly(router);
              else router.push("/app");
            }}
            className="mt-6 w-full rounded-xl bg-[#17211d] py-3 font-extrabold text-white"
          >
            {isDirectParticipant ? "Log out" : "Back to Rapido"}
          </button>
        </div>
      )}

      {screen === "home" && (
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[440px] -translate-x-1/2 border-t bg-white">
          {[["home", "🍽", "FOOD"], ["search", "🔍", "SEARCH"], ["cart", "🛒", "CART"]].map(([id, ico, lab]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                track("bottom_nav_click", { detail: id });
                if (id === "search") setScreen("search");
                if (id === "cart" && cartCount) setScreen("cart");
                if (id === "home") setScreen("home");
              }}
              className={`flex-1 py-2 text-[10px] font-extrabold ${screen === id ? "text-[#e2562b]" : "text-[#888]"}`}
            >
              <div className="text-base">{ico}</div>{lab}
            </button>
          ))}
        </nav>
      )}

      <QuestionSheet queue={qQueue} onAnswer={answerQ} onSkip={skipQ} />
    </div>
  );
}
