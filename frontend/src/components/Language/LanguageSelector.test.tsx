import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanguageSelector } from './LanguageSelector';
import i18n from '../../i18n';

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset i18n to English by default
    i18n.changeLanguage('en');
  });

  it('[P0] should render language selector', () => {
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('[P0] should render Globe icon', () => {
    const { container } = render(<LanguageSelector />);
    
    const icon = container.querySelector('.language-selector-icon');
    expect(icon).toBeInTheDocument();
  });

  it('[P0] should show English and Chinese options', () => {
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('[P0] should default to English', () => {
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    expect(selector).toHaveValue('en');
  });

  it('[P0] should change language when selecting option', () => {
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    
    // Change to Chinese
    fireEvent.change(selector, { target: { value: 'zh' } });
    expect(i18n.language).toBe('zh');
    
    // Change back to English
    fireEvent.change(selector, { target: { value: 'en' } });
    expect(i18n.language).toBe('en');
  });

  it('[P1] should persist language to localStorage', () => {
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    
    fireEvent.change(selector, { target: { value: 'zh' } });
    expect(localStorage.getItem('i18nextLng')).toBe('zh');
    
    fireEvent.change(selector, { target: { value: 'en' } });
    expect(localStorage.getItem('i18nextLng')).toBe('en');
  });

  it('[P1] should restore language from localStorage', () => {
    localStorage.setItem('i18nextLng', 'zh');
    i18n.changeLanguage('zh');
    
    render(<LanguageSelector />);
    
    const selector = screen.getByRole('combobox');
    expect(selector).toHaveValue('zh');
  });

  it('[P2] should accept custom className', () => {
    const { container } = render(<LanguageSelector className="custom-class" />);
    
    const wrapper = container.querySelector('.language-selector-container');
    expect(wrapper).toHaveClass('custom-class');
  });
});