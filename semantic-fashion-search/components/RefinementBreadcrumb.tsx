'use client';

import React from 'react';
import type { RefinementLevel } from '@/types';

interface RefinementBreadcrumbProps {
  levels: RefinementLevel[];
  currentLevel: number;
  onSelectLevel: (levelIndex: number) => void;
  onClearAll: () => void;
}

export default function RefinementBreadcrumb({
  levels,
  currentLevel,
  onSelectLevel,
  onClearAll,
}: RefinementBreadcrumbProps) {
  if (levels.length === 0) return null;

  return (
    <div style={styles.container}>
      <nav style={styles.nav} aria-label="Refinement breadcrumb">
        <ol style={styles.breadcrumbList}>
          {levels.map((level, idx) => (
            <li key={idx} style={styles.breadcrumbItem}>
              <button
                onClick={() => onSelectLevel(idx)}
                style={{
                  ...styles.breadcrumbButton,
                  ...(idx === currentLevel ? styles.breadcrumbButtonActive : {}),
                }}
                className={idx === currentLevel ? 'active' : ''}
              >
                {level.refinementQuery || level.query}
                <span style={styles.resultCount}>({level.totalCount})</span>
              </button>
              {idx < levels.length - 1 && <span style={styles.separator}>/</span>}
            </li>
          ))}
        </ol>
      </nav>

      {/* Clear Filters link - spaced away from breadcrumb for mobile tap targets */}
      <div style={styles.clearFiltersContainer}>
        <button onClick={onClearAll} style={styles.clearFiltersButton}>
          Clear Filters
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1.5rem',
    padding: '1rem 0',
    marginBottom: '1rem',
  } as React.CSSProperties,

  nav: {
    flex: '1 1 auto',
    minWidth: '0', // Allow flex-wrap to work properly
  } as React.CSSProperties,

  breadcrumbList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    alignItems: 'center',
  } as React.CSSProperties,

  breadcrumbItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,

  breadcrumbButton: {
    background: 'none',
    border: 'none',
    color: '#c17b4b',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s, color 0.2s',
    fontFamily: 'inherit',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  } as React.CSSProperties,

  breadcrumbButtonActive: {
    fontWeight: '700',
    textDecoration: 'underline',
    color: '#8b5a3c',
  } as React.CSSProperties,

  resultCount: {
    fontSize: '0.875rem',
    fontWeight: 'normal',
    color: '#999',
  } as React.CSSProperties,

  separator: {
    color: '#d4ccc4',
    margin: '0 0.25rem',
  } as React.CSSProperties,

  clearFiltersContainer: {
    flex: '0 0 auto',
    display: 'flex',
  } as React.CSSProperties,

  clearFiltersButton: {
    background: 'none',
    border: 'none',
    color: '#c17b4b',
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    textDecoration: 'underline',
    fontFamily: 'inherit',
    transition: 'color 0.2s',
  } as React.CSSProperties,
};
