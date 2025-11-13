import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, onSubmit, loading }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Describe what you're looking for (e.g., 'black fitted midi dress with square neckline, minimal, no cutouts')"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button
        className="search-button"
        onClick={onSubmit}
        disabled={loading || value.trim().length < 3}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
