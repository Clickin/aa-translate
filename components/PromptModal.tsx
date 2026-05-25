
import React, { useState, useEffect } from 'react';
import { X, MessageSquareQuote, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT } from '../services/translationService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  setSystemPrompt,
}) => {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);

  useEffect(() => {
    if (isOpen) {
      setLocalPrompt(systemPrompt);
    }
  }, [isOpen, systemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSystemPrompt(localPrompt);
    onClose();
  };

  const handleReset = () => {
    setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  return (
    <div className="aa-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="aa-modal flex max-h-[85vh] w-full max-w-2xl flex-col rounded-md shadow-2xl">
        <div className="aa-modal-header flex items-center justify-between border-b p-6">
          <h2 className="aa-title flex items-center gap-2 text-xl font-bold">
            <MessageSquareQuote className="aa-linkish w-5 h-5" />
            번역 프롬프트 설정
          </h2>
          <button onClick={onClose} className="aa-muted hover:text-[var(--aa-text)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <p className="aa-muted mb-4 text-sm">
            AI에게 전달될 기본 지시사항(System Prompt)을 수정합니다. 번역의 어조, 스타일, 캐릭터성 등을 정의할 수 있습니다.
            <br />
            <span className="aa-subtle text-xs">* 기술적인 포맷(JSON 등)과 사전 규칙은 자동으로 덧붙여지므로 여기서 신경 쓰지 않아도 됩니다.</span>
          </p>

          <div className="relative flex-1">
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              className="aa-input h-full w-full resize-none rounded-md p-4 font-mono text-sm leading-relaxed custom-scrollbar"
              placeholder="AI에게 내릴 지시사항을 입력하세요..."
            />
            <div className="absolute bottom-4 right-4">
                <button 
                    onClick={handleReset}
                    className="aa-button flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors shadow-lg"
                    title="기본값으로 초기화"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    초기화
                </button>
            </div>
          </div>
        </div>

        <div className="aa-modal-footer flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="aa-button rounded px-4 py-2 text-sm transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="aa-button-primary flex items-center gap-2 rounded px-5 py-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
