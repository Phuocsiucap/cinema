import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../ui';
import { movieService } from '../../services';
import type { Movie } from '../../types/movie';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await movieService.getMovies({
          search: searchQuery,
          size: 12
        });
        setSearchResults(response.items);
      } catch (error) {
        console.error('Failed to search movies:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMovieClick = (movieId: string) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/movie/${movieId}`);
  };

  const navLinks = [
    { name: 'Movies', path: '/movies' },
    { name: 'Cinemas', path: '/cinemas' },
    { name: 'Promotions', path: '/promotions' },
    { name: 'My Tickets', path: '/my-tickets' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-effect border-b border-border-dark/30">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 text-white cursor-pointer hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-primary !text-[32px]">movie_filter</span>
            <h2 className="text-white text-xl font-bold tracking-tight uppercase">CineMax</h2>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 justify-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-white/80 text-sm font-semibold hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSearchModal(true)}
              className="hidden sm:flex size-10 items-center justify-center rounded-full bg-border-dark text-white hover:bg-primary hover:text-background-dark transition-all"
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            <div className="flex gap-3">
              {isAuthenticated ? (
                <>
                  {user && (
                    <div className="hidden lg:flex items-center gap-2 px-4">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-border-dark rounded-full flex items-center justify-center border-2 border-primary">
                          <span className="text-primary text-sm font-bold">
                            {user.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{user.full_name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-background-dark text-sm font-bold shadow-[0_0_15px_rgba(70,236,19,0.3)] hover:shadow-[0_0_25px_rgba(70,236,19,0.6)] hover:scale-105 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden lg:flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-transparent border border-border-dark text-white text-sm font-bold hover:border-primary hover:text-primary transition-all"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-background-dark text-sm font-bold shadow-[0_0_15px_rgba(70,236,19,0.3)] hover:shadow-[0_0_25px_rgba(70,236,19,0.6)] hover:scale-105 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-primary transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-dark/30 bg-surface-dark/95 backdrop-blur-sm">
            <div className="max-w-[1280px] mx-auto px-6 py-4">
              <nav className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSearchModal(true);
                  }}
                  className="text-left text-white/80 hover:text-primary py-2 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">search</span>
                  Search Movies
                </button>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/80 hover:text-primary py-2 text-sm font-semibold transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    {user && (
                      <div className="flex items-center gap-2 py-2 border-t border-border-dark/30 mt-2 pt-4">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-border-dark rounded-full flex items-center justify-center border-2 border-primary">
                            <span className="text-primary text-sm font-bold">
                              {user.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">{user.full_name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="text-left text-white/80 hover:text-primary py-2 text-sm font-semibold transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-primary py-2 text-sm font-bold"
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-3xl bg-surface-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="p-6 border-b border-border-dark">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for movies..."
                  autoFocus
                  className="w-full h-14 bg-background-dark rounded-xl pl-12 pr-12 text-white placeholder-text-muted border border-transparent focus:border-primary focus:ring-0 transition-all outline-none text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handleMovieClick(movie.id)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-background-dark">
                        <img
                          src={movie.poster_url || 'https://via.placeholder.com/300x450'}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {movie.imdb_rating && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-yellow-400 text-[14px]">star</span>
                            <span className="text-white text-xs font-bold">{movie.imdb_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-white text-sm font-medium mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {movie.title}
                      </h3>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg">No movies found for "{searchQuery}"</p>
                  <p className="text-white/40 text-sm mt-2">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-white/20 text-[64px]">search</span>
                  <p className="text-white/60 text-lg mt-4">Start typing to search for movies</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
}
