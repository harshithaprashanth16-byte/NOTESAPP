import React, { useState, useEffect, useRef } from "react";
import { 
  GraduationCap, 
  Search, 
  User as UserIcon, 
  LogOut, 
  BookOpen, 
  FileText, 
  X, 
  FolderOpen,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, type Subject, type Resource } from "../api/client";
import { formatFileSize, getFileCategoryColor } from "../utils/fileHelpers";

interface NavbarProps {
  onOpenProfile: () => void;
  onNavigateHome: () => void;
  onSelectSubject?: (subjectId: string) => void;
  onViewResource?: (resource: Resource) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onNavigateHome,
  onSelectSubject,
  onViewResource,
}) => {
  const { user, stats, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ subjects: Subject[]; resources: Resource[] }>({
    subjects: [],
    resources: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Ctrl+K hotkey for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        searchInput?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ subjects: [], resources: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.search.query(searchQuery.trim());
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#000000]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: App Logo & Academic Icon */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-[#00FF41]/50 group-hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] flex items-center justify-center transition-all">
            <GraduationCap className="w-5 h-5 text-[#00FF41] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight font-mono">ACAD<span className="text-[#00FF41]">NOTE</span></span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-[#8AFF9B] border border-[#00FF41]/20 font-mono">
                WORKSPACE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-zinc-500 font-mono -mt-0.5">student academic locker</p>
          </div>
        </div>

        {/* Center: Search Bar with live search dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-md relative mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              placeholder="Search subjects or notes..."
              className="w-full bg-[#0a0a0f] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 pl-10 pr-16 py-2 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#090a10] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in max-h-[420px] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono">Searching resources...</div>
              ) : searchResults.subjects.length === 0 && searchResults.resources.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-zinc-400">No matching subjects or resources found.</p>
                  <p className="text-xs text-zinc-600 mt-1 font-mono">Try searching with another keyword</p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Matching Subjects */}
                  {searchResults.subjects.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-mono uppercase text-zinc-500 font-semibold tracking-wider flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-[#00FF41]" />
                        Subjects ({searchResults.subjects.length})
                      </div>
                      <div className="mt-1 space-y-1">
                        {searchResults.subjects.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => {
                              onSelectSubject?.(sub.id);
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="px-3 py-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <BookOpen className="w-4 h-4 text-[#8AFF9B] shrink-0" />
                              <div className="truncate">
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                                  {sub.name}
                                </p>
                                {sub.description && (
                                  <p className="text-xs text-zinc-500 truncate">{sub.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                              {sub.resource_count || 0} files
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Resources */}
                  {searchResults.resources.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-mono uppercase text-zinc-500 font-semibold tracking-wider flex items-center gap-1.5 border-t border-zinc-800/60 pt-2">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Resources ({searchResults.resources.length})
                      </div>
                      <div className="mt-1 space-y-1">
                        {searchResults.resources.map((res) => {
                          const category = getFileCategoryColor(res.file_type);
                          return (
                            <div
                              key={res.id}
                              onClick={() => {
                                onViewResource?.(res);
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                              className="px-3 py-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${category.bg} ${category.text} ${category.border} shrink-0`}>
                                  {res.file_type}
                                </span>
                                <div className="truncate">
                                  <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                                    {res.file_name}
                                  </p>
                                  <p className="text-[11px] text-zinc-500 font-mono">
                                    in <span className="text-zinc-400">{res.subject_name || "Subject"}</span> · {formatFileSize(res.file_size)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-[#00FF41] opacity-0 group-hover:opacity-100 transition-opacity font-mono shrink-0">
                                View →
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: User Profile & Menu */}
        <div ref={profileMenuRef} className="relative flex items-center gap-3">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#00FF41]/15 border border-[#00FF41]/30 flex items-center justify-center text-xs font-mono font-bold text-[#8AFF9B]">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">{user?.name || "Student"}</p>
              <p className="text-[10px] text-zinc-500 truncate max-w-[120px] font-mono">{user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0f] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              {/* User details header */}
              <div className="px-3 py-2.5 border-b border-zinc-800/80 mb-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 font-mono truncate">{user?.email}</p>
                {stats && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-800/50 text-[11px] font-mono text-zinc-400">
                    <div><span className="text-[#00FF41] font-bold">{stats.total_subjects}</span> subjects</div>
                    <div>•</div>
                    <div><span className="text-[#8AFF9B] font-bold">{stats.total_resources}</span> notes</div>
                  </div>
                )}
              </div>

              {/* Menu Actions */}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenProfile();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-zinc-400" />
                Profile Settings
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigateHome();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-zinc-400" />
                My Subjects
              </button>

              <div className="border-t border-zinc-800/80 my-1"></div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
