'use client';

import { MagnifyingGlassIcon, BellIcon, UserIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { NAVIGATION } from '../app/Constants/navigation.constants';
import { useRouter } from 'next/navigation';
import { UserRole } from '../types/enums';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    router.push(NAVIGATION.auth.login);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const itemsPath = user?.role === UserRole.ADMIN ? NAVIGATION.admin.items : NAVIGATION.branch.items;
      router.push(`${itemsPath}?search=${encodeURIComponent(searchQuery.trim())}`);
      if (isMobile) {
        setMobileSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

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

  return (
    <nav className="h-16 bg-white shadow-md z-30 relative">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileToggle}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer lg:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Desktop search */}
          {!isMobile && (
            <div className="flex-1 max-w-xl">
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </form>
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile search button */}
          {isMobile && (
            <button
              onClick={handleMobileSearchToggle}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
              aria-label="Search"
            >
              {mobileSearchOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-lg p-2 transition-all duration-200 cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role'}</p>
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
              <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 cursor-pointer">
                <div className="sm:hidden px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer"
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
        <div className="mobile-search-container absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-40 p-4">
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </form>
        </div>
      )}
    </nav>
  );
}
