'use client';

import { useState, useRef, useEffect } from 'react';

interface FeedbackPopoverProps {
  onSubmit: (text: string) => void;
  onDismiss: () => void;
}

export function FeedbackPopover({ onSubmit, onDismiss }: FeedbackPopoverProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when popover opens
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onSubmit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
    // Ctrl+Enter or Cmd+Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        position: 'relative',
        zIndex: 10,
        animation: 'feedbackSlideIn 0.15s ease-out',
      }}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        @keyframes feedbackSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
            Why wasn&apos;t this relevant?
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
            Optional — helps us improve your results
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss feedback"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: '2px 4px',
            fontSize: '16px',
            lineHeight: 1,
            marginLeft: '8px',
            borderRadius: '4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. wrong style, wrong color, too expensive, not my size..."
        rows={3}
        style={{
          width: '100%',
          fontSize: '12px',
          color: '#334155',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '8px 10px',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.5,
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
        maxLength={500}
      />
      <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'right', marginTop: '2px' }}>
        {text.length}/500
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#64748b',
            background: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#fff',
            background: text.trim().length === 0 ? '#cbd5e1' : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            cursor: text.trim().length === 0 ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (text.trim().length > 0) e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            if (text.trim().length > 0) e.currentTarget.style.background = '#3b82f6';
          }}
        >
          Send Feedback
        </button>
      </div>
    </div>
  );
}
