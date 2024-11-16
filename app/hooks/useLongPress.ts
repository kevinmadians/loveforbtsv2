import { useCallback, useRef, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
}

export const useLongPress = ({
  onLongPress,
  onClick,
  threshold = 500
}: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!targetRef.current) return;
    e.preventDefault();
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback((e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (!targetRef.current) return;
    e.preventDefault();
    timeoutRef.current && clearTimeout(timeoutRef.current);
    if (shouldTriggerClick && !isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const eventHandlers = {
    onTouchStart: start,
    onTouchEnd: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    ref: targetRef
  };

  return eventHandlers;
};
