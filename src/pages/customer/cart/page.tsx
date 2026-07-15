import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { restaurantTables } from "@/mocks/tables";
import { supabase } from "@/lib/supabase";
import FloatingFood from "@/components/feature/FloatingFood";
import type React from "react";

export default function CartPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch, placeOrder } = useOrder();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reservation form state
  const [resForm, setResForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    notes: "",
  });

  const table = restaurantTables.find((t) => t.code === tableCode);

  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  const resFormValid =
    resForm.first_name.trim() !== "" &&
    resForm.last_name.trim() !== "" &&
    resForm.email.trim() !== "" &&
    resForm.date !== "" &&
    resForm.time !== "" &&
    resForm.guests !== "";

  const handleResFormChange = (field: string, value: string) => {
    setResForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrderAndReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCode || state.cart.length === 0) return;
    if (!resFormValid) {
      setError("Please fill in all required reservation fields.");
      return;
    }

    setPlacing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Step 1: Save reservation to Supabase
      const { data: reservation, error: resError } = await supabase
        .from("reservations")
        .insert({
          table_code: tableCode,
          first_name: resForm.first_name.trim(),
          last_name: resForm.last_name.trim(),
          email: resForm.email.trim(),
          phone: resForm.phone.trim(),
          reservation_date: resForm.date,
          reservation_time: resForm.time,
          guests: resForm.guests,
          notes: resForm.notes.trim(),
        })
        .select("id")
        .single();

      if (resError) {
        setError("Failed to save reservation. Please try again.");
        setPlacing(false);
        return;
      }

      // Step 2: Place the order
      const orderId = await placeOrder(tableCode);
      if (!orderId) {
        setError("Failed to place order. Please try again.");
        setPlacing(false);
        return;
      }

      // Step 3: Link order_id to reservation
      if (reservation) {
        supabase
          .from("reservations")
          .update({ order_id: orderId })
          .eq("id", reservation.id)
          .then(() => {});
      }

      // Step 4: Submit to Readdy Form API (fire and forget)
      const formBody = new URLSearchParams();
      formBody.append("table_code", tableCode);
      formBody.append("first_name", resForm.first_name.trim());
      formBody.append("last_name", resForm.last_name.trim());
      formBody.append("email", resForm.email.trim());
      if (resForm.phone.trim()) formBody.append("phone", resForm.phone.trim());
      formBody.append("date", resForm.date);
      formBody.append("time", resForm.time);
      formBody.append("guests", resForm.guests);
      if (resForm.notes.trim()) formBody.append("notes", resForm.notes.trim());
      formBody.append("order_id", orderId);

      fetch("https://readdy.ai/api/form/d9b6en5v8hat0f6uqjp0", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      }).catch(() => {});

      setSuccessMsg(`Order #${orderId.slice(0, 8)} placed! Redirecting...`);
      setTimeout(() => {
        navigate(`/order-status/${tableCode}/${orderId}`);
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background-50 flex flex-col">
      <FloatingFood />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-50/95 backdrop-blur-sm border-b border-background-200">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 max-w-6xl mx-auto">
          <Link to={`/menu/${tableCode}`} className="text-foreground-500 hover:text-foreground-700 transition-colors">
            <i className="ri-arrow-left-line text-lg"></i>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground-900">
              Complete Your Order
            </h1>
            <p className="text-xs text-foreground-500">Table {table.code} &middot; {table.seats} seats</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8">
        {state.cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-foreground-600 text-sm">Your cart is empty</p>
            <Link
              to={`/menu/${tableCode}`}
              className="mt-3 inline-block text-primary-500 text-sm font-medium hover:underline"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrderAndReserve} data-readdy-form>
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* ── Left: Order Summary ── */}
              <div className="lg:w-[55%] flex-shrink-0">
                <div className="mb-4">
                  <h2 className="font-heading text-lg font-semibold text-foreground-900 flex items-center gap-2">
                    <i className="ri-shopping-bag-line text-primary-500"></i>
                    Your Order
                  </h2>
                  <p className="text-xs text-foreground-500 mt-0.5">{state.cart.length} item{state.cart.length !== 1 ? "s" : ""} in your cart</p>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-5">
                  {state.cart.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center gap-3 p-3 rounded-lg border border-background-200 bg-background-50"
                    >
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-background-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-foreground-500">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2 bg-background-100 rounded-lg px-2 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              dispatch({ type: "REMOVE_ITEM", payload: { menuItemId: item.menuItemId } });
                            } else {
                              dispatch({
                                type: "UPDATE_QUANTITY",
                                payload: { menuItemId: item.menuItemId, quantity: item.quantity - 1 },
                              });
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded text-foreground-500 hover:bg-background-200 transition-all cursor-pointer"
                        >
                          <i className="ri-subtract-line text-sm"></i>
                        </button>
                        <span className="text-sm font-semibold text-foreground-900 min-w-[1.25rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { menuItemId: item.menuItemId, quantity: item.quantity + 1 },
                            })
                          }
                          className="w-6 h-6 flex items-center justify-center rounded text-foreground-500 hover:bg-background-200 transition-all cursor-pointer"
                        >
                          <i className="ri-add-line text-sm"></i>
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-foreground-900 w-16 text-right">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="rounded-lg border border-background-200 bg-background-50 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-foreground-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground-600">
                    <span>GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground-600">
                    <span>Service Charge (5%)</span>
                    <span>₹{serviceCharge}</span>
                  </div>
                  <div className="border-t border-background-200 pt-2 flex justify-between text-base font-semibold text-foreground-900">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              {/* ── Right: Reservation Details ── */}
              <div className="lg:w-[45%] flex-shrink-0">
                <div className="mb-4">
                  <h2 className="font-heading text-lg font-semibold text-foreground-900 flex items-center gap-2">
                    <i className="ri-calendar-check-line text-primary-500"></i>
                    Reservation Details
                  </h2>
                  <p className="text-xs text-foreground-500 mt-0.5">
                    Required to confirm your order
                  </p>
                </div>

                <div className="rounded-xl border border-background-200 bg-background-50 p-4 md:p-5 space-y-4">
                  <p className="text-xs text-foreground-400 italic">
                    Fill in your details below to reserve Table {table.code} and place your order together.
                  </p>

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

                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        First Name <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={resForm.first_name}
                        onChange={(e) => handleResFormChange("first_name", e.target.value)}
                        placeholder="Rahul"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Last Name <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={resForm.last_name}
                        onChange={(e) => handleResFormChange("last_name", e.target.value)}
                        placeholder="Sharma"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Email <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={resForm.email}
                        onChange={(e) => handleResFormChange("email", e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Phone <span className="text-foreground-300 font-normal">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={resForm.phone}
                        onChange={(e) => handleResFormChange("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Date + Time + Guests */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Date <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={resForm.date}
                        onChange={(e) => handleResFormChange("date", e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Time <span className="text-primary-500">*</span>
                      </label>
                      <select
                        value={resForm.time}
                        onChange={(e) => handleResFormChange("time", e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all appearance-none"
                      >
                        <option value="" disabled>Select</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="12:30 PM">12:30 PM</option>
                        <option value="01:00 PM">01:00 PM</option>
                        <option value="01:30 PM">01:30 PM</option>
                        <option value="07:00 PM">07:00 PM</option>
                        <option value="07:30 PM">07:30 PM</option>
                        <option value="08:00 PM">08:00 PM</option>
                        <option value="08:30 PM">08:30 PM</option>
                        <option value="09:00 PM">09:00 PM</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-foreground-600">
                        Guests <span className="text-primary-500">*</span>
                      </label>
                      <select
                        value={resForm.guests}
                        onChange={(e) => handleResFormChange("guests", e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all appearance-none"
                      >
                        <option value="" disabled>#</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8+">8+</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-foreground-600">
                      Special Requests <span className="text-foreground-300 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={resForm.notes}
                      onChange={(e) => handleResFormChange("notes", e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Dietary needs, celebrations, seating preferences..."
                      className="w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all resize-none"
                    />
                    <p className="text-[10px] text-foreground-400">{resForm.notes.length}/500</p>
                  </div>

                  {/* Validation hint */}
                  {!resFormValid && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-50 border border-accent-200">
                      <i className="ri-information-line text-accent-600 text-sm mt-0.5"></i>
                      <p className="text-xs text-accent-700">
                        Please complete all required fields (marked with *) before placing your order.
                        Missing: {[
                          !resForm.first_name.trim() && "First Name",
                          !resForm.last_name.trim() && "Last Name",
                          !resForm.email.trim() && "Email",
                          !resForm.date && "Date",
                          !resForm.time && "Time",
                          !resForm.guests && "Guests",
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Error / Success */}
                  {error && (
                    <div className="p-3 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 text-sm">
                      <i className="ri-error-warning-line mr-1.5"></i>
                      {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      {successMsg}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={placing || !resFormValid}
                    className="w-full py-3.5 px-4 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line"></i>
                        Place Order &amp; Reserve Table &middot; ₹{total}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}