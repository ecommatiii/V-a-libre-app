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

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id,
