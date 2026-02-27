'use client';

import React, { useState } from 'react';

interface RefinementBoxProps {
  placeholder?: string;
  onRefine: (query: string) => void;
  isLoading?: boolean;
  canRefine: boolean;
  currentResults: number;
}

const EXAMPLE_REFINEMENTS = [
  'Summer colors or neutrals only',
  'Under $50 or luxury brands',
  'Casual vibes or formal occasion',
  'Sustainable or eco-friendly',
  'Cotton material, breathable',
  'Popular with 4+ stars',
];

export default function RefinementBox({
  placeholder = "Want to narrow it down? Try 'punk style, chunky heels' or 'only winter boots'",
  onRefine,
  isLoading = false,
  canRefine = true,
  currentResults = 0,
}: RefinementBoxProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !canRefine || isLoading) return;

    onRefine(input.trim());
    setInput('');
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="refinement-box-container" style={styles.container}>
      <div style={styles.boxContent}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={!canRefine || isLoading}
              style={{
                ...styles.input,
                opacity: canRefine && !isLoading ? 1 : 0.6,
                cursor: canRefine && !isLoading ? 'text' : 'not-allowed',
              }}
              className="refinement-input"
            />
            {input && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                style={styles.clearBtn}
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={!input.trim() || !canRefine || isLoading}
              style={{
                ...styles.button,
                ...styles.submitBtn,
                opacity: !input.trim() || !canRefine || isLoading ? 0.5 : 1,
                cursor:
                  !input.trim() || !canRefine || isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Refining...' : 'Refine Results'}
            </button>
          </div>

          {!canRefine && (
            <div style={styles.maxLevelWarning}>
              Max refinement levels reached. Click breadcrumb to go back.
            </div>
          )}
        </form>

        {/* Help text with example refinements */}
        <div style={styles.helpSection}>
          <p style={styles.helpTitle}>Try refining with natural language:</p>
          <ul style={styles.exampleList}>
            {EXAMPLE_REFINEMENTS.map((example, idx) => (
              <li key={idx} style={styles.exampleItem}>
                {example}
              </li>
            ))}
          </ul>
        </div>

        {currentResults > 0 && (
          <div style={styles.resultCount}>
            Currently showing {currentResults} result{currentResults !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9f7f4',
    borderRadius: '8px',
    border: '1px solid #e8e0d8',
  } as React.CSSProperties,

  boxContent: {
    maxWidth: '100%',
  } as React.CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  } as React.CSSProperties,

  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #d4ccc4',
    borderRadius: '6px',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,

  clearBtn: {
    position: 'absolute' as const,
    right: '0.75rem',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    color: '#999',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    lineHeight: '1',
    transition: 'color 0.2s',
  } as React.CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,

  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '6px',
    border: 'none',
    transition: 'background-color 0.2s, transform 0.1s',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  submitBtn: {
    backgroundColor: '#c17b4b',
    color: 'white',
  } as React.CSSProperties,

  maxLevelWarning: {
    fontSize: '0.875rem',
    color: '#d4a574',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  } as React.CSSProperties,

  helpSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e8e0d8',
  } as React.CSSProperties,

  helpTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#666',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,

  exampleList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.5rem',
  } as React.CSSProperties,

  exampleItem: {
    fontSize: '0.85rem',
    color: '#888',
    padding: '0.25rem 0',
  } as React.CSSProperties,

  resultCount: {
    fontSize: '0.875rem',
    color: '#999',
    marginTop: '0.75rem',
    fontStyle: 'italic',
  } as React.CSSProperties,
};
