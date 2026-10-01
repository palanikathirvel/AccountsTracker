import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Palette, Check } from 'lucide-react';

export default function ThemeSelector({ compact = false }) {
  const { theme, setTheme, themes, currentThemeObj, toggleLightDark, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-selector-container" ref={dropdownRef}>
      {/* Quick 1-click Light/Dark Toggle */}
      <button
        type="button"
        className="btn-theme-quick-toggle"
        onClick={toggleLightDark}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle light or dark theme"
      >
        {isDark ? <Sun className="icon-theme" size={16} /> : <Moon className="icon-theme" size={16} />}
      </button>

      {/* Theme Palette Dropdown Button */}
      {!compact && (
        <div className="theme-palette-wrapper">
          <button
            type="button"
            className="btn-theme-menu"
            onClick={() => setIsOpen(!isOpen)}
            title="Choose Visual Theme"
            aria-expanded={isOpen}
          >
            <Palette size={15} />
            <span className="theme-current-name">{currentThemeObj.name}</span>
            <span className="theme-swatch-dot" style={{ backgroundColor: currentThemeObj.color }}></span>
          </button>

          {isOpen && (
            <div className="theme-dropdown-menu">
              <div className="theme-dropdown-header">
                <span>Select Color Theme</span>
              </div>
              <div className="theme-options-list">
                {themes.map((t) => {
                  const isSelected = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-option-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(t.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="theme-option-icon">{t.icon}</span>
                      <div className="theme-option-text">
                        <span className="theme-option-title">{t.name}</span>
                        <span className="theme-option-badge">{t.badge}</span>
                      </div>
                      <div
                        className="theme-color-preview"
                        style={{ background: `linear-gradient(135deg, ${t.bg} 40%, ${t.color} 100%)` }}
                      ></div>
                      {isSelected && <Check size={14} className="theme-check-icon" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
