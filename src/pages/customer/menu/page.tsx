import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { useMenuItems } from "@/hooks/useMenuItems";
import { restaurantTables } from "@/mocks/tables";
import FloatingFood from "@/components/feature/FloatingFood";
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
      <FloatingFood />
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
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <i className="ri-shopping-cart-line"></i>
              <span>{cartCount} item{cartCount !== 1 ? "s" : ""} &middot; ₹{cartTotal}</span>
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
              <span className="flex items-center gap-2">
                <span className="font-semibold">₹{cartTotal}</span>
                <span className="text-xs opacity-80 hidden sm:inline">&mdash; review &amp; reserve</span>
              </span>
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