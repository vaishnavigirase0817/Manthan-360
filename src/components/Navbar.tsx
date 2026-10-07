import { auth, logoutUser } from "../services/firebase";
import { LogOut, User, Globe, Menu, MoreVertical, Sun, Moon, Laptop } from "lucide-react";
import { FirebaseUser } from "../types";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import ManthanLogo from "./ManthanLogo";

interface NavbarProps {
  user: FirebaseUser | null;
  onToggleSidebar?: () => void;
  onOpenMobileTools?: () => void;
}

export default function Navbar({ user, onToggleSidebar, onOpenMobileTools }: NavbarProps) {
  const { selectedLanguage, setLanguage } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all"
    >
      <div id="navbar-brand-section" className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            id="navbar-mobile-drawer-toggle"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div id="navbar-brand">
          <ManthanLogo size="sm" />
        </div>
      </div>

      <div id="navbar-actions" className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Button */}
        <button
          type="button"
          id="navbar-theme-toggle"
          onClick={toggleTheme}
          title={`Current theme: ${theme.toUpperCase()} (Click to toggle)`}
          className="p-2 rounded-xl bg-slate-900/80 light:bg-white text-slate-300 light:text-rose-950 border border-white/10 light:border-rose-900/20 hover:bg-white/10 light:hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center shadow-sm"
        >
          {theme === "dark" && <Moon className="w-4 h-4 text-violet-400" />}
          {theme === "light" && <Sun className="w-4 h-4 text-amber-600" />}
          {theme === "system" && <Laptop className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Global Language Selector */}
        <div
          className="flex items-center gap-1.5 bg-slate-900/80 light:bg-white border border-white/10 light:border-rose-900/20 rounded-xl px-2.5 py-1 text-xs focus-within:border-violet-500/50 transition-all shadow-inner"
          id="language-selector-container"
        >
          <Globe className="w-3.5 h-3.5 text-violet-400 light:text-rose-700" />
          <select
            id="global-language-selector"
            value={selectedLanguage}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 light:text-rose-950 focus:outline-none cursor-pointer pr-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-950 light:bg-white text-slate-200 light:text-rose-950">
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* Mobile 3-Dot Learning Tools Trigger */}
        {onOpenMobileTools && (
          <button
            type="button"
            id="navbar-mobile-tools-btn"
            onClick={onOpenMobileTools}
            className="md:hidden p-2 rounded-xl text-slate-300 light:text-rose-950 hover:text-white bg-slate-900/80 light:bg-white border border-white/10 light:border-rose-900/20 hover:bg-slate-800 transition-colors"
            title="Open Learning Tools"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3" id="navbar-user-profile">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200 light:text-rose-950 truncate max-w-[140px]">
                {user.displayName || "Student"}
              </span>
              <span className="text-[10px] text-slate-400 light:text-rose-800 font-mono truncate max-w-[140px]">
                {user.email}
              </span>
            </div>

            {user.photoURL ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-violet-500/50 p-0.5 shrink-0">
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="rounded-full bg-slate-700 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 light:bg-rose-900 border border-violet-500/50 light:border-rose-700 p-1.5 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-300 light:text-white" />
              </div>
            )}

            <button
              id="navbar-signout"
              onClick={handleSignOut}
              className="flex items-center justify-center p-2 rounded-xl text-slate-400 light:text-rose-800 hover:text-rose-400 hover:bg-rose-950/20 light:hover:bg-rose-100 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-violet-400" id="navbar-guest-token">
            🔒 Guest
          </div>
        )}
      </div>
    </nav>
  );
}
