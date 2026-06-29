import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-surface-dark border-t border-border-dark py-12 px-6">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* About */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary !text-[32px]">movie_filter</span>
            <h2 className="text-white text-xl font-bold tracking-tight uppercase">CineMax</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Experience movies like never before. Premium seating, immersive sound, and the latest blockbusters.
          </p>
        </div>

        {/* Movies */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold">Movies</h4>
          <div className="flex flex-col gap-2 text-sm text-white/60">
            <Link to="/movies?status=now_showing" className="hover:text-primary transition-colors">
              Now Showing
            </Link>
            <Link to="/movies?status=upcoming" className="hover:text-primary transition-colors">
              Coming Soon
            </Link>
            <Link to="/movies" className="hover:text-primary transition-colors">
              All Movies
            </Link>
            <Link to="/promotions" className="hover:text-primary transition-colors">
              Events
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-white/60">
            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
            <Link to="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <Link to="/policies" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/policies" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold">Newsletter</h4>
          <p className="text-white/60 text-sm">Subscribe for offers and updates.</p>
          <div className="flex w-full">
            <input
              className="bg-background-dark text-white text-sm rounded-l-full px-4 border border-border-dark border-r-0 focus:ring-0 focus:border-primary w-full outline-none h-10"
              placeholder="Your email"
              type="email"
            />
            <button className="bg-primary text-background-dark font-bold px-4 rounded-r-full h-10 hover:brightness-110 transition-all">
              Join
            </button>
          </div>
          <div className="flex gap-4 mt-2">
            <a href="https://www.facebook.com/phuoc.nguyen.351071" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">chat_bubble</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
        © 2024 CineMax. All rights reserved.
      </div>
    </footer>
  );
}

