import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";
import { useOrder } from "@/store/OrderProvider";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/store/OrderContext";
import MenuManager from "@/pages/manager/dashboard/components/MenuManager";

interface Reservation {
  id: string;
  table_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: string;
  notes: string;
  order_id: string | null;
  status: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface TableGroup {
  table_code: string;
  reservation: Reservation | null;
  orders: Order[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval: { label: "Pending", color: "text-accent-700", bg: "bg-accent-50 border-accent-200" },
  approved: { label: "Approved", color: "text-secondary-700", bg: "bg-secondary-50 border-secondary-200" },
  awaiting_payment: { label: "Awaiting Payment", color: "text-secondary-700", bg: "bg-secondary-50 border-secondary-200" },
  paid: { label: "Paid", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
  preparing: { label: "Preparing", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
  ready: { label: "Ready", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
};

function elapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function ManagerDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscribeToAllOrders } = useOrder();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [upiInputs, setUpiInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [upiSaving, setUpiSaving] = useState<Record<string, boolean>>({});
  const [showArchive, setShowArchive] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "reservations" | "menu">("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/manager/login", { replace: true });
      return;
    }
    if (!user) return;

    const unsubscribe = subscribeToAllOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading, navigate, subscribeToAllOrders]);

  // Fetch reservations
  useEffect(() => {
    if (!user) return;
    const fetchReservations = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setReservations(data as Reservation[]);
    };

    fetchReservations();

    const channel = supabase
      .channel("all-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: string) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    if (error) console.error("Failed to update order:", error);
  }, []);

  // Approve order (pending -> approved)
  const handleApprove = useCallback((orderId: string) => {
    handleUpdateStatus(orderId, "approved");
  }, [handleUpdateStatus]);

  // Reject order
  const handleReject = useCallback((orderId: string) => {
    if (window.confirm("Reject this order? This cannot be undone.")) {
      handleUpdateStatus(orderId, "pending_approval");
    }
  }, [handleUpdateStatus]);

  // Send UPI handle and move to awaiting_payment (approved -> awaiting_payment)
  const handleSendUpi = useCallback(async (orderId: string) => {
    const handle = upiInputs[orderId]?.trim();
    if (!handle) return;
    setUpiSaving((prev) => ({ ...prev, [orderId]: true }));
    const { error } = await supabase
      .from("orders")
      .update({ upi_handle: handle, status: "awaiting_payment", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setUpiSaving((prev) => ({ ...prev, [orderId]: false }));
    if (error) console.error("Failed to save UPI handle:", error);
  }, [upiInputs]);

  // Confirm payment received (awaiting_payment -> paid)
  const handleConfirmPayment = useCallback((orderId: string) => {
    handleUpdateStatus(orderId, "paid");
  }, [handleUpdateStatus]);

  // Send to kitchen (paid -> preparing)
  const handleSendToKitchen = useCallback((orderId: string) => {
    handleUpdateStatus(orderId, "preparing");
  }, [handleUpdateStatus]);

  const handleLogout = async () => {
    await signOut();
    navigate("/manager/login", { replace: true });
  };

  if (authLoading || (loading && !orders.length && !reservations.length)) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-foreground-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const pendingOrders = orders.filter((o) => o.status === "pending_approval");
  const approvedOrders = orders.filter((o) => o.status === "approved");
  const awaitingPaymentOrders = orders.filter((o) => o.status === "awaiting_payment");
  const paidOrders = orders.filter((o) => o.status === "paid");
  const activeOrders = orders.filter((o) => o.status === "preparing");
  const completedOrders = orders.filter((o) => o.status === "ready");
  const nonArchiveOrders = orders.filter((o) => o.status !== "ready");

  // Build table groups: group reservations + orders by table_code
  const tableGroups: TableGroup[] = [];
  const allTableCodes = new Set<string>();

  reservations.forEach((r) => allTableCodes.add(r.table_code));
  orders.forEach((o) => allTableCodes.add(o.table_code));

  allTableCodes.forEach((code) => {
    const reservation = reservations.find((r) => r.table_code === code) || null;
    const tableOrders = orders.filter((o) => o.table_code === code);
    tableGroups.push({ table_code: code, reservation, orders: tableOrders });
  });

  // Sort: tables with pending orders first, then by most recent
  tableGroups.sort((a, b) => {
    const aPending = a.orders.some((o) => o.status === "pending_approval");
    const bPending = b.orders.some((o) => o.status === "pending_approval");
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    const aMax = Math.max(
      ...a.orders.map((o) => new Date(o.created_at).getTime()),
      a.reservation ? new Date(a.reservation.created_at).getTime() : 0
    );
    const bMax = Math.max(
      ...b.orders.map((o) => new Date(o.created_at).getTime()),
      b.reservation ? new Date(b.reservation.created_at).getTime() : 0
    );
    return bMax - aMax;
  });

  return (
    <div className="min-h-screen bg-background-50">
      {/* Header */}
      <header className="bg-background-950 border-b border-background-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <i className="ri-restaurant-2-line text-base text-background-50"></i>
            </div>
            <div>
              <h1 className="font-heading text-base font-semibold text-background-50 whitespace-nowrap">
                Manager Dashboard
              </h1>
              <p className="text-xs text-background-400 hidden sm:block">Orders &amp; reservations</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-background-900 rounded-full p-1">
            {(["overview", "orders", "reservations", "menu"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-background-800 text-background-50"
                    : "text-background-400 hover:text-background-200"
                }`}
              >
                {tab === "overview" ? "Overview" : tab === "orders" ? "Orders" : tab === "reservations" ? "Reservations" : "Menu"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-background-400 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-background-400 hover:text-background-200 px-3 py-1.5 rounded-lg border border-background-700 hover:bg-background-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-5">
        {activeTab === "menu" ? (
          <MenuManager />
        ) : activeTab === "reservations" ? (
          /* ── Reservations Tab ── */
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide">
              All Reservations ({reservations.length})
            </h2>
            {reservations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
                  <i className="ri-calendar-line text-2xl text-foreground-300"></i>
                </div>
                <p className="text-foreground-500 text-sm font-medium">No reservations yet</p>
                <p className="text-xs text-foreground-400 mt-1">Reservations made by customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    isExpanded={expandedReservation === res.id}
                    onToggle={() =>
                      setExpandedReservation(expandedReservation === res.id ? null : res.id)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "orders" ? (
          /* ── Orders Tab ── */
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Pending", count: pendingOrders.length, icon: "ri-time-line", bg: "bg-accent-50 border-accent-200", text: "text-accent-700" },
                { label: "Approved", count: approvedOrders.length, icon: "ri-check-double-line", bg: "bg-secondary-50 border-secondary-200", text: "text-secondary-700" },
                { label: "Awaiting Pay", count: awaitingPaymentOrders.length, icon: "ri-bank-card-line", bg: "bg-secondary-50 border-secondary-200", text: "text-secondary-700" },
                { label: "In Kitchen", count: activeOrders.length, icon: "ri-fire-line", bg: "bg-primary-50 border-primary-200", text: "text-primary-700" },
                { label: "Completed", count: completedOrders.length, icon: "ri-checkbox-circle-line", bg: "bg-primary-50 border-primary-200", text: "text-primary-700" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl border p-3 ${stat.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`${stat.icon} ${stat.text} text-sm`}></i>
                    <span className="text-xs text-foreground-500 font-medium">{stat.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.text}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {nonArchiveOrders.length === 0 && completedOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
                  <i className="ri-inbox-line text-2xl text-foreground-300"></i>
                </div>
                <p className="text-foreground-500 text-sm font-medium">No orders yet</p>
                <p className="text-xs text-foreground-400 mt-1">Orders placed by customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide">
                  Active Orders ({nonArchiveOrders.length})
                </h2>
                {nonArchiveOrders.map((order) => {
                  const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.pending_approval;
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-background-50 border border-background-200 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-background-100/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-foreground-700">{order.table_code}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground-900 truncate">
                              Table {order.table_code} &middot; {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-foreground-400">{elapsedTime(order.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">
                            ₹{order.total}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          <i
                            className={isExpanded ? "ri-arrow-up-s-line text-foreground-400 text-sm transition-transform" : "ri-arrow-down-s-line text-foreground-400 text-sm transition-transform"}
                          ></i>
                        </div>
                      </button>

                      {isExpanded && (
                        <OrderDetail
                          order={order}
                          actionLoading={actionLoading}
                          upiInputs={upiInputs}
                          upiSaving={upiSaving}
                          setUpiInputs={setUpiInputs}
                          handleApprove={handleApprove}
                          handleReject={handleReject}
                          handleSendUpi={handleSendUpi}
                          handleConfirmPayment={handleConfirmPayment}
                          handleSendToKitchen={handleSendToKitchen}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Completed Orders Archive */}
                {completedOrders.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowArchive(!showArchive)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-background-100 rounded-xl hover:bg-background-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <i className="ri-archive-line text-foreground-500"></i>
                        <span className="text-sm font-semibold text-foreground-600">
                          Completed Orders ({completedOrders.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-400">
                          ₹{completedOrders.reduce((sum, o) => sum + o.total, 0)} total
                        </span>
                        <i className={showArchive ? "ri-arrow-up-s-line text-foreground-400 transition-transform" : "ri-arrow-down-s-line text-foreground-400 transition-transform"}></i>
                      </div>
                    </button>
                    {showArchive && (
                      <div className="mt-2 space-y-2">
                        {completedOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-background-50 border border-background-200 rounded-xl px-4 py-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                                  <i className="ri-check-line text-primary-600"></i>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground-900">
                                    Table {order.table_code}
                                  </p>
                                  <p className="text-xs text-foreground-500">
                                    {order.items.map((i) => i.name).join(", ")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground-900">₹{order.total}</p>
                                <p className="text-xs text-foreground-400">
                                  #{order.id.slice(0, 8)} &middot; {new Date(order.created_at).toLocaleDateString("en-IN")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Overview Tab (default) ── */
          <div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Reservations", count: reservations.length, icon: "ri-calendar-check-line", bg: "bg-accent-50 border-accent-200", text: "text-accent-700" },
                { label: "Pending Orders", count: pendingOrders.length, icon: "ri-time-line", bg: "bg-accent-50 border-accent-200", text: "text-accent-700" },
                { label: "Awaiting Payment", count: awaitingPaymentOrders.length, icon: "ri-bank-card-line", bg: "bg-secondary-50 border-secondary-200", text: "text-secondary-700" },
                { label: "In Kitchen", count: activeOrders.length, icon: "ri-fire-line", bg: "bg-primary-50 border-primary-200", text: "text-primary-700" },
                { label: "Ready / Done", count: completedOrders.length, icon: "ri-checkbox-circle-line", bg: "bg-primary-50 border-primary-200", text: "text-primary-700" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl border p-3 ${stat.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`${stat.icon} ${stat.text} text-sm`}></i>
                    <span className="text-xs text-foreground-500 font-medium">{stat.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.text}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {tableGroups.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
                  <i className="ri-inbox-line text-2xl text-foreground-300"></i>
                </div>
                <p className="text-foreground-500 text-sm font-medium">No activity yet</p>
                <p className="text-xs text-foreground-400 mt-1">Orders and reservations will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide">
                  Tables ({tableGroups.length})
                </h2>
                {tableGroups.map((group) => (
                  <TableGroupCard
                    key={group.table_code}
                    group={group}
                    expandedOrder={expandedOrder}
                    setExpandedOrder={setExpandedOrder}
                    actionLoading={actionLoading}
                    upiInputs={upiInputs}
                    upiSaving={upiSaving}
                    setUpiInputs={setUpiInputs}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    handleSendUpi={handleSendUpi}
                    handleConfirmPayment={handleConfirmPayment}
                    handleSendToKitchen={handleSendToKitchen}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Reservation Card ── */
function ReservationCard({
  reservation,
  isExpanded,
  onToggle,
}: {
  reservation: Reservation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-background-100/50 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
            <i className="ri-calendar-line text-secondary-600 text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground-900 truncate">
              {reservation.first_name} {reservation.last_name} &middot; {reservation.guests} guests
            </p>
            <p className="text-xs text-foreground-400">
              {reservation.reservation_date} at {reservation.reservation_time} &middot; Table {reservation.table_code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
            reservation.status === 'completed'
              ? 'bg-primary-50 text-primary-700 border-primary-200'
              : 'bg-secondary-50 text-secondary-700 border-secondary-200'
          }`}>
            {reservation.status === 'completed' ? 'Completed' : 'Active'}
          </span>
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-secondary-50 text-secondary-700 border border-secondary-200">
            {elapsedTime(reservation.created_at)}
          </span>
          <i
            className={isExpanded ? "ri-arrow-up-s-line text-foreground-400 text-sm" : "ri-arrow-down-s-line text-foreground-400 text-sm"}
          ></i>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-background-100 pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-foreground-400">Email</span>
              <p className="text-foreground-900">{reservation.email}</p>
            </div>
            <div>
              <span className="text-xs text-foreground-400">Phone</span>
              <p className="text-foreground-900">{reservation.phone || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-foreground-400">Date &amp; Time</span>
              <p className="text-foreground-900">{reservation.reservation_date} at {reservation.reservation_time}</p>
            </div>
            <div>
              <span className="text-xs text-foreground-400">Guests</span>
              <p className="text-foreground-900">{reservation.guests}</p>
            </div>
          </div>
          {reservation.notes && (
            <div className="mt-3">
              <span className="text-xs text-foreground-400">Special Requests</span>
              <p className="text-sm text-foreground-700 mt-0.5">{reservation.notes}</p>
            </div>
          )}
          {reservation.feedback && (
            <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2.5">
              <span className="text-xs text-primary-700 font-medium flex items-center gap-1">
                <i className="ri-chat-1-line text-[10px]"></i> Customer Feedback
              </span>
              <p className="text-sm text-foreground-700 mt-1 italic">"{reservation.feedback}"</p>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-background-100 text-xs text-foreground-400">
            Reservation #{reservation.id.slice(0, 8)} &middot; {new Date(reservation.created_at).toLocaleString("en-IN")}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Table Group Card (Overview) ── */
function TableGroupCard({
  group,
  expandedOrder,
  setExpandedOrder,
  actionLoading,
  upiInputs,
  upiSaving,
  setUpiInputs,
  handleApprove,
  handleReject,
  handleSendUpi,
  handleConfirmPayment,
  handleSendToKitchen,
}: {
  group: TableGroup;
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
  actionLoading: Record<string, boolean>;
  upiInputs: Record<string, string>;
  upiSaving: Record<string, boolean>;
  setUpiInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleApprove: (orderId: string) => void;
  handleReject: (orderId: string) => void;
  handleSendUpi: (orderId: string) => void;
  handleConfirmPayment: (orderId: string) => void;
  handleSendToKitchen: (orderId: string) => void;
}) {
  const hasReservation = !!group.reservation;
  const pendingOrderCount = group.orders.filter((o) => o.status === "pending_approval").length;

  return (
    <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="px-4 py-3 bg-background-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-background-200 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground-700">{group.table_code}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground-900">Table {group.table_code}</p>
            <p className="text-xs text-foreground-500">
              {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}
              {hasReservation && " · Reserved"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasReservation && (
            <>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border flex items-center gap-1 ${
                group.reservation!.status === 'completed'
                  ? 'bg-primary-100 text-primary-700 border-primary-200'
                  : 'bg-accent-100 text-accent-700 border-accent-200'
              }`}>
                <i className={`${group.reservation!.status === 'completed' ? 'ri-checkbox-circle-line' : 'ri-calendar-check-line'} text-[10px]`}></i>
                {group.reservation!.first_name} {group.reservation!.last_name}
                {group.reservation!.status === 'completed' && (
                  <span className="text-[10px] ml-0.5">· Done</span>
                )}
              </span>
            </>
          )}
          {pendingOrderCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent-50 text-accent-700 border border-accent-200 font-medium">
              {pendingOrderCount} pending
            </span>
          )}
        </div>
      </div>

      {/* Reservation Info (if exists) */}
      {hasReservation && (
        <div className="px-4 py-3 border-b border-background-100 bg-accent-50/30">
          <div className="flex flex-wrap gap-4 text-xs text-foreground-600">
            <span className="flex items-center gap-1">
              <i className="ri-user-line text-foreground-400"></i>
              {group.reservation!.first_name} {group.reservation!.last_name}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-phone-line text-foreground-400"></i>
              {group.reservation!.phone || "—"}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-calendar-line text-foreground-400"></i>
              {group.reservation!.reservation_date} at {group.reservation!.reservation_time}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-group-line text-foreground-400"></i>
              {group.reservation!.guests} guests
            </span>
          </div>
          {group.reservation!.notes && (
            <p className="mt-1.5 text-xs text-foreground-500 italic">
              "{group.reservation!.notes}"
            </p>
          )}
          {group.reservation!.feedback && (
            <div className="mt-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
              <span className="text-xs text-primary-700 font-medium flex items-center gap-1">
                <i className="ri-chat-1-line text-[10px]"></i> Customer Feedback
              </span>
              <p className="text-xs text-foreground-700 mt-1 italic">"{group.reservation!.feedback}"</p>
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {group.orders.length === 0 ? (
        <div className="px-4 py-4 text-center text-xs text-foreground-400">
          No orders placed yet
        </div>
      ) : (
        <div className="divide-y divide-background-100">
          {group.orders
            .filter((o) => o.status !== "ready")
            .map((order) => {
              const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.pending_approval;
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id}>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-background-100/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-sm text-foreground-700">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} · ₹{order.total}
                      </span>
                      <span className="text-xs text-foreground-400">{elapsedTime(order.created_at)}</span>
                    </div>
                    <i
                      className={isExpanded ? "ri-arrow-up-s-line text-foreground-400 text-sm" : "ri-arrow-down-s-line text-foreground-400 text-sm"}
                    ></i>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3">
                      <OrderDetail
                        order={order}
                        actionLoading={actionLoading}
                        upiInputs={upiInputs}
                        upiSaving={upiSaving}
                        setUpiInputs={setUpiInputs}
                        handleApprove={handleApprove}
                        handleReject={handleReject}
                        handleSendUpi={handleSendUpi}
                        handleConfirmPayment={handleConfirmPayment}
                        handleSendToKitchen={handleSendToKitchen}
                      />
                    </div>
                  )}
                </div>
              );
            })}

          {/* Completed orders */}
          {group.orders.some((o) => o.status === "ready") && (
            <div className="px-4 py-2 text-xs text-foreground-400 flex items-center gap-2">
              <i className="ri-checkbox-circle-line text-primary-500"></i>
              {group.orders.filter((o) => o.status === "ready").length} completed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Order Detail (shared between views) ── */
function OrderDetail({
  order,
  actionLoading,
  upiInputs,
  upiSaving,
  setUpiInputs,
  handleApprove,
  handleReject,
  handleSendUpi,
  handleConfirmPayment,
  handleSendToKitchen,
}: {
  order: Order;
  actionLoading: Record<string, boolean>;
  upiInputs: Record<string, string>;
  upiSaving: Record<string, boolean>;
  setUpiInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleApprove: (orderId: string) => void;
  handleReject: (orderId: string) => void;
  handleSendUpi: (orderId: string) => void;
  handleConfirmPayment: (orderId: string) => void;
  handleSendToKitchen: (orderId: string) => void;
}) {
  const isPending = order.status === "pending_approval";
  const isApproved = order.status === "approved";
  const isAwaitingPayment = order.status === "awaiting_payment";
  const isPaid = order.status === "paid";
  const isPreparing = order.status === "preparing";

  return (
    <div className="pt-2 border-t border-background-100">
      {/* Items */}
      <div className="mb-3">
        <p className="text-xs font-medium text-foreground-500 mb-2">Order Items</p>
        <div className="space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-foreground-700">
                {item.name} <span className="text-foreground-400">x{item.quantity}</span>
              </span>
              <span className="text-foreground-900 font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-background-100 space-y-0.5">
          <div className="flex justify-between text-xs text-foreground-500">
            <span>Subtotal</span><span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-xs text-foreground-500">
            <span>Tax + Service</span><span>₹{order.tax + order.service_charge}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-foreground-900 pt-1 border-t border-background-100">
            <span>Total</span><span>₹{order.total}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-foreground-400 mb-3">
        Order #{order.id.slice(0, 8)} &middot; {new Date(order.created_at).toLocaleString("en-IN")}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* PENDING APPROVAL */}
        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(order.id)}
              disabled={actionLoading[order.id]}
              className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {actionLoading[order.id] ? "Processing..." : "Approve Order"}
            </button>
            <button
              onClick={() => handleReject(order.id)}
              disabled={actionLoading[order.id]}
              className="px-4 py-2 border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              Reject
            </button>
          </div>
        )}

        {/* APPROVED — send UPI */}
        {isApproved && (
          <div>
            <p className="text-xs font-medium text-foreground-500 mb-2">
              Step 2: Send UPI Payment Handle
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. restaurant@upi"
                value={upiInputs[order.id] ?? ""}
                onChange={(e) =>
                  setUpiInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                }
                className="flex-1 px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
              />
              <button
                onClick={() => handleSendUpi(order.id)}
                disabled={upiSaving[order.id] || !(upiInputs[order.id] ?? "").trim()}
                className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {upiSaving[order.id] ? "Saving..." : "Send UPI"}
              </button>
            </div>
            <p className="text-xs text-foreground-400 mt-1.5">
              Enter the UPI handle and click Send. The customer will see it on their screen and can complete payment.
            </p>
          </div>
        )}

        {/* AWAITING PAYMENT */}
        {isAwaitingPayment && (
          <div className="space-y-3">
            {order.upi_handle && (
              <div className="bg-secondary-50 border border-secondary-200 rounded-lg px-3 py-2">
                <p className="text-xs text-foreground-500">UPI Handle Sent</p>
                <p className="text-sm font-mono font-semibold text-foreground-900">{order.upi_handle}</p>
              </div>
            )}
            <button
              onClick={() => handleConfirmPayment(order.id)}
              disabled={actionLoading[order.id]}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {actionLoading[order.id] ? "Processing..." : "Confirm Payment Received"}
            </button>
            <p className="text-xs text-foreground-400">
              Only click this after the customer has completed the UPI transfer.
            </p>
          </div>
        )}

        {/* PAID — send to kitchen */}
        {isPaid && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-foreground-500 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
              <i className="ri-check-line text-primary-600"></i>
              <span>Payment confirmed. Ready for kitchen.</span>
            </div>
            <button
              onClick={() => handleSendToKitchen(order.id)}
              disabled={actionLoading[order.id]}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {actionLoading[order.id] ? "Processing..." : "Send to Kitchen"}
            </button>
          </div>
        )}

        {/* PREPARING — info only, kitchen handles ready */}
        {isPreparing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-foreground-500 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
              <i className="ri-fire-line text-primary-600"></i>
              <span>Sent to kitchen. Kitchen staff is preparing this order.</span>
            </div>
            <p className="text-xs text-foreground-400">
              The kitchen display will notify you when the order is marked ready.
            </p>
          </div>
        )}

        {/* READY */}
        {order.status === "ready" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-foreground-500 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
              <i className="ri-restaurant-line text-primary-600"></i>
              <span>Order is ready to be served to the table.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}