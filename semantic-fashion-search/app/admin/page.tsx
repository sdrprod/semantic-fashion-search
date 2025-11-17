'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSearches: 0,
    totalSubscribers: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch dashboard stats
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="admin-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = session.user?.role === 'admin';
  const isEditor = session.user?.role === 'editor' || isAdmin;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-user">
          {session.user?.image && (
            <img src={session.user.image} alt={session.user.name || ''} />
          )}
          <div className="admin-user-info">
            <div className="admin-user-name">{session.user?.name}</div>
            <div className="admin-user-role">{session.user?.role}</div>
          </div>
          <button onClick={() => signOut()} className="btn btn-outline">
            Sign Out
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <Link href="/admin" className="admin-nav-link active">
          Dashboard
        </Link>
        {isEditor && (
          <>
            <Link href="/admin/settings" className="admin-nav-link">
              Search Settings
            </Link>
            <Link href="/admin/content" className="admin-nav-link">
              Content
            </Link>
            <Link href="/admin/subscribers" className="admin-nav-link">
              Subscribers
            </Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link href="/admin/products" className="admin-nav-link">
              Products
            </Link>
            <Link href="/admin/users" className="admin-nav-link">
              Users
            </Link>
          </>
        )}
      </nav>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.totalProducts.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Searches</div>
          <div className="stat-value">{stats.totalSearches.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Email Subscribers</div>
          <div className="stat-value">{stats.totalSubscribers.toLocaleString()}</div>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={async () => {
                if (confirm('Sync products from Impact? This may take a few minutes.')) {
                  const response = await fetch('/api/admin/sync-products', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-admin-secret': prompt('Enter admin secret:') || '',
                    },
                    body: JSON.stringify({ source: 'impact', maxProducts: 100 }),
                  });
                  const result = await response.json();
                  alert(result.message || result.error);
                }
              }}
              className="btn btn-primary"
            >
              Sync Products from Impact
            </button>
          )}
          <Link href="/" className="btn btn-secondary">
            View Site
          </Link>
        </div>
      </div>

      {!isEditor && (
        <div className="message message-info">
          You have viewer access. Contact an admin to request editor or admin privileges.
        </div>
      )}
    </div>
  );
}
