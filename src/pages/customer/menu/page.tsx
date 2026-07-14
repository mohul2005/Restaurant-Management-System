import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { useMenuItems } from "@/hooks/useMenuItems";
import { restaurantTables } from "@/mocks/tables";
import { supabase } from "@/lib/supabase";
import type React from "react";

const categoryLabels: Record<string, string> = {
  Starters: "Starters",
  "Main Course": "Mains",
  Beverages: "Drinks",
  Desserts: "Desserts",
};

const categoryOrder = ["Starters", "Main Course", "Beverages", "Desserts"];

function getItemTag(item: { name: string; is_veg: boolean; price: number }): string | null {
  const signatures = ["Butter Chicken", "Chicken Biryani", "Paneer Butter Masala"];
  const chefPicks = ["Grilled Fish in Lemon Butter", "Chocolate Lava Cake", "Chicken Tikka Skewers"];
  const popular = ["Dal Makhani", "Bruschetta Trio", "Gulab Jamun"];

  if (signatures.includes(item.name)) return "Signature";
  if (chefPicks.includes(item.name)) return "Chef's Pick";
  if (popular.includes(item.name)) return "Popular";
  if (item.is_veg) return "Vegetarian";
  return null;
}

export default function MenuPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useOrder();
  const { items: menuItems, loading, error } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState<string>("Starters");
  const [searchTerm, setSearchTerm] = useState("");

  const handleReservationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    const honeypot = (formData.get("phone_alt") as string)?.trim();
    if (honeypot) {
      const feedback = document.getElementById("res-feedback");
      if (feedback) {
        feedback.classList.remove("hidden");
        feedback.querySelector(".res-success")?.classList.remove("hidden");
      }
      return;
    }

    // Remove honeypot from payload
    formData.delete("phone_alt");

    // Grab reservation data for Supabase
    const reservationData = {
      table_code: tableCode || "",
      first_name: (formData.get("first_name") as string) || "",
      last_name: (formData.get("last_name") as string) || "",
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || "",
      reservation_date: (formData.get("date") as string) || "",
      reservation_time: (formData.get("time") as string) || "",
      guests: (formData.get("guests") as string) || "",
      notes: (formData.get("notes") as string) || "",
    };

    // Save reservation to Supabase in parallel
    const supabasePromise = supabase.from("reservations").insert(reservationData);

    // Submit to Readdy Form API
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      let parsed: { code?: string; meta?: { message?: string; detail?: string } } | null = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }

      const feedback = document.getElementById("res-feedback");
      const successEl = feedback?.querySelector(".res-success");
      const errorEl = feedback?.querySelector(".res-error");

      if (
        response.ok &&
        parsed &&
        parsed.code === "OK" &&
        !(parsed.meta?.message?.toLowerCase().includes("spam")) &&
        !(parsed.meta?.detail?.toLowerCase().includes("spam"))
      ) {
        // Also save to Supabase (don't block success on this)
        supabasePromise.catch(() => {});
        form.reset();
        if (feedback) {
          feedback.classList.remove("hidden");
          successEl?.classList.remove("hidden");
          errorEl?.classList.add("hidden");
        }
      } else {
        const serverMsg = parsed?.meta?.message || parsed?.meta?.detail || responseText;
        if (feedback && errorEl) {
          feedback.classList.remove("hidden");
          errorEl.textContent = serverMsg || "Something went wrong. Please try again.";
          errorEl.classList.remove("hidden");
          successEl?.classList.add("hidden");
        }
      }
    } catch {
      const feedback = document.getElementById("res-feedback");
      const errorEl = feedback?.querySelector(".res-error");
      const successEl = feedback?.querySelector(".res-success");
      if (feedback && errorEl) {
        feedback.classList.remove("hidden");
        errorEl.classList.remove("hidden");
        successEl?.classList.add("hidden");
      }
    }
  };

  const table = restaurantTables.find((t) => t.code === tableCode);

  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => item.category === activeCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)
      );
    }
    return items;
  }, [menuItems, activeCategory, searchTerm]);

  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const isInCart = (itemId: string) => state.cart.some((i) => i.menuItemId === itemId);
  const getCartQty = (itemId: string) => state.cart.find((i) => i.menuItemId === itemId)?.quantity || 0;

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-50">
        <div className="text-center">
          <p className="text-foreground-600">Table not found.</p>
          <Link to="/" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background-50/95 backdrop-blur-sm border-b border-background-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-foreground-500 hover:text-foreground-700 transition-colors">
              <i className="ri-arrow-left-line text-lg"></i>
            </Link>
            <div>
              <h1 className="font-heading text-lg font-semibold text-foreground-900">
                The Spice Kitchen
              </h1>
              <p className="text-xs text-foreground-500">
                Table {table.code} &middot; {table.seats} seats
              </p>
            </div>
          </div>
          {cartCount > 0 && (
            <button
              onClick={() => navigate(`/cart/${tableCode}`)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <i className="ri-shopping-cart-line"></i>
              <span>{cartCount}</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Section Heading */}
        <div className="text-center mb-8 md:mb-10">
          <p className="text-primary-500 text-xs uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
            <span className="inline-block w-6 h-[1px] bg-primary-400"></span>
            Our Menu
            <span className="inline-block w-6 h-[1px] bg-primary-400"></span>
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground-900 leading-tight">
            Crafted over
            <br />
            <em className="text-primary-500">open flame</em>
          </h2>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10">
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchTerm("");
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200 border border-background-300"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-background-200 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-background-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-background-200 rounded w-2/3" />
                  <div className="h-3 bg-background-200 rounded w-full" />
                  <div className="h-3 bg-background-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-foreground-500 text-sm mb-3">Failed to load menu.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-500 text-sm">No items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                isInCart={isInCart(item.id)}
                cartQty={getCartQty(item.id)}
                onAdd={() =>
                  dispatch({
                    type: "ADD_ITEM",
                    payload: {
                      menuItemId: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                    },
                  })
                }
                onRemove={() => dispatch({ type: "REMOVE_ITEM", payload: { menuItemId: item.id } })}
                onUpdateQty={(qty: number) =>
                  dispatch({
                    type: "UPDATE_QUANTITY",
                    payload: { menuItemId: item.id, quantity: qty },
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Reservation Section */}
      <section className="relative bg-background-950 py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-primary-500 text-xs uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
              <span className="inline-block w-6 h-[1px] bg-primary-400"></span>
              Reservations
              <span className="inline-block w-6 h-[1px] bg-primary-400"></span>
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Reserve your
              <br />
              <em className="text-accent-300">table</em>
            </h2>
          </div>

          <form
            data-readdy-form
            id="reservation-form"
            action="https://readdy.ai/api/form/d9b5t8ahsavvukudoll0"
            method="POST"
            className="space-y-5"
            onSubmit={handleReservationSubmit}
          >
            {/* Honeypot */}
            <input
              type="text"
              name="phone_alt"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
              className="honeypot-field"
            />

            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="fname" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  id="fname"
                  name="first_name"
                  type="text"
                  placeholder="e.g. Rahul"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lname" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  id="lname"
                  name="last_name"
                  type="text"
                  placeholder="e.g. Sharma"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                />
              </div>
            </div>

            {/* Email + Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="res-email" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="res-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="res-phone" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  id="res-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                />
              </div>
            </div>

            {/* Date + Time + Guests Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="res-date" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Date
                </label>
                <input
                  id="res-date"
                  name="date"
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="res-time" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Time
                </label>
                <select
                  id="res-time"
                  name="time"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" disabled selected className="bg-background-950 text-foreground-500">Select a time</option>
                  <option value="12:00 PM" className="bg-background-950">12:00 PM</option>
                  <option value="12:30 PM" className="bg-background-950">12:30 PM</option>
                  <option value="01:00 PM" className="bg-background-950">01:00 PM</option>
                  <option value="01:30 PM" className="bg-background-950">01:30 PM</option>
                  <option value="07:00 PM" className="bg-background-950">07:00 PM</option>
                  <option value="07:30 PM" className="bg-background-950">07:30 PM</option>
                  <option value="08:00 PM" className="bg-background-950">08:00 PM</option>
                  <option value="08:30 PM" className="bg-background-950">08:30 PM</option>
                  <option value="09:00 PM" className="bg-background-950">09:00 PM</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="res-guests" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                  Guests
                </label>
                <select
                  id="res-guests"
                  name="guests"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all appearance-none"
                >
                  <option value="" disabled selected className="bg-background-950">Number</option>
                  <option value="1" className="bg-background-950">1</option>
                  <option value="2" className="bg-background-950">2</option>
                  <option value="3" className="bg-background-950">3</option>
                  <option value="4" className="bg-background-950">4</option>
                  <option value="5" className="bg-background-950">5</option>
                  <option value="6" className="bg-background-950">6</option>
                  <option value="7" className="bg-background-950">7</option>
                  <option value="8+" className="bg-background-950">8+</option>
                </select>
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-1.5">
              <label htmlFor="res-notes" className="block text-xs font-medium text-white/60 uppercase tracking-wider">
                Special Requests <span className="text-white/25 normal-case">(optional)</span>
              </label>
              <textarea
                id="res-notes"
                name="notes"
                rows={3}
                maxLength={500}
                placeholder="Dietary needs, celebrations, seating preferences..."
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all resize-none"
              />
              <p className="text-[10px] text-white/25 mt-1">Max 500 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              Confirm Reservation
            </button>

            {/* Feedback */}
            <div id="res-feedback" className="hidden text-center text-sm">
              <span className="res-success hidden text-green-400">Reservation request sent successfully!</span>
              <span className="res-error hidden text-primary-400">Something went wrong. Please try again.</span>
            </div>
          </form>
        </div>
      </section>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-background-50/95 backdrop-blur-sm border-t border-background-200">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate(`/cart/${tableCode}`)}
              className="w-full flex items-center justify-between bg-primary-500 text-background-50 px-5 py-3.5 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                <i className="ri-shopping-cart-line text-lg"></i>
                <span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
              </span>
              <span className="font-semibold">₹{cartTotal}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({
  item,
  isInCart,
  cartQty,
  onAdd,
  onRemove,
  onUpdateQty,
}: {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    is_veg: boolean;
  };
  isInCart: boolean;
  cartQty: number;
  onAdd: () => void;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const tag = getItemTag(item);

  return (
    <div className="group rounded-xl border border-background-200 bg-background-50 overflow-hidden hover:border-background-300 transition-all">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-background-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {item.is_veg && (
          <div className="absolute top-3 right-3 w-5 h-5 rounded-sm border border-green-500 bg-white flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-foreground-900 leading-snug">
            {item.name}
          </h3>
          <span className="text-sm font-semibold text-primary-600 shrink-0">
            ₹{item.price}
          </span>
        </div>

        <p className="text-xs text-foreground-500 leading-relaxed line-clamp-2 mb-3">
          {item.description}
        </p>

        {tag && (
          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider mb-3 ${
            tag === "Signature"
              ? "bg-primary-100 text-primary-700"
              : tag === "Chef's Pick"
              ? "bg-accent-100 text-accent-800"
              : tag === "Popular"
              ? "bg-secondary-100 text-secondary-800"
              : "bg-green-50 text-green-700"
          }`}>
            {tag}
          </span>
        )}

        {/* Add / Stepper */}
        <div className="pt-2 border-t border-background-200">
          {!isInCart ? (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-primary-500 text-primary-600 text-sm font-medium hover:bg-primary-500 hover:text-background-50 transition-all cursor-pointer"
            >
              <i className="ri-add-line"></i>
              Add to Order
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => (cartQty <= 1 ? onRemove() : onUpdateQty(cartQty - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all cursor-pointer"
                >
                  <i className="ri-subtract-line text-sm"></i>
                </button>
                <span className="text-sm font-semibold text-primary-700 min-w-[1.5rem] text-center">
                  {cartQty}
                </span>
                <button
                  onClick={() => onUpdateQty(cartQty + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all cursor-pointer"
                >
                  <i className="ri-add-line text-sm"></i>
                </button>
              </div>
              <span className="text-xs text-foreground-400">
                ₹{item.price * cartQty}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}