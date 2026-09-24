// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';

describe('ScrollToTopButton', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.scrollY = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders button with opacity-0 when at the top', () => {
    window.scrollY = 0;
    render(<ScrollToTopButton threshold={100} />);
    const btn = screen.getByTestId('scroll-to-top-btn');
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('opacity-0');
    expect(btn.className).toContain('pointer-events-none');
  });

  it('becomes visible when scroll offset exceeds threshold', () => {
    window.scrollY = 0;
    render(<ScrollToTopButton threshold={100} />);
    const btn = screen.getByTestId('scroll-to-top-btn');

    act(() => {
      window.scrollY = 150;
      fireEvent.scroll(window);
    });

    expect(btn.className).toContain('opacity-100');
    expect(btn.className).toContain('pointer-events-auto');
  });

  it('hides again when scrolled back to top', () => {
    window.scrollY = 150;
    render(<ScrollToTopButton threshold={100} />);
    const btn = screen.getByTestId('scroll-to-top-btn');
    expect(btn.className).toContain('opacity-100');

    act(() => {
      window.scrollY = 50;
      fireEvent.scroll(window);
    });

    expect(btn.className).toContain('opacity-0');
  });

  it('scrolls to top smoothly when clicked', () => {
    window.scrollY = 250;
    render(<ScrollToTopButton threshold={100} />);
    const btn = screen.getByTestId('scroll-to-top-btn');

    fireEvent.click(btn);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });

  it('supports custom targetId container scrolling', () => {
    const container = document.createElement('div');
    container.id = 'custom-scroll-container';
    container.scrollTo = vi.fn();
    document.body.appendChild(container);

    render(<ScrollToTopButton targetId="custom-scroll-container" threshold={100} />);
    const btn = screen.getByTestId('scroll-to-top-btn');

    act(() => {
      container.scrollTop = 150;
      fireEvent.scroll(container);
    });

    expect(btn.className).toContain('opacity-100');

    fireEvent.click(btn);
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });

    document.body.removeChild(container);
  });
});
