import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeSettings } from './ThemeSettings';
import { ThemeProvider } from '../../theme/ThemeContext';

describe('ThemeSettings Component', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('lapdev-theme');
    localStorage.removeItem('lapdev-theme-follow-system');
  });

  it('[P0] should render theme settings panel', () => {
    renderWithProvider(<ThemeSettings />);
    
    const panel = screen.getByText('主题');
    expect(panel).toBeInTheDocument();
  });

  it('[P0] should display follow system checkbox', () => {
    renderWithProvider(<ThemeSettings />);
    
    const checkbox = screen.getByLabelText('跟随系统主题');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('[P0] should show theme cards when follow system is off', () => {
    renderWithProvider(<ThemeSettings />);
    
    // Should show theme cards by default (follow system is off)
    expect(screen.getByText('深色')).toBeInTheDocument();
    expect(screen.getByText('浅色')).toBeInTheDocument();
    expect(screen.getByText('高对比度')).toBeInTheDocument();
    expect(screen.getByText('Solarized Dark')).toBeInTheDocument();
    expect(screen.getByText('Solarized Light')).toBeInTheDocument();
  });

  it('[P0] should hide theme cards when follow system is on', () => {
    renderWithProvider(<ThemeSettings />);
    
    const checkbox = screen.getByLabelText('跟随系统主题');
    fireEvent.click(checkbox);
    
    // Theme cards should be hidden
    expect(screen.queryByText('深色')).not.toBeInTheDocument();
    expect(screen.queryByText('浅色')).not.toBeInTheDocument();
  });

  it('[P0] should toggle follow system setting', () => {
    renderWithProvider(<ThemeSettings />);
    
    const checkbox = screen.getByLabelText('跟随系统主题');
    
    // Initially unchecked
    expect(checkbox).not.toBeChecked();
    
    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Click to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('[P1] should persist follow system setting to localStorage', () => {
    renderWithProvider(<ThemeSettings />);
    
    const checkbox = screen.getByLabelText('跟随系统主题');
    
    fireEvent.click(checkbox);
    expect(localStorage.getItem('lapdev-theme-follow-system')).toBe('true');
    
    fireEvent.click(checkbox);
    expect(localStorage.getItem('lapdev-theme-follow-system')).toBe('false');
  });

  it('[P1] should restore follow system setting from localStorage', () => {
    localStorage.setItem('lapdev-theme-follow-system', 'true');
    
    renderWithProvider(<ThemeSettings />);
    
    const checkbox = screen.getByLabelText('跟随系统主题');
    expect(checkbox).toBeChecked();
    expect(screen.queryByText('深色')).not.toBeInTheDocument();
  });

  it('[P0] should select a theme when clicking theme card', () => {
    renderWithProvider(<ThemeSettings />);
    
    const darkThemeCard = screen.getByText('深色');
    fireEvent.click(darkThemeCard.parentElement!);
    
    expect(localStorage.getItem('lapdev-theme')).toBe('dark');
  });

  it('[P1] should mark selected theme with ring highlight', () => {
    renderWithProvider(<ThemeSettings />);
    
    // Select Solarized Dark theme
    const solarizedDarkCard = screen.getByText('Solarized Dark').parentElement!.parentElement!;
    fireEvent.click(solarizedDarkCard);
    
    // The clicked card should have ring-2 class
    expect(solarizedDarkCard).toHaveClass('ring-2');
  });

  it('[P2] should show theme descriptions', () => {
    renderWithProvider(<ThemeSettings />);
    
    expect(screen.getByText('适合夜间工作的深色主题')).toBeInTheDocument();
    expect(screen.getByText('明亮清新的浅色主题')).toBeInTheDocument();
    expect(screen.getByText('适合视力障碍用户的高对比度主题')).toBeInTheDocument();
  });
});