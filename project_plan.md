## 1. Project Description
A restaurant management web app with three user roles (Customer, Manager, Kitchen Staff). Each restaurant table has a unique code. Customers scan a QR code to access the digital menu, place orders, and make UPI payments. Orders go through an approval workflow: Customer → Manager (Approve/Reject) → Payment → Kitchen (Prepare/Serve).

## 2. Page Structure
- `/` - Table Selection / Landing page
- `/menu/:tableCode` - Customer digital menu (mobile-first)
- `/cart/:tableCode` - Customer cart
- `/order-status/:tableCode/:orderId` - Customer order tracking
- `/manager/login` - Manager login
- `/manager/dashboard` - Manager dashboard (all active tables & orders)
- `/manager/order/:orderId` - Manager order detail with approve/reject
- `/kitchen/login` - Kitchen staff login
- `/kitchen/dashboard` - Kitchen order queue

## 3. Core Features
- [x] Table-based ordering system (unique table codes)
- [x] Digital menu with categories (Starters, Main Course, Beverages, Desserts)
- [x] Shopping cart per table session
- [x] Order placement to Supabase with real-time status tracking
- [x] Order status page with live updates via Supabase Realtime
- [ ] Order approval workflow (Manager approves/rejects)
- [ ] UPI payment flow (manager sets UPI handle, customer views it)
- [ ] Kitchen order queue with status updates (Preparing / Ready to Serve)
- [ ] Role-based dashboards (Manager & Kitchen)
- [x] Color-coded status indicators

## 4. Data Model (Supabase)
### Table: menu_items
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | Item name |
| description | text | Item description |
| price | integer | Item price in INR |
| category | text | Category (Starters/Main Course/Beverages/Desserts) |
| image | text | Image URL |
| is_veg | boolean | Veg indicator |
| spice_level | integer | Spice level 0-5 |
| available | boolean | Availability |
| created_at | timestamptz | Creation time |

### Table: orders
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| table_code | text | Table identifier |
| items | jsonb | Order items array |
| subtotal | integer | Subtotal in INR |
| tax | integer | Tax amount |
| service_charge | integer | Service charge |
| total | integer | Total amount |
| status | text | pending_approval/approved/awaiting_payment/paid/preparing/ready |
| upi_handle | text | UPI payment handle |
| created_at | timestamptz | Order time |
| updated_at | timestamptz | Last modified |

## 5. Backend / Third-party Integration
- Supabase: Real-time order updates, data persistence ✅ CONNECTED
- RLS: Public can read menu_items and insert/read orders; authenticated manager/kitchen can update

## 6. Development Phase Plan

### Phase 1: Customer Menu & Cart Pages ✅ DONE
### Phase 2: Order Status & Supabase Integration ✅ DONE
- Real-time order tracking via Supabase Realtime
- Order status progress with color-coded steps

### Phase 3: Manager Dashboard ✅ DONE
- Manager login, dashboard with live order list, approve/reject, UPI handle

### Phase 4: Kitchen Dashboard ✅ DONE
- Kitchen login, order queue, Preparing/Ready status controls