'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface NavigationProps {
  onReset?: () => void;
}

const navLinks = [
  { label: "Women's Clothing", query: "women's clothing" },
  { label: 'Footwear',         query: 'footwear' },
  { label: 'Accessories',      query: 'accessories' },
  { label: 'Jewelry',          query: 'jewelry' },
];

export function Navigation({ onReset }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    }
    // Clear ?q= from URL when going home
    window.history.replaceState({}, '', '/');
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
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={`/?q=${encodeURIComponent(item.query)}`}
              className="nav-link"
            >
              {item.label}
            </Link>
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
              <Link href="/admin/login" className="nav-link-secondary">
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

          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={`/?q=${encodeURIComponent(item.query)}`}
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
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
                  href="/admin/login"
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
