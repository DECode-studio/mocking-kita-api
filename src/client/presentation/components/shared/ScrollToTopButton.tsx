'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';

export interface ScrollToTopButtonProps {
  /**
   * The scroll offset in pixels after which the button becomes visible.
   * Defaults to 200.
   */
  threshold?: number;
  /**
   * Optional custom container ID to observe and scroll instead of window.
   */
  targetId?: string;
  /**
   * Additional custom CSS classes.
   */
  className?: string;
  /**
   * Accessible label for screen readers. Defaults to 'Scroll to top'.
   */
  ariaLabel?: string;
  /**
   * Whether to scroll smoothly. Defaults to true.
   */
  smooth?: boolean;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  threshold = 200,
  targetId,
  className,
  ariaLabel = 'Scroll to top',
  smooth = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const getScrollTop = () => {
      if (targetId) {
        const el = document.getElementById(targetId);
        return el ? el.scrollTop : 0;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const handleScroll = () => {
      const scrollTop = getScrollTop();
      setIsVisible(scrollTop > threshold);
    };

    // Evaluate initial position
    handleScroll();

    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.addEventListener('scroll', handleScroll, { passive: true });
        return () => targetElement.removeEventListener('scroll', handleScroll);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, targetId]);

  const scrollToTop = () => {
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'auto',
        });
        return;
      }
    }

    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  return (
    <button
      id="scroll-to-top-btn"
      data-testid="scroll-to-top-btn"
      type="button"
      onClick={scrollToTop}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'fixed bottom-6 right-6 z-40 p-3 rounded-full cursor-pointer',
        'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md',
        'border border-slate-200/90 dark:border-slate-800/90',
        'shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25',
        'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400',
        'hover:border-purple-500/50 hover:scale-110 active:scale-95',
        'transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.25]" />
    </button>
  );
};

export default ScrollToTopButton;
