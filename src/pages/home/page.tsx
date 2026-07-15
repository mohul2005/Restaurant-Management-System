import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantTables } from "@/mocks/tables";
import FloatingFood from "@/components/feature/FloatingFood";

export default function Home() {
  const navigate = useNavigate();
  const [tableInput, setTableInput] = useState("");
  const [error, setError] = useState("");

  const scrollToTables = () => {
    document.getElementById("table-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTableSelect = (code: string) => {
    navigate(`/menu/${code}`);
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tableInput.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a table code");
      return;
    }
    const found = restaurantTables.find((t) => t.code === trimmed);
    if (found) {
      navigate(`/menu/${found.code}`);
    } else {
      setError("Table not found. Please check the code and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <FloatingFood />
      <section className="relative h-screen w-full overflow-hidden cursor-default">
        <div className="absolute inset-0 z-0 bg-background-950">
          <iframe
            src="https://my.spline.design/miroconferenceteaser-ckt7dtK5FhMh8EQchx7JuDwd/"
            title="3D Scene"
            frameBorder="0"
            className="w-full h-full block border-0 cursor-default"
            allow="autoplay; fullscreen; xr-spatial-tracking"
          />
        </div>

        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/20 to-black/95 pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center pointer-events-none">
          <p className="text-accent-300 text-xs sm:text-sm uppercase tracking-[0.3em] mb-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
            Est. 2026 — Fine Dining
          </p>
          <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards]" style={{ textShadow: '0 0 50px rgba(255,255,255,0.22), 0 0 100px rgba(255,255,255,0.10), 0 0 160px rgba(200,170,120,0.18)' }}>
            The Spice Kitchen
          </h1>
          <div className="mt-4 mx-auto h-[2px] w-0 bg-gradient-to-r from-transparent via-accent-400 to-transparent opacity-0 animate-[expandLine_1.2s_ease-out_0.9s_forwards]" />
          <p className="mt-5 text-white/60 text-lg sm:text-xl max-w-md opacity-0 animate-[fadeInUp_0.8s_ease-out_0.7s_forwards]">
            Where fire meets flavour
          </p>
        </div>

        <button
          onClick={scrollToTables}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer group opacity-0 animate-[fadeInUp_0.8s_ease-out_1s_forwards]"
        >
          <span className="text-white/50 text-xs tracking-wider uppercase group-hover:text-white/80 transition-colors">
            Scroll to explore
          </span>
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1 group-hover:border-white/50 transition-colors">
            <div className="w-1.5 h-2 rounded-full bg-white/50 animate-[pulseGentle_2s_ease-in-out_infinite]" />
          </div>
        </button>
      </section>

      <div className="relative z-20 py-3 md:py-4 bg-primary-600 overflow-hidden whitespace-nowrap border-y border-primary-500/30">
        <div className="inline-flex animate-[marqueeScroll_20s_linear_infinite]">
          <span className="inline-flex items-center gap-6 md:gap-10 px-6 md:px-10 text-white/90 font-label text-sm md:text-base tracking-wide uppercase">
            <span>Wood-Fire Grill</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Seasonal Tasting</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Craft Cocktails</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Private Dining</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Wood-Fire Grill</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Seasonal Tasting</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Craft Cocktails</span>
            <span className="text-accent-300">&#9670;</span>
            <span>Private Dining</span>
            <span className="text-accent-300">&#9670;</span>
          </span>
        </div>
      </div>

      <section className="relative z-10 bg-background-950 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <p className="text-accent-300 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="text-accent-300">&#9670;</span>
              Now Available
            </p>

            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              The Spice Kitchen,
              <br />
              <em className="text-accent-300">delivered</em> to your door.
            </h2>

            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              Our full menu — starters, mains, desserts, and drinks — available for ordering right from your table. Same live-fire cooking. Same bold spices.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/60 text-xs">
                <i className="ri-timer-line"></i>
                30–45 min service
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/60 text-xs">
                <i className="ri-wallet-3-line"></i>
                Pay at table
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/60 text-xs">
                <i className="ri-qr-code-line"></i>
                QR ordering
              </span>
            </div>

            <button
              onClick={scrollToTables}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Order Now
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          {/* Right Column — Step Cards */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/20 text-primary-400 shrink-0">
                <i className="ri-restaurant-line text-lg"></i>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Browse the Menu</p>
                <p className="text-white/40 text-xs mt-0.5">Pick from our full range of starters, mains, desserts and drinks.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/20 text-primary-400 shrink-0">
                <i className="ri-map-pin-line text-lg"></i>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Select Your Table</p>
                <p className="text-white/40 text-xs mt-0.5">Scan the QR code or enter your table code to get started.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-500/20 text-primary-400 shrink-0">
                <i className="ri-fire-line text-lg"></i>
              </div>
              <div>
                <p className="text-white font-medium text-sm">We Bring the Fire</p>
                <p className="text-white/40 text-xs mt-0.5">Place your order and we deliver it hot and fresh to your table.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="table-section" className="relative bg-background-50">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background-50 pointer-events-none" />

        <main className="flex flex-col items-center justify-center px-4 py-16 md:py-20">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground-900">
                Welcome
              </h2>
              <p className="mt-2 text-foreground-600 text-sm leading-relaxed max-w-md mx-auto">
                Select your table or scan the QR code at your table to view the menu and start ordering.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {restaurantTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table.code)}
                  className="flex flex-col items-center p-4 rounded-xl border border-background-300 bg-background-50 hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 rounded-lg bg-background-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <i className="ri-table-line text-3xl sm:text-4xl text-foreground-400 group-hover:text-primary-500 transition-colors"></i>
                  </div>
                  <span className="font-heading text-base font-semibold text-foreground-900 group-hover:text-primary-600">
                    {table.code}
                  </span>
                  <span className="text-xs text-foreground-500 mt-0.5">
                    {table.seats} seats
                  </span>
                </button>
              ))}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-background-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background-50 px-3 text-foreground-500">
                  or enter table code manually
                </span>
              </div>
            </div>

            <form onSubmit={handleManualEntry} className="space-y-3 max-w-sm mx-auto">
              <div>
                <label htmlFor="tableCode" className="block text-sm font-medium text-foreground-700 mb-1.5">
                  Table Code
                </label>
                <input
                  id="tableCode"
                  type="text"
                  value={tableInput}
                  onChange={(e) => {
                    setTableInput(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. T01"
                  className="w-full px-4 py-3 rounded-lg border border-background-300 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                  maxLength={5}
                />
                {error && (
                  <p className="mt-1.5 text-xs text-primary-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                View Menu
              </button>
            </form>

            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-foreground-400">
              <a href="/manager/login" className="hover:text-foreground-600 transition-colors">
                Manager Login
              </a>
              <span className="text-background-300">|</span>
              <a href="/kitchen/login" className="hover:text-foreground-600 transition-colors">
                Kitchen Login
              </a>
            </div>
          </div>
        </main>
      </section>

      <section id="contact" className="bg-background-50 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Heading */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-400" />
              <p className="text-accent-500 text-xs uppercase tracking-[0.2em]">Find Us</p>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground-950 leading-tight">
              Come say<br />
              <em className="text-accent-500">hello</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-8">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <i className="ri-map-pin-line text-lg text-primary-500"></i>
                </div>
                <div>
                  <p className="text-foreground-900 font-medium text-sm">Address</p>
                  <p className="text-foreground-600 text-sm mt-1 leading-relaxed">
                    45, Park Street,<br />
                    Kolkata — 700016
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <i className="ri-time-line text-lg text-primary-500"></i>
                </div>
                <div>
                  <p className="text-foreground-900 font-medium text-sm">Hours</p>
                  <p className="text-foreground-600 text-sm mt-1 leading-relaxed">
                    Lunch: 12:00 – 3:00 PM<br />
                    Dinner: 7:00 – 11:00 PM<br />
                    Closed Mondays
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <i className="ri-phone-line text-lg text-primary-500"></i>
                </div>
                <div>
                  <p className="text-foreground-900 font-medium text-sm">Phone</p>
                  <p className="text-foreground-600 text-sm mt-1">
                    +91 33 4567 8900
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <i className="ri-mail-line text-lg text-primary-500"></i>
                </div>
                <div>
                  <p className="text-foreground-900 font-medium text-sm">Email</p>
                  <p className="text-foreground-600 text-sm mt-1">
                    hello@spicekitchen.in
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 pt-4 border-t border-background-200">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="https://zomato.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  Zomato
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden border border-background-200 bg-background-100 h-[400px] md:h-[480px]">
              <iframe
                src="https://maps.google.com/maps?q=45+Park+Street,Kolkata,West+Bengal,India&hl=en&z=16&ie=UTF8&output=embed"
                title="Spice Kitchen Location"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
              {/* Map overlay card */}
              <div className="absolute bottom-4 left-4 right-4 bg-background-50 rounded-xl border border-background-200 p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-map-pin-fill text-primary-500 shrink-0 text-base"></i>
                  <p className="text-foreground-700 text-sm truncate">
                    45, Park Street, Kolkata
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps?q=45+Park+Street,Kolkata,West+Bengal,India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-foreground-300 text-foreground-700 rounded-md text-xs font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-950 py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 text-white font-heading text-lg font-semibold hover:text-white/80 transition-colors"
          >
            <i className="ri-fire-line text-accent-400 text-xl"></i>
            The Spice Kitchen
          </a>

          <p className="text-white/40 text-xs">
            &copy; 2026 The Spice Kitchen. All rights reserved.
          </p>

          <nav className="flex items-center gap-5">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white/40 hover:text-white/70 text-xs transition-colors cursor-pointer"
            >
              Home
            </button>
            <a
              href="/manager/login"
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Staff
            </a>
            <a
              href="/dining-history"
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Dining History
            </a>
            <button
              onClick={scrollToContact}
              className="text-white/40 hover:text-white/70 text-xs transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}