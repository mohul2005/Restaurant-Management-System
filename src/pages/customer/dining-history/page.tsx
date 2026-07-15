import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FloatingFood from "@/components/feature/FloatingFood";

interface ReservationHistory {
  id: string;
  table_code: string;
  first_name: string;
  last_name: string;
  reservation_date: string;
  reservation_time: string;
  guests: string;
  notes: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  linked_order: {
    id: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    status: string;
  } | null;
}

export default function DiningHistoryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ReservationHistory[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(true);

    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .eq("email", trimmed)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (resError) {
      setError("Failed to load history. Please try again.");
      setLoading(false);
      return;
    }

    const enriched: ReservationHistory[] = [];

    for (const res of reservations || []) {
      let linkedOrder: ReservationHistory["linked_order"] = null;

      if (res.order_id) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", res.order_id)
          .maybeSingle();

        if (orderData) {
          linkedOrder = {
            id: orderData.id,
            items: orderData.items || [],
            total: orderData.total,
            status: orderData.status,
          };
        }
      }

      enriched.push({
        id: res.id,
        table_code: res.table_code,
        first_name: res.first_name,
        last_name: res.last_name,
        reservation_date: res.reservation_date,
        reservation_time: res.reservation_time,
        guests: res.guests,
        notes: res.notes,
        feedback: res.feedback,
        created_at: res.created_at,
        updated_at: res.updated_at,
        linked_order: linkedOrder,
      });
    }

    setHistory(enriched);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background-50">
      <FloatingFood />
      <header className="sticky top-0 z-30 bg-background-50/95 backdrop-blur-sm border-b border-background-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="text-foreground-500 hover:text-foreground-700 transition-colors">
            <i className="ri-arrow-left-line text-lg"></i>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground-900">
              Dining History
            </h1>
            <p className="text-xs text-foreground-500">
              View your past reservations and orders
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Search Form */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-6 mb-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-history-line text-xl text-foreground-600"></i>
            </div>
            <h2 className="text-lg font-semibold text-foreground-900">Your Dining History</h2>
            <p className="text-sm text-foreground-500 mt-1">
              Enter the email you used for reservations to see your past visits.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  "Search"
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-primary-600 flex items-center gap-1">
                <i className="ri-error-warning-line"></i>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        ) : searched ? (
          history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
                <i className="ri-inbox-line text-2xl text-foreground-300"></i>
              </div>
              <p className="text-foreground-600 text-sm font-medium">No dining history found</p>
              <p className="text-xs text-foreground-400 mt-1">
                No completed reservations found for <strong>{email.trim().toLowerCase()}</strong>
              </p>
              <p className="text-xs text-foreground-400 mt-3">
                Make a reservation and complete your visit to see it here.
              </p>
              <Link
                to="/"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                Browse Tables
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <i className="ri-history-line text-foreground-500"></i>
                <p className="text-sm font-semibold text-foreground-600">
                  {history.length} visit{history.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="space-y-4">
                {history.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-xl border border-background-200 bg-background-50 overflow-hidden"
                  >
                    {/* Reservation Header */}
                    <div className="px-4 py-3 bg-background-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-background-200 flex items-center justify-center">
                          <i className="ri-calendar-check-line text-foreground-600"></i>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground-900">
                            Table {res.table_code}
                          </p>
                          <p className="text-xs text-foreground-500">
                            {new Date(res.created_at).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 border border-primary-200 font-medium whitespace-nowrap self-start sm:self-auto">
                        Completed
                      </span>
                    </div>

                    {/* Details */}
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex flex-wrap gap-4 text-xs text-foreground-600">
                        <span className="flex items-center gap-1">
                          <i className="ri-user-line text-foreground-400"></i>
                          {res.first_name} {res.last_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-calendar-line text-foreground-400"></i>
                          {res.reservation_date} at {res.reservation_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-group-line text-foreground-400"></i>
                          {res.guests} guests
                        </span>
                      </div>

                      {/* Linked Order */}
                      {res.linked_order && (
                        <div className="bg-background-100 rounded-lg px-3 py-2.5">
                          <p className="text-xs font-medium text-foreground-500 mb-1.5">
                            Order #{res.linked_order.id.slice(0, 8)}
                          </p>
                          <div className="space-y-1">
                            {res.linked_order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-foreground-700">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="text-foreground-900 font-medium">
                                  ₹{item.price * item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-background-200 flex justify-between text-xs">
                            <span className="text-foreground-500">Total</span>
                            <span className="text-foreground-900 font-semibold">
                              ₹{res.linked_order.total}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {res.feedback && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-primary-700 font-medium flex items-center gap-1">
                            <i className="ri-chat-1-line text-[10px]"></i> Your Feedback
                          </span>
                          <p className="text-xs text-foreground-700 mt-1 italic">
                            "{res.feedback}"
                          </p>
                        </div>
                      )}

                      {res.notes && (
                        <p className="text-xs text-foreground-400 italic">
                          Special requests: "{res.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Browse More */}
              <div className="mt-8 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  <i className="ri-restaurant-line"></i>
                  Make Another Reservation
                </Link>
              </div>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}