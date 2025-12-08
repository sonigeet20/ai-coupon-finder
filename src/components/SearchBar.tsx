import React, { useState, useRef } from 'react';


interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  suggestions: string[];
  loading: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  suggestions,
  loading,
  placeholder = 'Search brands, deals, categories...'
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // ...existing code...

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // ...existing code...

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl glass transition-all"
        autoComplete="off"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
      <button
        onClick={() => { onSearch(); setShowSuggestions(false); }}
        className="absolute right-2 top-2 px-4 py-2 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:scale-105"
        disabled={loading}
      >
        {loading ? (
          <span className="animate-spin h-5 w-5 border-2 border-purple-200 border-t-purple-600 rounded-full inline-block"></span>
        ) : (
          'Search'
        )}
      </button>
      {showSuggestions && value.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-50">
          <div className="px-4 py-2 text-sm text-purple-600 font-semibold bg-white rounded-t-xl border-b border-purple-100">
            <span className="text-black">Brand Name Suggestions (powered by AI)</span>
            <span className="block text-xs text-gray-700 mt-1">Type a brand or keyword and get smart brand name suggestions from AI.</span>
          </div>
          <ul className="bg-white rounded-b-xl shadow-lg animate-fade-in">
            {loading && (
              <li className="px-4 py-4 flex justify-center items-center">
                <span className="animate-spin h-5 w-5 border-2 border-purple-200 border-t-purple-600 rounded-full inline-block"></span>
                <span className="ml-2 text-gray-500">Loading suggestions...</span>
              </li>
            )}
            {!loading && suggestions.length > 0 && (
              suggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 cursor-pointer hover:bg-purple-50 transition-all text-black bg-white"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  {s}
                </li>
              ))
            )}
            {!loading && suggestions.length === 0 && (
              <li className="px-4 py-4 text-center text-gray-400">No brand suggestions found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
