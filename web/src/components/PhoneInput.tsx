import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  code: string;   // ISO-2
  name: string;
  dial: string;   // e.g. "+51"
  flag: string;   // emoji
}

const COUNTRIES: Country[] = [
  { code: "PE", name: "Perú",          dial: "+51",  flag: "🇵🇪" },
  { code: "AR", name: "Argentina",     dial: "+54",  flag: "🇦🇷" },
  { code: "BO", name: "Bolivia",       dial: "+591", flag: "🇧🇴" },
  { code: "BR", name: "Brasil",        dial: "+55",  flag: "🇧🇷" },
  { code: "CL", name: "Chile",         dial: "+56",  flag: "🇨🇱" },
  { code: "CO", name: "Colombia",      dial: "+57",  flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica",    dial: "+506", flag: "🇨🇷" },
  { code: "EC", name: "Ecuador",       dial: "+593", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador",   dial: "+503", flag: "🇸🇻" },
  { code: "ES", name: "España",        dial: "+34",  flag: "🇪🇸" },
  { code: "GT", name: "Guatemala",     dial: "+502", flag: "🇬🇹" },
  { code: "HN", name: "Honduras",      dial: "+504", flag: "🇭🇳" },
  { code: "MX", name: "México",        dial: "+52",  flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua",     dial: "+505", flag: "🇳🇮" },
  { code: "PA", name: "Panamá",        dial: "+507", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay",      dial: "+595", flag: "🇵🇾" },
  { code: "DO", name: "Rep. Dom.",     dial: "+1",   flag: "🇩🇴" },
  { code: "UY", name: "Uruguay",       dial: "+598", flag: "🇺🇾" },
  { code: "US", name: "USA / Canadá",  dial: "+1",   flag: "🇺🇸" },
  { code: "VE", name: "Venezuela",     dial: "+58",  flag: "🇻🇪" },
];

interface PhoneInputProps {
  value: string;                        // full value e.g. "+51 999000000"
  onChange: (value: string) => void;
  placeholder?: string;
  defaultCountryCode?: string;          // ISO-2, defaults to "PE"
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "999 000 000",
  defaultCountryCode = "PE",
  className = "",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Parse stored value to extract dial code + number
  const parseValue = () => {
    const country = COUNTRIES.find((c) => value.startsWith(c.dial + " "));
    if (country) {
      return { country, number: value.slice(country.dial.length + 1) };
    }
    const def = COUNTRIES.find((c) => c.code === defaultCountryCode) ?? COUNTRIES[0];
    return { country: def, number: value };
  };

  const { country: selectedCountry, number } = parseValue();

  function selectCountry(c: Country) {
    onChange(number ? `${c.dial} ${number}` : "");
    setOpen(false);
    setSearch("");
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d\s\-]/g, "");
    onChange(raw ? `${selectedCountry.dial} ${raw}` : "");
  }

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = COUNTRIES.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-visible bg-white ${className}`}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-3 pr-2 py-2.5 border-r border-gray-200 hover:bg-gray-50 transition-colors shrink-0 rounded-l-lg"
      >
        <span className="text-lg leading-none">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-gray-600 tabular-nums">{selectedCountry.dial}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent rounded-r-lg min-w-0"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/60 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país..."
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    selectedCountry.code === c.code ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="text-lg leading-none w-6 text-center shrink-0">{c.flag}</span>
                  <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                  <span className={`text-sm tabular-nums shrink-0 ${selectedCountry.code === c.code ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                    {c.dial}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
