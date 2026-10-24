import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Logo } from './Logo';
import {
  LogOut,
  ChevronDown,
  Plus,
  Shield
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewCampaign: () => void;
}

export const Navbar: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewCampaign,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { campaigns } = useAppSelector((state) => state.campaigns);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    ...(isAdmin ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
    { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
    { id: 'contacts', label: 'Contacts' },
    { id: 'templates', label: 'Templates' },
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab(isAdmin ? 'dashboard' : 'campaigns')}
              className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
            >
              <Logo size="md" theme="light" showWordmark={true} />
            </button>

            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-xs lg:text-sm font-semibold transition-colors py-2 px-3 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-emerald-200 text-emerald-900 font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewCampaign}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.fullName || user?.username || 'User'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 divide-y divide-slate-100"
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user?.fullName || 'User'}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {user?.role || 'USER'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user?.email || 'user@campaignpro.io'}
                      </p>
                      {user?.username && (
                        <p className="text-[10px] font-mono text-emerald-700 mt-1">
                          @{user.username}
                        </p>
                      )}
                    </div>


                    <div className="p-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          dispatch(logout());
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1.5 bg-slate-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export const Header = Navbar;
