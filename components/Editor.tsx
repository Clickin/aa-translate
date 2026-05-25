import React, { useState, useRef, useEffect, startTransition } from 'react';
import { SelectionRange, TextSegment, ViewMode } from '../types';
import SegmentationWorker from '../workers/segmentation.worker?worker';

interface EditorProps {
  content: string;
  fileName?: string;
  onChange: (newContent: string) => void;
  onSelectionChange: (range: SelectionRange | null) => void;
  viewMode: ViewMode;
  segments: TextSegment[];
  onSegmentsChange: (segments: TextSegment[]) => void;
  isDragMode?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ 
  content,
  fileName = "",
  onChange, 
  onSelectionChange,
  viewMode,
  segments,
  onSegmentsChange,
  isDragMode = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);

  // Web Worker for segmentation
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  // Initialize and cleanup worker
  useEffect(() => {
    const worker = new SegmentationWorker();
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Drag Selection State
  const dragOverlayRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    pointerId: number | null;
    start: { x: number; y: number } | null;
    current: { x: number; y: number } | null;
  }>({
    isDragging: false,
    pointerId: null,
    start: null,
    current: null,
  });

  // --- Raw Mode Logic ---
  const handleSelect = () => {
    if (viewMode !== 'raw') return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    if (start !== end && text.trim().length > 0) {
      onSelectionChange({ start, end, text });
    } else {
      onSelectionChange(null);
    }
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Reset segments to trigger re-segmentation when switching back to smart mode
    if (segments.length > 0) {
      onSegmentsChange([]);
    }
  };

  // --- Smart Mode Logic (Parsing via Web Worker) ---
  // Stable callback ref to avoid re-triggering the effect when onSegmentsChange identity changes
  const onSegmentsChangeRef = useRef(onSegmentsChange);
  onSegmentsChangeRef.current = onSegmentsChange;

  useEffect(() => {
    if (viewMode === 'smart' && segments.length === 0 && content) {
      const worker = workerRef.current;
      if (!worker) return;

      // Increment request ID to ignore stale results
      const currentRequestId = ++requestIdRef.current;

      const handleMessage = (e: MessageEvent<{ type: string; requestId: number; segments: TextSegment[] }>) => {
        if (e.data.type === 'result' && e.data.requestId === currentRequestId) {
          // Use startTransition so React can yield to the browser between renders,
          // preventing the UI (and other Chrome tabs) from freezing on large files.
          startTransition(() => {
            onSegmentsChangeRef.current(e.data.segments);
          });
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type: 'segment', content, requestId: currentRequestId });

      return () => {
        worker.removeEventListener('message', handleMessage);
      };
    }
  }, [content, viewMode, segments.length]);

  const toggleSegmentSelection = (id: string) => {
    const newSegments = segments.map(s => 
      s.id === id && !s.isTranslated ? { ...s, isSelected: !s.isSelected } : s
    );
    onSegmentsChange(newSegments);
    onSelectionChange(null); 
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setFontSize(prev => Math.min(Math.max(10, prev - Math.sign(e.deltaY)), 32));
    }
  };

  // --- Pointer Events for Robust Dragging ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDragMode || viewMode !== 'smart' || !e.isPrimary || e.button !== 0) return;
    
    // Prevent default browser actions (text selection etc)
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    // Capture pointer to ensure we receive events even if cursor leaves the container
    container.setPointerCapture(e.pointerId);
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    
    dragStateRef.current = {
      isDragging: true,
      pointerId: e.pointerId,
      start: { x, y },
      current: { x, y },
    };

    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.left = `${x}px`;
      overlay.style.top = `${y}px`;
      overlay.style.width = '0px';
      overlay.style.height = '0px';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.start || dragState.pointerId !== e.pointerId) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    
    dragState.current = { x, y };

    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.left = `${Math.min(dragState.start.x, x)}px`;
      overlay.style.top = `${Math.min(dragState.start.y, y)}px`;
      overlay.style.width = `${Math.abs(x - dragState.start.x)}px`;
      overlay.style.height = `${Math.abs(y - dragState.start.y)}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || dragState.pointerId !== e.pointerId || !dragState.start || !dragState.current) {
      if (dragState.isDragging && dragState.pointerId === e.pointerId) {
        resetDragState(e.pointerId);
      }
      return;
    }
    
    releasePointerCapture(e.pointerId);

    // Calculate selection box
    const x1 = Math.min(dragState.start.x, dragState.current.x);
    const y1 = Math.min(dragState.start.y, dragState.current.y);
    const x2 = Math.max(dragState.start.x, dragState.current.x);
    const y2 = Math.max(dragState.start.y, dragState.current.y);

    // Calculate minimal drag distance to differentiate from click
    const dist = Math.sqrt(Math.pow(dragState.current.x - dragState.start.x, 2) + Math.pow(dragState.current.y - dragState.start.y, 2));
    const isClick = dist < 5; 

    if (!isClick) {
        // Find intersecting segments
        const newSegments = segments.map(seg => {
          if (!seg.isJapanese || seg.isTranslated) return seg;

          const el = document.getElementById(seg.id);
          if (el && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();

            // Calculate element position relative to container content
            const elLeft = elRect.left - containerRect.left + containerRef.current.scrollLeft;
            const elTop = elRect.top - containerRect.top + containerRef.current.scrollTop;
            const elRight = elLeft + elRect.width;
            const elBottom = elTop + elRect.height;

            // Check intersection
            const isIntersecting = !(elRight < x1 || elLeft > x2 || elBottom < y1 || elTop > y2);

            if (isIntersecting) {
              return { ...seg, isSelected: true };
            }
          }
          return seg;
        });
        onSegmentsChange(newSegments);
    }

    resetDragState(e.pointerId);
  };

  const resetDragState = (pointerId: number) => {
    releasePointerCapture(pointerId);
    dragStateRef.current = {
      isDragging: false,
      pointerId: null,
      start: null,
      current: null,
    };

    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.width = '0px';
      overlay.style.height = '0px';
    }
  };

  const releasePointerCapture = (pointerId: number) => {
    const container = containerRef.current;
    if (container?.hasPointerCapture(pointerId)) {
      container.releasePointerCapture(pointerId);
    }
  };

  // Determine Background Color for Viewer Mode
  const getViewerBackgroundColor = () => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.mlt') || lowerName.endsWith('.ast')) {
      return '#F0E0D6'; // Classic AA Beige
    }
    return '#FAFAFA'; // Off-white for generic text
  };

  // Render Content based on ViewMode
  if (viewMode === 'viewer') {
    return (
       <div className="relative w-full h-full flex flex-col">
         <div className="aa-editor-control absolute top-2 right-4 z-10 flex gap-2 backdrop-blur p-1 rounded-md">
            <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="rounded px-2 py-1 text-xs">A-</button>
            <span className="px-2 py-1 text-xs font-mono">{fontSize}px</span>
            <button onClick={() => setFontSize(f => Math.min(32, f + 1))} className="rounded px-2 py-1 text-xs">A+</button>
         </div>
         <div
            className="w-full h-full p-4 overflow-auto whitespace-pre font-aa leading-tight select-text text-[#2e2e2e]"
            style={{ 
                fontSize: `${fontSize}px`,
                backgroundColor: getViewerBackgroundColor()
            }}
            onWheel={handleWheel}
          >
            {content}
          </div>
       </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Font Controls */}
      <div className="aa-editor-control absolute top-2 right-4 z-10 flex gap-2 rounded-md p-1 backdrop-blur">
        <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="rounded px-2 py-1 text-xs">A-</button>
        <span className="px-2 py-1 text-xs">{fontSize}px</span>
        <button onClick={() => setFontSize(f => Math.min(32, f + 1))} className="rounded px-2 py-1 text-xs">A+</button>
      </div>

      {viewMode === 'raw' ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleRawChange}
          onSelect={handleSelect}
          onMouseUp={handleSelect}
          onKeyUp={handleSelect}
          onWheel={handleWheel}
          spellCheck={false}
          className="aa-editor w-full h-full p-4 resize-none focus:outline-none font-aa leading-tight"
          style={{ fontSize: `${fontSize}px` }}
        />
      ) : (
        <div 
          ref={containerRef}
          className={`aa-editor relative h-full w-full overflow-auto whitespace-pre p-4 font-aa leading-tight select-none ${isDragMode ? 'cursor-crosshair' : ''} touch-none`}
          style={{ fontSize: `${fontSize}px` }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={(e) => resetDragState(e.pointerId)}
        >
           {segments.map((seg) => {
             if (seg.isJapanese) {
               return (
                 <span
                   key={seg.id}
                   id={seg.id}
                   onClick={(e) => {
                     e.stopPropagation();
                     toggleSegmentSelection(seg.id);
                   }}
                   className={`
                     rounded px-0.5 transition-colors duration-75 inline-block
                     ${!isDragMode && !seg.isTranslated && 'cursor-pointer'}
                     ${seg.isTranslated
                        ? 'aa-aa-translated pointer-events-none'
                        : seg.isSelected
                            ? 'aa-aa-selected'
                            : 'aa-aa-japanese'
                     }
                     ${!seg.isTranslated && !seg.isSelected && 'underline decoration-dotted'}
                   `}
                 >
                   {seg.text}
                 </span>
               );
             }
             return <span key={seg.id} className="aa-aa-faint pointer-events-none">{seg.text}</span>;
           })}

           {/* Selection Box Overlay */}
           <div 
             ref={dragOverlayRef}
             className="aa-selection-box absolute hidden pointer-events-none z-20"
           />
        </div>
      )}
    </div>
  );
};
