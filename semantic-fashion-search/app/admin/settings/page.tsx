'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SearchSettings {
  similarityThreshold: number;
  diversityFactor: number;
  defaultPageSize: number;
  maxPageSize: number;
  categoryWeights: Record<string, number>;
  brandBoosts: Record<string, number>;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SearchSettings>({
    similarityThreshold: 0.3,
    diversityFactor: 0.1,
    defaultPageSize: 10,
    maxPageSize: 50,
    categoryWeights: {},
    brandBoosts: {},
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    }

    if (session) {
      fetchSettings();
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

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

  const isEditor = session.user?.role === 'editor' || session.user?.role === 'admin';

  if (!isEditor) {
    return (
      <div className="admin-container">
        <div className="message message-error">
          You don't have permission to access this page.
        </div>
        <Link href="/admin" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Search Settings</h1>
        <Link href="/admin" className="btn btn-outline">
          Back to Dashboard
        </Link>
      </header>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-card">
        <h2 className="admin-card-title">Similarity & Ranking</h2>
        <p className="admin-card-description">
          Adjust how search results are matched and ranked.
        </p>

        <div className="form-group">
          <label className="form-label">
            Similarity Threshold
            <span className="slider-value">{settings.similarityThreshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="form-slider"
            min="0"
            max="1"
            step="0.01"
            value={settings.similarityThreshold}
            onChange={(e) =>
              setSettings({ ...settings, similarityThreshold: parseFloat(e.target.value) })
            }
          />
          <p className="form-help">
            Minimum similarity score for products to appear in results. Higher = stricter matching.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            Diversity Factor
            <span className="slider-value">{settings.diversityFactor.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="form-slider"
            min="0"
            max="1"
            step="0.01"
            value={settings.diversityFactor}
            onChange={(e) =>
              setSettings({ ...settings, diversityFactor: parseFloat(e.target.value) })
            }
          />
          <p className="form-help">
            How much to diversify results to avoid showing too-similar items. Higher = more variety.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Pagination</h2>

        <div className="form-group">
          <label className="form-label">Default Results Per Page</label>
          <select
            className="form-select"
            value={settings.defaultPageSize}
            onChange={(e) =>
              setSettings({ ...settings, defaultPageSize: parseInt(e.target.value) })
            }
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Maximum Results Per Page</label>
          <select
            className="form-select"
            value={settings.maxPageSize}
            onChange={(e) =>
              setSettings({ ...settings, maxPageSize: parseInt(e.target.value) })
            }
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Category Weights</h2>
        <p className="admin-card-description">
          Boost or reduce the prominence of specific product categories in search results.
        </p>

        {['dress', 'shoes', 'bags', 'tops', 'bottoms', 'accessories'].map((category) => (
          <div className="form-group" key={category}>
            <label className="form-label">
              {category.charAt(0).toUpperCase() + category.slice(1)}
              <span className="slider-value">
                {(settings.categoryWeights[category] || 1).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              className="form-slider"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.categoryWeights[category] || 1}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  categoryWeights: {
                    ...settings.categoryWeights,
                    [category]: parseFloat(e.target.value),
                  },
                })
              }
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
