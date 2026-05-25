
import React from 'react';
import { Wand2, X, Loader2, RotateCcw, ScanSearch, Type, MousePointer2, Eye } from 'lucide-react';
import { SelectionRange, ViewMode } from '../types';

interface ToolbarProps {
  selection: SelectionRange | null;
  isTranslating: boolean;
  onTranslate: () => void;
  onClearSelection: () => void;
  lastTranslation: { original: string; translated: string } | null;
  onUndo: () => void;
  
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  smartSelectionCount: number;
  onSmartTranslate: () => void;

  isDragMode?: boolean;
  onToggleDragMode?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  selection, 
  isTranslating, 
  onTranslate, 
  onClearSelection,
  lastTranslation,
  onUndo,
  viewMode,
  onChangeViewMode,
  smartSelectionCount,
  onSmartTranslate,
  isDragMode,
  onToggleDragMode
}) => {
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full max-w-3xl px-3 pointer-events-none sm:bottom-8 sm:px-4">
      
      <div className="aa-toolbar flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg p-2 shadow-2xl backdrop-blur-md pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
        
        <div className="aa-toolbar-group flex rounded-md p-1 sm:mr-2">
            <button
                onClick={() => onChangeViewMode('raw')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    viewMode === 'raw' 
                    ? 'aa-button-active shadow'
                    : 'aa-muted hover:bg-[var(--aa-surface)] hover:text-[var(--aa-text)]'
                }`}
                title="텍스트 편집 모드"
            >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">편집</span>
            </button>
            <button
                onClick={() => onChangeViewMode('smart')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    viewMode === 'smart' 
                    ? 'aa-button-active shadow'
                    : 'aa-muted hover:bg-[var(--aa-surface)] hover:text-[var(--aa-text)]'
                }`}
                title="자동 감지 번역 모드"
            >
                <ScanSearch className="w-4 h-4" />
                <span className="hidden sm:inline">스마트</span>
            </button>
            <button
                onClick={() => onChangeViewMode('viewer')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    viewMode === 'viewer' 
                    ? 'aa-button-active shadow'
                    : 'aa-muted hover:bg-[var(--aa-surface)] hover:text-[var(--aa-text)]'
                }`}
                title="읽기 전용 뷰어 모드 (Light Mode)"
            >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">뷰어</span>
            </button>
        </div>

        {viewMode !== 'viewer' && <div className="aa-rule hidden h-8 w-px mx-1 sm:block"></div>}

        {viewMode === 'viewer' ? (
             <span className="aa-subtle text-sm px-4">읽기 전용 모드입니다</span>
        ) : viewMode === 'raw' ? (
             selection ? (
                <>
                    <span className="aa-muted text-sm font-mono max-w-[120px] truncate ml-2">
                        {selection.text}
                    </span>
                    <button
                        onClick={onTranslate}
                        disabled={isTranslating}
                        className="aa-button-primary flex items-center gap-2 rounded px-4 py-2 font-medium transition-colors"
                    >
                        {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        번역
                    </button>
                    <button onClick={onClearSelection} className="aa-button rounded p-2"><X className="w-4 h-4" /></button>
                </>
             ) : (
                 <span className="aa-subtle text-sm px-4">텍스트를 드래그하세요</span>
             )
        ) : (
            <>
                <button 
                    onClick={onToggleDragMode}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      isDragMode 
                        ? 'aa-button-active'
                        : 'aa-muted hover:bg-[var(--aa-surface)] hover:text-[var(--aa-text)]'
                    }`}
                    title="드래그 선택 모드 켜기/끄기"
                >
                    <MousePointer2 className="w-4 h-4" />
                    드래그
                </button>

                {smartSelectionCount > 0 && (
                    <>
                        <div className="aa-rule mx-1 hidden h-8 w-px sm:block"></div>
                        <span className="aa-linkish text-sm font-bold ml-1 whitespace-nowrap">{smartSelectionCount}개 선택됨</span>
                        <button
                            onClick={onSmartTranslate}
                            disabled={isTranslating}
                            className="aa-button-primary flex items-center gap-2 rounded px-4 py-2 font-medium transition-colors"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>처리 중...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    <span>일괄 번역</span>
                                </>
                            )}
                        </button>
                    </>
                )}
                {smartSelectionCount === 0 && !isDragMode && <span className="aa-subtle text-sm px-4">클릭하여 선택</span>}
                {smartSelectionCount === 0 && isDragMode && <span className="aa-linkish text-sm px-4 animate-pulse">드래그하여 선택...</span>}
            </>
        )}

      </div>

      {lastTranslation && (
         <div className="aa-panel flex items-center gap-3 rounded-full px-4 py-2 shadow-xl backdrop-blur pointer-events-auto animate-in fade-in zoom-in duration-300">
            <span className="text-xs">작업 완료</span>
            <button 
                onClick={onUndo}
                className="aa-button flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors"
            >
                <RotateCcw className="w-3 h-3" />
                되돌리기
            </button>
         </div>
      )}
    </div>
  );
};
