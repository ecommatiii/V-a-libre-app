import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Cpu,
  Building2,
  Package,
  Coins,
  Sparkles,
  Newspaper,
  Info,
  RefreshCw,
  AlertCircle,
  Calendar,
  LineChart,
} from "lucide-react";

// URL of your Render backend. In development you can point to http://localhost:3001.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://vialibre-backend.onrender.com";

const CATEGORIES = [
  { id: "todas", label: "All", Icon: Newspaper },
  { id: "tecnologia", label: "Technology", Icon: Cpu },
  { id: "inmobiliario", label: "Real Estate", Icon: Building2 },
  { id: "materias-primas", label: "Commodities", Icon: Package },
  { id: "divisas", label: "Currencies", Icon: Coins },
  { id: "estetica", label: "Beauty & Personal Care", Icon: Sparkles },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const IMPACT_CONFIG = {
  high: { label: "High impact", text: "text-rose-400", dot: "bg-rose-500" },
  medium: { label: "Medium impact", text: "text-amber-400", dot: "bg-amber-400" },
  low: { label: "Low impact", text: "text-emerald-400", dot: "bg-emerald-500" },
};

function zoneFromScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return "nodata";
  if (score < 34) return "red";
  if (score < 67) return "amber";
  return "green";
}

const ZONE_CONFIG = {
  red: { label: "Caution", text: "text-rose-400", bar: "bg-rose-500", Icon: TrendingDown },
  amber: { label: "Neutral", text: "text-amber-400", bar: "bg-amber-400", Icon: Minus },
  green: { label: "Opportunity", text: "text-emerald-400", bar: "bg-emerald-500", Icon: TrendingUp },
  nodata: { label: "No data", text: "text-slate-500", bar: "bg-slate-600", Icon: Minus },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Prevents a request from hanging forever.
async function fetchJson(url, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Response ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function Semaforo({ score }) {
  const zone = zoneFromScore(score);
  const config = ZONE_CONFIG[zone];
  const zones = ["red", "amber", "green"];

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5">
        {zones.map((z) => {
          const active = z === zone;
          return (
            <div
              key={z}
              className={`flex-1 rounded-full transition-all duration-300 ${
                active ? "h-3 opacity-100" : "h-1.5 opacity-20"
              } ${ZONE_CONFIG[z].bar}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${config.text}`}>
          <config.Icon size={13} />
          {config.label}
        </span>
        <span className="font-data text-xs text-slate-500">
          {score === null || score === undefined ? "—" : `${score}/100`}
        </span>
      </div>
    </div>
  );
}

function NewsCard({ item }) {
  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.todas;
  return (
    <article className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        <cat.Icon size={13} />
        <span className="text-xs font-medium uppercase tracking-wide">{cat.label}</span>
      </div>
      <h3 className="font-display text-xl font-bold leading-tight text-slate-100">{item.title}</h3>
      <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
      <div className="mt-3 font-data text-xs text-slate-500">
        {item.source} · {timeAgo(item.time)}
      </div>
      <Semaforo score={item.score} />
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 h-3 w-24 rounded bg-slate-800" />
      <div className="mb-2 h-5 w-full rounded bg-slate-800" />
      <div className="mb-4 h-5 w-2/3 rounded bg-slate-800" />
      <div className="h-3 w-full rounded bg-slate-800" />
      <div className="mt-2 h-3 w-4/5 rounded bg-slate-800" />
      <div className="mt-5 h-3 w-full rounded bg-slate-800" />
    </div>
  );
}

const CHART_PRESETS = [
  { label: "Gold", symbol: "TVC:GOLD" },
  { label: "Oil", symbol: "TVC:USOIL" },
  { label: "EUR/USD", symbol: "OANDA:EURUSD" },
  { label: "Bitcoin", symbol: "BINANCE:BTCUSDT" },
  { label: "S&P 500", symbol: "AMEX:SPY" },
  { label: "Nasdaq", symbol: "NASDAQ:QQQ" },
];

// Carga el script de TradingView una sola vez y monta el widget cuando cambia el símbolo.
function TradingViewWidget({ symbol }) {
  const hostRef = useRef(null);
  const widgetIdRef = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!symbol || !hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = "";
    const target = document.createElement("div");
    target.id = widgetIdRef.current;
    target.style.height = "100%";
    host.appendChild(target);

    const buildWidget = () => {
      if (!host.isConnected || !window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0f172a",
        enable_publishing: false,
        studies: ["MASimple@tv-basicstudies"],
        container_id: widgetIdRef.current,
      });
    };

    if (window.TradingView) {
      buildWidget();
    } else {
      let script = document.getElementById("tradingview-widget-script");
      if (!script) {
        script = document.createElement("script");
        script.id = "tradingview-widget-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", buildWidget, { once: true });
    }
  }, [symbol]);

  return <div ref={hostRef} className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900" />;
}

function LiveChart() {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [query, setQuery] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  const resolveSymbol = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setResolving(true);
    setResolveError(null);
    try {
      const data = await fetchJson(`${BACKEND_URL}/api/resolve-symbol?q=${encodeURIComponent(q)}`);
      if (!data || !data.symbol) {
        setResolveError("No match found for that company.");
        return;
      }
      setSymbol(data.symbol);
    } catch {
      setResolveError("Couldn't look that up. Please try again.");
    } finally {
      setResolving(false);
    }
  }, [query]);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-slate-100">
        <LineChart size={16} className="text-amber-400" />
        Live Chart
      </h2>

      <div className="relative mb-2">
        <button
          onClick={resolveSymbol}
          aria-label="Look up symbol"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <Search size={16} />
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") resolveSymbol();
          }}
          placeholder="Type a company (e.g. Tesla) and press Enter"
          aria-label="Search a company for the chart"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {resolving && <p className="mb-2 text-xs text-slate-500">Looking up symbol…</p>}
      {resolveError && <p className="mb-2 text-xs text-rose-400">{resolveError}</p>}

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CHART_PRESETS.map((p) => (
          <button
            key={p.symbol}
            onClick={() => setSymbol(p.symbol)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              symbol === p.symbol ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <TradingViewWidget symbol={symbol} />
      <p className="mt-2 text-xs text-slate-600">Chart powered by TradingView.</p>
    </section>
  );
}

function EconCalendar({ events, loading, error, onRetry }) {
  if (error && error.hidden) return null; // not configured on the backend: hide the section quietly

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-slate-100">
        <Calendar size={16} className="text-amber-400" />
        US Economic Calendar
      </h2>

      {error ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-6 text-center">
          <AlertCircle size={18} className="text-rose-400" />
          <p className="text-xs text-slate-400">{error.message}</p>
          <button onClick={onRetry} className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="animate-pulse divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-3 w-16 shrink-0 rounded bg-slate-800" />
              <div className="h-3 flex-1 rounded bg-slate-800" />
              <div className="h-3 w-20 shrink-0 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-6 text-center text-xs text-slate-500">
          No upcoming events found.
        </p>
      ) : (
        <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
          {events.map((e, i) => {
            const impact = IMPACT_CONFIG[e.importance] || IMPACT_CONFIG.medium;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-16 shrink-0 font-data text-xs text-slate-500">
                  {e.date}
                  <br />
                  {e.time}
                </div>
                <div className="flex-1 text-sm text-slate-200">{e.event}</div>
                <span className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${impact.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${impact.dot}`} />
                  {impact.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("todas");
  const [query, setQuery] = useState("");
  const [news, setNews] = useState([]);
  const [tickers, setTickers] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorNews, setErrorNews] = useState(null);
  const [econEvents, setEconEvents] = useState([]);
  const [loadingEcon, setLoadingEcon] = useState(true);
  const [errorEcon, setErrorEcon] = useState(null);
  const latestRequestRef = useRef("todas");

  const loadNews = useCallback(async (category) => {
    latestRequestRef.current = category;
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const data = await fetchJson(`${BACKEND_URL}/api/news?category=${category}`);
      if (latestRequestRef.current !== category) return;
      setNews(data);
    } catch (err) {
      if (latestRequestRef.current !== category) return;
      setErrorNews(
        err.name === "AbortError"
          ? "The request took too long. Check your connection or try again."
          : "Couldn't load news. Check that the backend is up and running."
      );
      setNews([]);
    } finally {
      if (latestRequestRef.current === category) setLoadingNews(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    latestRequestRef.current = "search";
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const data = await fetchJson(`${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}`);
      if (latestRequestRef.current !== "search") return;
      setNews(data);
      if (data.length === 0) setErrorNews(null);
    } catch (err) {
      if (latestRequestRef.current !== "search") return;
      setErrorNews("Couldn't get results for your search. Please try again.");
      setNews([]);
    } finally {
      if (latestRequestRef.current === "search") setLoadingNews(false);
    }
  }, [query]);

  const loadTickers = useCallback(async () => {
    try {
      const data = await fetchJson(`${BACKEND_URL}/api/tickers`);
      setTickers(data);
    } catch {
      setTickers([]);
    }
  }, []);

  const loadEconCalendar = useCallback(async () => {
    setLoadingEcon(true);
    setErrorEcon(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/economic-calendar`);
      if (res.status === 501) {
        // Not configured on the backend (missing ANTHROPIC_API_KEY) -> hide the section quietly.
        setErrorEcon({ hidden: true });
        return;
      }
      if (!res.ok) throw new Error(`Response ${res.status}`);
      const data = await res.json();
      setEconEvents(data);
    } catch (err) {
      setErrorEcon({ message: "Couldn't load the economic calendar. Please try again." });
      setEconEvents([]);
    } finally {
      setLoadingEcon(false);
    }
  }, []);

  useEffect(() => {
    loadNews(activeCategory);
  }, [activeCategory, loadNews]);

  useEffect(() => {
    loadTickers();
    loadEconCalendar();
  }, [loadTickers, loadEconCalendar]);

  const handleRefresh = () => {
    loadNews(activeCategory);
    loadTickers();
    loadEconCalendar();
  };

  return (
    <div className="min-h-screen bg-slate-950 font-body text-slate-100">
      <header className="sticky top-0 z-10 bg-slate-950">
        <div className="overflow-hidden border-b border-slate-800 bg-slate-900">
          {tickers.length > 0 ? (
            <div className="ticker-track flex w-max gap-8 px-4 py-2">
              {[...tickers, ...tickers].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap font-data text-xs">
                  <span className="font-semibold text-slate-200">{t.label}</span>
                  {t.dir === "up" ? (
                    <ArrowUp size={12} className="text-emerald-500" />
                  ) : (
                    <ArrowDown size={12} className="text-rose-500" />
                  )}
                  <span className={t.dir === "up" ? "text-emerald-500" : "text-rose-500"}>{t.change}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 font-data text-xs text-slate-600">Loading quotes…</div>
          )}
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold leading-none tracking-tight">VíaLibre</h1>
              <p className="text-xs text-slate-400">Market news, take a look</p>
            </div>
            <button
              onClick={handleRefresh}
              aria-label="Refresh data"
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <RefreshCw size={13} className={loadingNews ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="relative mt-4">
            <button
              onClick={runSearch}
              aria-label="Search"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <Search size={16} />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="Search a company or topic and press Enter"
              aria-label="Search news"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => {
              const active = c.id === activeCategory;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    active ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <c.Icon size={13} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <p>
            Headlines and quotes from Finnhub. The signal bar reflects each company's price move today
            (when available) and is not financial advice.
          </p>
        </div>
      </div>

      <LiveChart />

      <EconCalendar events={econEvents} loading={loadingEcon} error={errorEcon} onRetry={loadEconCalendar} />

      <main className="mx-auto max-w-6xl px-4 py-5">
        {errorNews ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-12 text-center">
            <AlertCircle size={22} className="text-rose-400" />
            <p className="max-w-md text-sm text-slate-400">{errorNews}</p>
            <button onClick={handleRefresh} className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950">
              Retry
            </button>
          </div>
        ) : loadingNews ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No news found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-slate-600">
        VíaLibre · live data via Finnhub
      </footer>
    </div>
  );
}
