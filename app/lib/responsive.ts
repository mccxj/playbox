'use client';

import { useEffect, useState, useCallback } from 'react';
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screens: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    xxl: boolean;
  };
}

export function useResponsive(): ResponsiveState {
  const screens = useBreakpoint();
  const isMobile = (screens.xs || screens.sm) && !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg || screens.xl || screens.xxl;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screens: {
      xs: !!screens.xs,
      sm: !!screens.sm,
      md: !!screens.md,
      lg: !!screens.lg,
      xl: !!screens.xl,
      xxl: !!screens.xxl,
    },
  };
}

export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useResponsive();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive();
  return isDesktop;
}

export function useMobileModalWidth(): number | '100%' {
  const [width, setWidth] = useState<number | '100%'>(600);

  const updateWidth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    if (vw < 576) {
      setWidth('100%');
    } else if (vw < 768) {
      setWidth(Math.min(600, vw - 32));
    } else {
      setWidth(600);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateWidth]);

  return width;
}

export function useMobileDrawerWidth(): string {
  const [width, setWidth] = useState('80%');

  const updateWidth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    if (vw < 576) {
      setWidth('85%');
    } else if (vw < 768) {
      setWidth('70%');
    } else {
      setWidth('50%');
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateWidth]);

  return width;
}
