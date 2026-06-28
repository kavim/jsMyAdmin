import { useCallback, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  defaultRatio?: number;
  minFirst?: number;
  minSecond?: number;
  first: ReactNode;
  second: ReactNode;
  className?: string;
}

export function SplitPane({
  direction,
  defaultRatio = 0.5,
  minFirst = 0.12,
  minSecond = 0.12,
  first,
  second,
  className,
}: SplitPaneProps) {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const isVertical = direction === 'vertical';

  const updateRatio = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const raw = isVertical
        ? (clientY - rect.top) / rect.height
        : (clientX - rect.left) / rect.width;

      setRatio(Math.min(1 - minSecond, Math.max(minFirst, raw)));
    },
    [isVertical, minFirst, minSecond]
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateRatio(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateRatio(event.clientX, event.clientY);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full min-h-0 min-w-0 overflow-hidden',
        isVertical ? 'flex-col' : 'flex-row',
        className
      )}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={{ flex: `${ratio} 1 0%` }}
      >
        {first}
      </div>

      <div
        role="separator"
        aria-orientation={isVertical ? 'horizontal' : 'vertical'}
        className={cn(
          'panel-resize-handle shrink-0 touch-none select-none',
          isVertical ? 'panel-resize-handle-y' : 'panel-resize-handle-x'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      />

      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={{ flex: `${1 - ratio} 1 0%` }}
      >
        {second}
      </div>
    </div>
  );
}
