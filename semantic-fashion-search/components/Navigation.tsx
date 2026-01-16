'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

interface NavigationProps {
  onReset?: () => void;
}

const navigationItems: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: "Women's Clothing",
    children: [
      { label: 'Dresses', href: '/category/dresses' },
      { label: 'Tops & Blouses', href: '/category/tops' },
      { label: 'Skirts', href: '/category/skirts' },
      { label: 'Outerwear', href: '/category/outerwear' },
    ],
  },
  {
    label: 'Footwear',
    children: [
      { label: 'Heels', href: '/category/heels' },
      { label: 'Boots', href: '/category/boots' },
      { label: 'Sneakers', href: '/category/sneakers' },
    ],
  },
  {
    label: 'Accessories',
    children: [
      { label: 'Jewelry', href: '/category/jewelry' },
      { label: 'Bags', href: '/category/bags' },
      { label: 'Hats', href: '/category/hats' },
    ],
  },
  { label: 'Jewelry', href: '/category/jewelry' },
];

export function Navigation({ onReset }: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    }
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
          {navigationItems.map((item) => (
            <div
              key={item.label}
              className="nav-item"
              onMouseEnter={() => item.children && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              {item.href ? (
                <a
                  href={item.href}
                  className="nav-link"
                  onClick={item.label === 'Home' ? handleHomeClick : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <button className="nav-link nav-dropdown-trigger">
                  {item.label}
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
                </button>
              )}

              {/* Dropdown Menu */}
              {item.children && openDropdown === item.label && (
                <div className="nav-dropdown">
                  {item.children.map((child) => (
                    <Link key={child.label} href={child.href} className="nav-dropdown-item">
                      {child.label}
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
          {navigationItems.map((item) => (
            <div key={item.label} className="mobile-menu-section">
              {item.href ? (
                <a
                  href={item.href}
                  className="mobile-menu-link"
                  onClick={(e) => {
                    if (item.label === 'Home') {
                      handleHomeClick(e);
                    }
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <>
                  <div className="mobile-menu-category">{item.label}</div>
                  {item.children?.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="mobile-menu-sublink"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          ))}

          {/* Mobile Auth */}
          <div className="mobile-menu-section mobile-auth-section">
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
