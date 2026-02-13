'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface NavigationProps {
  onReset?: () => void;
}

interface SubItem {
  label: string;
  query: string;
}

interface NavCategory {
  label: string;
  query: string;           // category-level search
  subcategories: SubItem[];
}

const categories: NavCategory[] = [
  {
    label: "Women's Clothing",
    query: "women's clothing",
    subcategories: [
      { label: 'Dresses',        query: 'dresses' },
      { label: 'Tops & Blouses', query: 'tops and blouses' },
      { label: 'Pants & Jeans',  query: 'pants and jeans' },
      { label: 'Skirts',         query: 'skirts' },
      { label: 'Outerwear',      query: 'outerwear' },
      { label: 'Activewear',     query: 'activewear' },
      { label: 'Swimwear',       query: 'swimwear' },
    ],
  },
  {
    label: 'Footwear',
    query: 'footwear',
    subcategories: [
      { label: 'Heels',             query: 'heels' },
      { label: 'Boots',             query: 'boots' },
      { label: 'Sneakers',          query: 'sneakers' },
      { label: 'Flats & Loafers',   query: 'flats and loafers' },
      { label: 'Sandals',           query: 'sandals' },
    ],
  },
  {
    label: 'Accessories',
    query: 'accessories',
    subcategories: [
      { label: 'Handbags & Totes', query: 'handbags and totes' },
      { label: 'Scarves & Wraps',  query: 'scarves and wraps' },
      { label: 'Hats & Caps',      query: 'hats' },
      { label: 'Sunglasses',       query: 'sunglasses' },
      { label: 'Belts',            query: 'belts' },
    ],
  },
  {
    label: 'Jewelry',
    query: 'jewelry',
    subcategories: [
      { label: 'Necklaces',   query: 'necklaces' },
      { label: 'Earrings',    query: 'earrings' },
      { label: 'Bracelets',   query: 'bracelets' },
      { label: 'Rings',       query: 'rings' },
      { label: 'Jewelry Sets', query: 'jewelry sets' },
    ],
  },
];

export function Navigation({ onReset }: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleHomeClick = (e: React.MouseEvent) => {
    // Only intercept when we have an onReset handler (i.e. on the home page)
    if (onReset) {
      e.preventDefault();
      onReset();
      window.history.replaceState({}, '', '/');
    }
    // Otherwise: let the <a href="/"> do a normal page navigation
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <a href="/" className="nav-logo" onClick={handleHomeClick}>
          <span className="logo-box">⚡ ATLAZ AI</span>
        </a>

        {/* Desktop Navigation */}
        <div className="nav-desktop">
          {/* Home link */}
          <a href="/" className="nav-link" onClick={handleHomeClick}>
            Home
          </a>

          {categories.map((cat) => (
            <div
              key={cat.label}
              className="nav-item"
              onMouseEnter={() => setOpenDropdown(cat.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={`/?q=${encodeURIComponent(cat.query)}`}
                className="nav-link nav-dropdown-trigger"
              >
                {cat.label}
                <svg
                  className="dropdown-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {openDropdown === cat.label && (
                <div className="nav-dropdown">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.label}
                      href={`/?q=${encodeURIComponent(sub.query)}`}
                      className="nav-dropdown-item"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Side Links */}
        <div className="nav-right">
          <Link href="/support" className="nav-link-secondary">
            Support
          </Link>
          <Link href="/contact" className="nav-link-secondary">
            Contact
          </Link>
          {session ? (
            <>
              <span className="nav-user-info">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="nav-link-secondary nav-auth-btn"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signup" className="nav-link-secondary">
                Sign Up
              </Link>
              <Link href="/login" className="nav-link-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileMenuOpen ? (
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 12h18M3 6h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {/* Home */}
          <a
            href="/"
            className="mobile-menu-link"
            onClick={(e) => {
              handleHomeClick(e);
              setMobileMenuOpen(false);
            }}
          >
            Home
          </a>

          {/* Categories with expandable subcategories */}
          {categories.map((cat) => (
            <div key={cat.label} className="mobile-menu-section">
              {/* Category header — tap to expand/collapse subcategories */}
              <div className="mobile-menu-category-row">
                <Link
                  href={`/?q=${encodeURIComponent(cat.query)}`}
                  className="mobile-menu-link mobile-menu-category-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.label}
                </Link>
                <button
                  className="mobile-menu-expand-btn"
                  aria-label={`Expand ${cat.label}`}
                  onClick={() =>
                    setMobileOpenCategory(
                      mobileOpenCategory === cat.label ? null : cat.label
                    )
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{
                      transform: mobileOpenCategory === cat.label ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <path
                      d="M2.5 4.5L6 8L9.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {mobileOpenCategory === cat.label && (
                <div className="mobile-submenu">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.label}
                      href={`/?q=${encodeURIComponent(sub.query)}`}
                      className="mobile-menu-sublink"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Mobile Auth */}
          <div className="mobile-menu-section mobile-auth-section">
            <Link
              href="/support"
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Support
            </Link>
            <Link
              href="/contact"
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {session ? (
              <>
                <div className="mobile-user-info">
                  {session.user?.name || session.user?.email}
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="mobile-menu-link"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
