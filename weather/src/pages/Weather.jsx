import React, { useEffect, useState, useRef } from "react";
import { Search, Wind, Droplets, Thermometer, CloudRain, ChevronDown, Check, MapPin } from "lucide-react";

// --- API CONFIG ---
const API_KEY = '05b78b88899f4e64b6e93021251112';

export default function WeatherDashboard() {
  // --- STATE ---
  const [query, setQuery] = useState("Hanoi");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Dropdown States
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef(null);

  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const dayDropdownRef = useRef(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Settings State
  const [units, setUnits] = useState({
    temp: "C",    // C or F
    wind: "km/h", // km/h or mph
    precip: "mm"  // mm or in
  });

  // --- EFFECT: Close Dropdowns on Click Outside ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setIsUnitDropdownOpen(false);
      }
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) {
        setIsDayDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- API CALLS ---
  const fetchWeather = async (q) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDayIndex(0);
      setShowSuggestions(false);

      // Fetch API (weatherapi.com used in your original)
      const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(q)}&days=7&aqi=no&alerts=no`);

      if (!res.ok) {
        throw new Error("No search result found!");
      }

      const data = await res.json();
      setWeather(data);
      setQuery(q);
    } catch (err) {
      setWeather(null);
      setError("No search result found!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${text}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Search hint error", err);
    }
  };

  // Initial Load
  useEffect(() => { fetchWeather(query); }, []); // eslint-disable-line

  // --- HANDLERS ---
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    fetchWeather(searchInput);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    fetchSuggestions(value);
  };

  const handleSelectSuggestion = (locationName) => {
    setSearchInput(locationName);
    fetchWeather(locationName);
  };

  const changeUnit = (type, value) => setUnits(prev => ({ ...prev, [type]: value }));

  // --- FORMAT HELPERS ---
  const formatDateFull = (dateStr) => {
    if (!dateStr) return "";
    // weatherapi localtime is like "2025-08-05 15:00"
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };
  const formatTime = (timeEpoch) => {
    if (!timeEpoch) return "";
    return new Date(timeEpoch * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  };
  const getDisplayDayName = (dateStr, index) => {
    if (index === 0) return "Today";
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  };

  // --- DATA PREPARATION (Safe Access) ---
  const current = weather?.current;
  const location = weather?.location;
  const forecast = weather?.forecast;

  const displayTemp = current ? Math.round(units.temp === "C" ? current.temp_c : current.temp_f) : 0;
  const displayFeelsLike = current ? Math.round(units.temp === "C" ? current.feelslike_c : current.feelslike_f) : 0;
  const displayWind = current ? (units.wind === "km/h" ? `${current.wind_kph} km/h` : `${current.wind_mph} mph`) : "";
  const displayPrecip = current ? (units.precip === "mm" ? `${current.precip_mm} mm` : `${current.precip_in} in`) : "";

  return (
    <div className="min-h-screen bg-[#0B0C1E] text-white font-sans pb-12">
      <div className="max-w-[1300px] mx-auto p-4 md:p-8">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-6 md:mb-10">
          <div className="flex items-center gap-3">
            <img src="/src/assets/images/logo.svg" alt="Weather Now" className="w-8 h-8" />
            <span className="text-white font-semibold text-lg md:text-xl">Weather Now</span>
          </div>

          {/* UNITS DROPDOWN */}
          <div className="relative" ref={unitDropdownRef}>
            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isUnitDropdownOpen
                ? "bg-[#2a384b] text-white"
                : "bg-[#202B3B] text-gray-200 hover:bg-[#2a384b]"
                }`}
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
            >
              <img src="/src/assets/images/icon-units.svg" alt="Units Icon" className="w-4 h-4" />
              Units
              <ChevronDown size={14} />
            </button>

            {isUnitDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#202B3B] rounded-xl p-3 shadow-2xl border border-white/5 z-50">
                <div className="mb-3 pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white block px-2 mb-2">Global Switch</span>
                  <div className="space-y-1">
                    <UnitOption label="Metric System" isActive={units.temp === 'C' && units.wind === 'km/h'} onClick={() => setUnits({ temp: 'C', wind: 'km/h', precip: 'mm' })} />
                    <UnitOption label="Imperial System" isActive={units.temp === 'F' && units.wind === 'mph'} onClick={() => setUnits({ temp: 'F', wind: 'mph', precip: 'in' })} />
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block px-2">Temperature</span>
                  <div className="space-y-1">
                    <UnitOption label="Celsius (°C)" isActive={units.temp === 'C'} onClick={() => changeUnit('temp', 'C')} />
                    <UnitOption label="Fahrenheit (°F)" isActive={units.temp === 'F'} onClick={() => changeUnit('temp', 'F')} />
                  </div>
                </div>

                <div className="h-px bg-white/10 my-2"></div>

                <div className="mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block px-2">Wind Speed</span>
                  <div className="space-y-1">
                    <UnitOption label="km/h" isActive={units.wind === 'km/h'} onClick={() => changeUnit('wind', 'km/h')} />
                    <UnitOption label="mph" isActive={units.wind === 'mph'} onClick={() => changeUnit('wind', 'mph')} />
                  </div>
                </div>

                <div className="h-px bg-white/10 my-2"></div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block px-2">Precipitation</span>
                  <div className="space-y-1">
                    <UnitOption label="Millimeters (mm)" isActive={units.precip === 'mm'} onClick={() => changeUnit('precip', 'mm')} />
                    <UnitOption label="Inches (in)" isActive={units.precip === 'in'} onClick={() => changeUnit('precip', 'in')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* TITLE & SEARCH */}
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-center leading-tight tracking-tight">
            How’s the sky <br className="block md:hidden" /> looking today?
          </h1>

          <div className="w-full max-w-[900px] relative" ref={searchRef}>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <form onSubmit={handleSearchSubmit} className="w-full relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400 group-focus-within:text-[#5E7CE2] transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleInputChange}
                  placeholder="Search for a place..."
                  className="w-full bg-[#1E2633] text-white py-4 pl-14 pr-4 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#5E7CE2] placeholder-gray-500 transition shadow-lg text-base md:text-lg"
                />
              </form>

              <button
                onClick={handleSearchSubmit}
                className="w-full md:w-auto bg-[#5E7CE2] hover:bg-[#4b63b6] text-white px-6 py-3 rounded-2xl font-medium transition-all shadow-lg text-sm"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-3 bg-[#202B3B] rounded-xl border border-white/5 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                {suggestions.map((item) => (
                  <li
                    key={item.id || `${item.name}-${item.country}`}
                    onClick={() => handleSelectSuggestion(item.name)}
                    className="px-4 py-3 hover:bg-[#2C2C42] cursor-pointer flex items-center gap-3 text-sm text-gray-200 border-b border-white/5 last:border-0"
                  >
                    <MapPin size={16} className="text-gray-500" />
                    <span>
                      <span className="font-semibold text-white">{item.name}</span>, {item.country}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* MAIN */}
        {!loading && error ? (
          <div className="flex flex-col items-center justify-start pt-10 md:pt-20 min-h-[50vh] animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold text-gray-200">No search result found!</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-0">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-10">

              {/* MAIN WEATHER CARD */}
            <div
              className="relative rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden min-h-[350px] 
                        bg-gradient-to-br from-[#4b63b6] to-[#6f4ad6] text-white flex items-center justify-between"
              style={{
                backgroundImage: (!loading && weather?.location)
                  ? "url('/src/assets/images/bg-today-large.svg')"
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#202B3B] z-20 rounded-[2.5rem]">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
                    <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></span>
                    <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></span>
                  </div>
                  <p className="text-gray-200 font-medium">Loading...</p>
                </div>
              ) : (
                <>
                  {/* LEFT TEXT BLOCK */}
                  <div className="relative z-10 flex flex-col">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-wide">
                      {location?.name}, {location?.country}
                    </h2>
                    <p className="text-white/80 text-lg md:text-xl font-medium mt-2">
                      {formatDateFull(location?.localtime)}
                    </p>
                  </div>

                  {/* RIGHT ICON + TEMPERATURE */}
                  <div className="relative z-10 flex items-center gap-4 md:gap-6">
                    <img
                      src={current ? `https:${current.condition.icon}` : "/src/assets/images/icon-sunny.webp"}
                      alt="condition"
                      className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-md"
                    />

                    <span className="text-[4.5rem] md:text-[6rem] leading-none font-extrabold drop-shadow-sm italic">
                      {displayTemp}°
                    </span>
                  </div>
                </>
              )}
            </div>
              {/* STATS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Feels Like"       value={!loading && weather ? `${displayFeelsLike}°` : "—"} />
                <StatCard label="Humidity"         value={!loading && weather ? `${current?.humidity}%` : "—"} />
                <StatCard label="Wind"             value={!loading && weather ? displayWind : "—"} />
                <StatCard label="Precipitation"    value={!loading && weather ? displayPrecip : "—"} />
              </div>
              {/* DAILY FORECAST */}
              <div className="bg-[#161625] rounded-[2rem] p-6 border border-white/5">
                <h3 className="text-lg font-bold mb-4 text-gray-200 flex items-center gap-2">Daily forecast</h3>

                <div className="grid grid-cols-3 gap-4 md:grid-cols-7">
                  {loading || !weather ? (
                    Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="bg-[#202B3B] rounded-2xl h-32 animate-pulse border border-white/5"></div>
                    ))
                  ) : (
                    forecast?.forecastday.map((day, index) => (
                      <div key={index} className="bg-[#202B3B] rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-white/5">
                        <span className="text-xs text-gray-400 font-bold uppercase">{getDayName(day.date)}</span>
                        <img src={`https:${day.day.condition.icon}`} alt="icon" className="w-10 h-10 object-contain" />
                        <div className="flex flex-col items-center text-sm font-semibold">
                          <span className="text-white">{Math.round(units.temp === "C" ? day.day.maxtemp_c : day.day.maxtemp_f)}°</span>
                          <span className="text-xs text-gray-500">{Math.round(units.temp === "C" ? day.day.mintemp_c : day.day.mintemp_f)}°</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (HOURLY) */}
            <div className="lg:col-span-1">
              <div className="bg-[#161625] rounded-[2rem] p-6 h-full min-h-[560px] flex flex-col border border-white/5">

                {/* Hourly Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-200">Hourly forecast</h3>

                  {!loading && weather && (
                    <div className="relative" ref={dayDropdownRef}>
                      <button
                        className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition ${isDayDropdownOpen ? 'bg-[#363650] text-white' : 'bg-[#2C2C42] text-gray-400 hover:bg-[#363650]'}`}
                        onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                      >
                        {getDisplayDayName(forecast?.forecastday[selectedDayIndex].date, selectedDayIndex)}
                        <ChevronDown size={14} />
                      </button>

                      {isDayDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-[#2C2C42] rounded-xl p-2 shadow-xl z-20 border border-white/5">
                          {forecast?.forecastday.map((day, index) => (
                            <div
                              key={index}
                              className={`flex justify-between items-center px-3 py-2 rounded-lg text-xs cursor-pointer transition ${selectedDayIndex === index ? 'bg-[#363650] text-white' : 'text-gray-300 hover:bg-white/5'}`}
                              onClick={() => { setSelectedDayIndex(index); setIsDayDropdownOpen(false); }}
                            >
                              <span>{getDisplayDayName(day.date, index)}</span>
                              {selectedDayIndex === index && <Check size={12} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hourly List */}
                <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 flex-grow h-0 max-h-[600px] lg:max-h-none">
                  {loading || !weather ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-16 rounded-2xl bg-[#202B3B] animate-pulse border border-white/5"></div>
                    ))
                  ) : (
                    forecast?.forecastday[selectedDayIndex].hour.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between px-5 py-3 rounded-2xl bg-[#202B3B] border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-400 w-16">{formatTime(hour.time_epoch)}</span>
                          <img src={`https:${hour.condition.icon}`} alt="icon" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-base font-bold text-white">
                          {Math.round(units.temp === "C" ? hour.temp_c : hour.temp_f)}°
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3B4B5F; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- SUB COMPONENTS ---
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-[#202B3B] rounded-2xl p-4 md:p-5 flex flex-col justify-between h-28 md:h-32 border border-white/5 hover:border-white/10 transition">
      <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm font-bold uppercase tracking-wider">
        {icon} <span className="ml-1">{label}</span>
      </div>
      <span className={`text-2xl md:text-3xl font-bold text-white mt-2 ${value === '—' ? 'opacity-50' : ''}`}>{value}</span>
    </div>
  );
}

function UnitOption({ label, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition ${isActive ? 'bg-[#363650] text-white font-medium' : 'text-gray-400 hover:text-white'}`}
    >
      <span>{label}</span>
      {isActive && <Check size={12} />}
    </div>
  )
}
