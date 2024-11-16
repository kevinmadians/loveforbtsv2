import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullDownThreshold?: number;
  maxPullDown?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDown = 120
}: PullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top
      if (window.scrollY > 0) return;
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      const touchY = e.touches[0].clientY;
      const distance = Math.max(0, touchY - touchStartY.current);
      
      // Apply resistance to the pull
      const pullWithResistance = Math.min(maxPullDown, distance * 0.4);
      setPullDistance(pullWithResistance);

      // Prevent default scrolling when pulling
      if (window.scrollY === 0 && distance > 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);
      
      if (pullDistance >= pullDownThreshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh, pullDownThreshold, maxPullDown]);

  return {
    containerRef,
    pullDistance,
    isRefreshing
  };
};
