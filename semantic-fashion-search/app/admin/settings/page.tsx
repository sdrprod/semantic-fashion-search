'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type SearchMode = 'auto' | 'hybrid' | 'vector';

interface SearchSettings {
  similarityThreshold: number;
  diversityFactor: number;
  defaultPageSize: number;
  maxPageSize: number;
  categoryWeights: Record<string, number>;
  brandBoosts: Record<string, number>;
  minPriceThreshold: number;
  enableMensFilter: boolean;
  enablePriceFilter: boolean;
  enableNonApparelFilter: boolean;
  searchMode: SearchMode;
  hybridVectorWeight: number;
  hybridTextWeight: number;
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-icon" data-tooltip={text} aria-label="More info">
      ?
    </span>
  );
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
    minPriceThreshold: 5.00,
    enableMensFilter: true,
    enablePriceFilter: true,
    enableNonApparelFilter: true,
    searchMode: 'auto',
    hybridVectorWeight: 0.60,
    hybridTextWeight: 0.40,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Block viewers from accessing admin settings
      const userRole = session?.user?.role;
      if (userRole !== 'admin' && userRole !== 'editor') {
        router.push('/?error=unauthorized');
      }
    }
  }, [status, session, router]);

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

  // Block viewers entirely - should never reach this point due to useEffect redirect and middleware
  if (!isEditor) {
    return null;
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

      {/* Search Mode */}
      <div className="admin-card">
        <h2 className="admin-card-title">
          Search Mode
          <Tooltip text={'Auto: analyzes each query and adjusts vector vs. text weighting dynamically — brand names get more text weight, style queries get more vector weight.\n\nHybrid: applies your fixed slider split to every query. Good for testing.\n\nVector Only: disables text search entirely. Matches the previous behavior.'} />
        </h2>
        <p className="admin-card-description">
          Control whether search uses semantic (vector) matching, exact text matching, or an intelligent blend of both.
        </p>

        <div className="form-group">
          <div className="search-mode-group">
            {([
              { value: 'auto', name: 'Auto', desc: 'Recommended' },
              { value: 'hybrid', name: 'Hybrid', desc: 'Fixed split' },
              { value: 'vector', name: 'Vector Only', desc: 'Previous behavior' },
            ] as { value: SearchMode; name: string; desc: string }[]).map(({ value, name, desc }) => (
              <div className="search-mode-option" key={value}>
                <input
                  type="radio"
                  id={`mode-${value}`}
                  name="searchMode"
                  value={value}
                  checked={settings.searchMode === value}
                  onChange={() => setSettings({ ...settings, searchMode: value })}
                />
                <label htmlFor={`mode-${value}`}>
                  <span className="mode-name">{name}</span>
                  <span className="mode-desc">{desc}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ opacity: settings.searchMode === 'vector' ? 0.4 : 1, pointerEvents: settings.searchMode === 'vector' ? 'none' : 'auto' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
            Search Weighting
            <Tooltip text={'Controls the balance between exact text matching and semantic meaning-based matching.\n\nSlide toward Text for more exact matches (brand names, product titles).\n\nSlide toward Semantic for more conceptual matches (styles, occasions, aesthetics).\n\nIn Auto mode, this sets the default — individual queries may override it.'} />
          </label>
          <div className="weight-slider-labels">
            <span>← More Semantic</span>
            <span>More Exact Match →</span>
          </div>
          <input
            type="range"
            className="form-slider"
            min="0"
            max="1"
            step="0.05"
            value={1 - settings.hybridVectorWeight}
            onChange={(e) => {
              const textWeight = parseFloat(e.target.value);
              setSettings({
                ...settings,
                hybridVectorWeight: parseFloat((1 - textWeight).toFixed(2)),
                hybridTextWeight: parseFloat(textWeight.toFixed(2)),
              });
            }}
          />
          <div className="weight-slider-values">
            <span className="weight-value-vector">Semantic {Math.round(settings.hybridVectorWeight * 100)}%</span>
            <span className="weight-value-text">Text {Math.round(settings.hybridTextWeight * 100)}%</span>
          </div>
          <p className="form-help">
            Default: 60% semantic / 40% text. In Auto mode, queries with brand names automatically shift toward text.
          </p>
        </div>
      </div>

      {/* Similarity & Ranking */}
      <div className="admin-card">
        <h2 className="admin-card-title">Similarity & Ranking</h2>
        <p className="admin-card-description">
          Adjust how search results are matched and ranked.
        </p>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
            Similarity Threshold
            <Tooltip text={'Minimum match score for a product to appear in results. Lower values show more results but reduce relevance. Higher values show fewer, more precise results.\n\nDefault: 0.30'} />
            <span className="slider-value" style={{ marginLeft: 'auto' }}>{settings.similarityThreshold.toFixed(2)}</span>
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
          <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
            Diversity Factor
            <Tooltip text={'How aggressively to limit repeat brands in results. Higher values push the system to show a wider variety of brands.\n\nDefault: 0.10'} />
            <span className="slider-value" style={{ marginLeft: 'auto' }}>{settings.diversityFactor.toFixed(2)}</span>
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
        <h2 className="admin-card-title">
          Category Weights
          <Tooltip text={'Boost or reduce how often this category appears in mixed search results. 1.0x is neutral.\n\nDoes not affect searches explicitly for this category.'} />
        </h2>
        <p className="admin-card-description">
          Boost or reduce the prominence of specific product categories in search results.
        </p>

        {['dress', 'shoes', 'bags', 'tops', 'bottoms', 'accessories'].map((category) => (
          <div className="form-group" key={category}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
              <span className="slider-value" style={{ marginLeft: 'auto' }}>
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

      <div className="admin-card">
        <h2 className="admin-card-title">Quality Filters</h2>
        <p className="admin-card-description">
          Control which products appear in search results based on quality criteria.
        </p>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
            Minimum Price Threshold
            <Tooltip text={'Products below this price are filtered from results. Helps eliminate low-quality listings.\n\nDefault: $5.00'} />
            <span className="slider-value" style={{ marginLeft: 'auto' }}>${settings.minPriceThreshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="form-slider"
            min="0"
            max="50"
            step="0.50"
            value={settings.minPriceThreshold}
            onChange={(e) =>
              setSettings({ ...settings, minPriceThreshold: parseFloat(e.target.value) })
            }
          />
          <p className="form-help">
            Products below this price will be filtered out. Set to $0 to disable. Recommended: $5-$10 for quality control.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings.enablePriceFilter}
              onChange={(e) =>
                setSettings({ ...settings, enablePriceFilter: e.target.checked })
              }
              style={{ width: 'auto' }}
            />
            Enable Price Filter
            <Tooltip text={'Toggle off to disable the minimum price filter entirely. Useful for testing or if sourcing lower price-point inventory.'} />
          </label>
          <p className="form-help">
            When enabled, products below the minimum price threshold will be hidden.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings.enableMensFilter}
              onChange={(e) =>
                setSettings({ ...settings, enableMensFilter: e.target.checked })
              }
              style={{ width: 'auto' }}
            />
            Filter Men&apos;s Products
            <Tooltip text={"Hides products explicitly marketed for men. Items marked unisex are always shown.\n\nToggle off if your catalog includes men's products."} />
          </label>
          <p className="form-help">
            When enabled, products explicitly marketed for men will be hidden. Unisex items are always shown.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings.enableNonApparelFilter}
              onChange={(e) =>
                setSettings({ ...settings, enableNonApparelFilter: e.target.checked })
              }
              style={{ width: 'auto' }}
            />
            Filter Non-Apparel Materials
            <Tooltip text={'Hides raw fabrics, upholstery materials, and crafting supplies that appear in fashion category feeds.\n\nToggle off with caution — fashion accessories (bags, belts) are always shown regardless.'} />
          </label>
          <p className="form-help">
            When enabled, raw fabrics, upholstery, and DIY materials will be hidden. Fashion accessories like bags and belts are always shown.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
