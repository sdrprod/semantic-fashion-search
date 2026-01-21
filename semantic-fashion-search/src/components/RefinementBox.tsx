import React, { useState } from "react";

interface RefinementBoxProps {
  value: string;
  onChange: (value: string) => void;
  onRefine: () => void;
  loading: boolean;
  show: boolean;
}

export function RefinementBox({ value, onChange, onRefine, loading, show }: RefinementBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!show) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onRefine();
    }
  };

  return (
    <div className="refinement-container">
      <button
        className="refinement-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loading}
      >
        <span className="refinement-toggle-icon">{isExpanded ? "▼" : "▶"}</span>
        Not quite right?
      </button>

      {isExpanded && (
        <div className="refinement-box">
          <label className="refinement-label">
            Refine your search with additional details:
          </label>
          <textarea
            className="refinement-input"
            placeholder='For example: "I don\'t want dresses. I was thinking about pants or a long skirt with a blouse and sweater"'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={3}
          />
          <div className="refinement-actions">
            <button
              className="refinement-button"
              onClick={onRefine}
              disabled={loading || value.trim().length < 3}
            >
              {loading ? "Refining..." : "Refine Search"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
