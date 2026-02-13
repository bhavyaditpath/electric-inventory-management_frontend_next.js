'use client';

import { MagnifyingGlassIcon, UserIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { NAVIGATION } from '../app/Constants/navigation.constants';
import { useRouter } from 'next/navigation';
import NotificationDropdown from './NotificationDropdown';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { ThemeMode } from '@/types/enums';

interface NavbarProps {
  sidebarOpen: boolean;
  isMobile?: boolean;
  onMobileToggle?: () => void;
}

export default function Navbar({ sidebarOpen, isMobile, onMobileToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return ThemeMode.Light;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === ThemeMode.Dark || savedTheme === ThemeMode.Light) {
      return savedTheme;
    }
    return ThemeMode.Light;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    router.push(NAVIGATION.auth.login);
  };

  useGlobalSearch({
    searchQuery,
    userRole: user?.role,
    isMobile,
    mobileSearchOpen
  });

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen(!mobileSearchOpen);
    if (!mobileSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSearchOpen && !(event.target as Element)?.closest('.mobile-search-container')) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSearchOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode =
      theme === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setTheme(nextTheme);
  };

  return (
    <nav
      data-sidebar-open={sidebarOpen ? "true" : "false"}
      className="h-16 bg-[var(--theme-surface)] border-b border-[var(--theme-border)] z-30 sticky top-0"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={onMobileToggle}
              className="p-2 text-[var(--theme-text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer md:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* Desktop search */}
          {!isMobile && (
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text-muted)] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile search button */}
          {isMobile && (
            <button
              onClick={handleMobileSearchToggle}
              className="p-2 text-[var(--theme-text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
              aria-label="Search"
            >
              {mobileSearchOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)] rounded-lg transition-all duration-200 cursor-pointer"
            aria-label={theme === ThemeMode.Dark ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === ThemeMode.Dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === ThemeMode.Dark ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 lg:gap-3 hover:bg-[var(--theme-surface-muted)] rounded-lg p-2 transition-all duration-200 cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[var(--theme-text)]">{user?.username || 'User'}</p>
                <p className="text-xs text-[var(--theme-text-muted)]">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role'}</p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden flex items-center justify-center">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white"><svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A4 4 0 018.999 16h6a4 4 0 013.878 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
                      }
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                    <UserIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                )}
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-[var(--theme-text-muted)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--theme-surface)] rounded-lg shadow-lg border border-[var(--theme-border)] py-1 z-50 cursor-pointer">
                <div className="sm:hidden px-4 py-2 border-b border-[var(--theme-border)]">
                  <p className="text-sm font-semibold text-[var(--theme-text)]">{user?.username || 'User'}</p>
                  <p className="text-xs text-[var(--theme-text-muted)]">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)] transition-all duration-200 cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMobile && mobileSearchOpen && (
        <div className="mobile-search-container absolute top-full left-0 right-0 bg-[var(--theme-surface)] border-b border-[var(--theme-border)] shadow-lg z-40 p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text-muted)] w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}
    </nav>
  );
}
