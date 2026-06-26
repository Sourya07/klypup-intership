import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { searchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart4, 
  Search, 
  Bookmark, 
  TrendingUp, 
  Users, 
  LogOut, 
  Globe, 
  ChevronRight, 
  Menu, 
  X, 
  FileText,
  Sun,
  Moon
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, organization, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const results = await searchService.searchEquities(searchQuery);
          setSearchResults(results);
          setShowSearchDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart4 },
    { name: 'New Research', href: '/research/new', icon: Globe },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Compare Companies', href: '/compare', icon: TrendingUp },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
    { name: 'Team Management', href: '/team', icon: Users },
  ];

  // Helper to generate breadcrumbs dynamically
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ name: 'Home', href: '/' }];
    
    let currentHref = '';
    paths.forEach((p) => {
      currentHref += `/${p}`;
      let name = p.charAt(0).toUpperCase() + p.slice(1);
      
      // Clean up common parameter names for pretty display
      if (name.startsWith('Report-')) {
        name = name.replace('Report-', '').toUpperCase();
      } else if (p.length === 4 && p === p.toLowerCase()) {
        name = p.toUpperCase();
      } else if (p === 'new') {
        name = 'New Research';
      }
      
      crumbs.push({ name, href: currentHref });
    });

    return crumbs;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex transition-colors duration-200">
      
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 dark:bg-black text-zinc-400 shrink-0 border-r border-zinc-800 dark:border-zinc-800">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-white text-zinc-900 flex items-center justify-center font-black tracking-tighter">
              AG
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">Antigravity AI</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Research Hub</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
          <div>
            <span className="px-3 text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-3">Workspace</span>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-2 text-xs font-semibold rounded transition-all group ${
                        isActive 
                          ? 'bg-zinc-800 dark:bg-zinc-900 text-white border-l-2 border-white pl-2' 
                          : 'text-zinc-400 hover:bg-zinc-800 dark:hover:bg-zinc-900/40 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Workspace Profile Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 dark:bg-black flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 font-bold shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate leading-none">{user?.name}</span>
              <span className="text-[10px] text-zinc-500 block truncate mt-1">{organization?.name}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER/NAV */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900 dark:bg-black text-white z-40 flex items-center justify-between px-6 border-b border-zinc-800">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-white text-zinc-900 flex items-center justify-center font-black text-xs">
            AG
          </div>
          <span className="text-sm font-bold tracking-tight">Antigravity AI</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded hover:bg-zinc-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-zinc-900 dark:bg-black text-zinc-400 z-30 flex flex-col justify-between animate-fade-in">
          <nav className="p-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 text-sm font-semibold rounded ${
                      isActive 
                        ? 'bg-zinc-800 dark:bg-zinc-900 text-white border-l-4 border-white' 
                        : 'hover:bg-zinc-800 dark:hover:bg-zinc-900/40 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 shrink-0" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 border-t border-zinc-800 bg-zinc-950 dark:bg-black flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{user?.name}</span>
                <span className="text-xs text-zinc-500 block">{organization?.name}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN WRAPPER CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        
        {/* TOPBAR */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between shrink-0 transition-colors duration-200">
          
          {/* Left: Organization context & search */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 border-r border-zinc-200 dark:border-zinc-800 pr-5">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Tenant</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                {organization?.name || 'Loading...'}
              </span>
            </div>

            {/* Global ticker search */}
            <div ref={searchRef} className="hidden md:flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 w-72 group focus-within:border-zinc-800 dark:focus-within:border-zinc-400 transition-colors relative">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                placeholder="Search equity, watchlists..." 
                className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-600"
              />
              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-xs text-center text-zinc-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((res: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            navigate(`/research/new?ticker=${res.symbol}`);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{res.displaySymbol}</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{res.description}</span>
                          </div>
                          <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded ml-2 shrink-0">{res.type}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-center text-zinc-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: User info, Theme Switcher & triggers */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle Trigger */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all focus:outline-none shrink-0"
              title={theme === 'dark' ? 'Activate Light Theme' : 'Activate Dark Theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 text-left p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
              >
                <div className="w-7.5 h-7.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block leading-none">{user?.name}</span>
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500 block tracking-widest mt-1">
                    {role || 'ANALYST'}
                  </span>
                </div>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-20 animate-scale-up">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">Logged in as</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate mt-0.5">{user?.email}</span>
                    </div>
                    <div className="py-1">
                      <Link 
                        to="/team" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-2.5 text-zinc-400" /> Team Workspace
                      </Link>
                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 text-red-400" /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* SUB-HEADER / BREADCRUMBS */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2.5 flex items-center justify-between shrink-0 transition-colors duration-200">
          <nav className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />}
                  {isLast ? (
                    <span className="text-zinc-800 dark:text-white font-black">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.href} className="hover:text-zinc-800 dark:hover:text-white transition-colors">{crumb.name}</Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
          <span className="hidden sm:inline text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
            Market Feed: Active
          </span>
        </div>

        {/* CANVAS WORKSPACE */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
