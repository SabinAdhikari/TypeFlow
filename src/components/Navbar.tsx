import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Keyboard, Trophy, BarChart3, Calendar, Award, User, Settings, LogIn, LogOut, Sun, Moon, Menu, X, Shield } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./Avatar";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Test", icon: Keyboard },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/daily", label: "Daily", icon: Calendar },
    { to: "/stats", label: "Stats", icon: BarChart3 },
    { to: "/achievements", label: "Achievements", icon: Award },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 glass border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold hidden sm:block">TypeFlow</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`nav-link flex items-center gap-1.5 ${isActive(to) ? "nav-link-active" : ""}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {profile?.is_admin && (
              <Link to="/admin" className={`nav-link flex items-center gap-1.5 ${isActive("/admin") ? "nav-link-active" : ""}`}>
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {profile ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="sm" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{profile.username}</span>
                </Link>
                <button onClick={signOut} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost flex items-center gap-1.5 text-sm">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`nav-link flex items-center gap-2 ${isActive(to) ? "nav-link-active" : ""}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {profile?.is_admin && (
                <Link to="/admin" className={`nav-link flex items-center gap-2 ${isActive("/admin") ? "nav-link-active" : ""}`}>
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
              {profile ? (
                <>
                  <Link to="/profile" className="nav-link flex items-center gap-2">
                    <User className="w-4 h-4" /> {profile.username}
                  </Link>
                  <Link to="/settings" className="nav-link flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={signOut} className="nav-link flex items-center gap-2 text-left">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm text-center mt-2">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
