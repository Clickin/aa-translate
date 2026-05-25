
import React, { useState, useRef } from 'react';
import { X, Book, Plus, Trash2, Save, Upload, Download } from 'lucide-react';
import { DictionaryEntry } from '../types';
import { DEFAULT_DICTIONARY } from '../services/translationService';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customDictionary: DictionaryEntry[];
  setCustomDictionary: (dict: DictionaryEntry[]) => void;
  useDefaultDictionary: boolean;
  setUseDefaultDictionary: (use: boolean) => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  onClose,
  customDictionary,
  setCustomDictionary,
  useDefaultDictionary,
  setUseDefaultDictionary,
}) => {
  const [newOriginal, setNewOriginal] = useState('');
  const [newTranslated, setNewTranslated] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newOriginal.trim() && newTranslated.trim()) {
      setCustomDictionary([
        ...customDictionary,
        {
          id: Date.now().toString(),
          original: newOriginal.trim(),
          translated: newTranslated.trim(),
        },
      ]);
      setNewOriginal('');
      setNewTranslated('');
    }
  };

  const handleDelete = (id: string) => {
    setCustomDictionary(customDictionary.filter((d) => d.id !== id));
  };

  const handleExport = () => {
    if (customDictionary.length === 0) {
        alert("내보낼 사전 데이터가 없습니다.");
        return;
    }
    const jsonStr = JSON.stringify(customDictionary, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_dictionary_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) {
                // Simple validation
                const valid = json.every(item => item.id && item.original && item.translated);
                if (valid) {
                    if (window.confirm(`현재 사전을 덮어쓰고 ${json.length}개의 항목을 불러오시겠습니까?`)) {
                        setCustomDictionary(json);
                    }
                } else {
                    alert("올바르지 않은 사전 파일 형식입니다.");
                }
            } else {
                alert("올바르지 않은 JSON 형식입니다.");
            }
    } catch {
            alert("파일을 읽는 중 오류가 발생했습니다.");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="aa-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="aa-modal flex max-h-[85vh] w-full max-w-2xl flex-col rounded-md shadow-2xl">
        <div className="aa-modal-header flex items-center justify-between border-b p-6">
          <h2 className="aa-title flex items-center gap-2 text-xl font-bold">
            <Book className="aa-linkish w-5 h-5" />
            번역 사전 설정
          </h2>
          <button onClick={onClose} className="aa-muted hover:text-[var(--aa-text)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {/* Custom Dictionary Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="aa-muted text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    사용자 정의 사전
                </h3>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleImportClick}
                        className="aa-button flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                        title="JSON 파일 불러오기"
                    >
                        <Upload className="w-3 h-3" />
                        가져오기
                    </button>
                    <button 
                        onClick={handleExport}
                        className="aa-button flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                        title="JSON 파일로 저장"
                    >
                        <Download className="w-3 h-3" />
                        내보내기
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="원문 (예: 2ch)"
                value={newOriginal}
                onChange={(e) => setNewOriginal(e.target.value)}
                className="aa-input flex-1 rounded px-4 py-2 text-sm placeholder:text-[var(--aa-subtle)]"
              />
              <input
                type="text"
                placeholder="번역 (예: 투채널)"
                value={newTranslated}
                onChange={(e) => setNewTranslated(e.target.value)}
                className="aa-input flex-1 rounded px-4 py-2 text-sm placeholder:text-[var(--aa-subtle)]"
              />
              <button
                onClick={handleAdd}
                disabled={!newOriginal || !newTranslated}
                className="aa-button-primary rounded px-4 py-2 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {customDictionary.length > 0 ? (
              <div className="aa-panel-soft rounded-md divide-y divide-[var(--aa-border)]">
                {customDictionary.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="aa-title w-1/2 truncate" title={entry.original}>{entry.original}</span>
                      <span className="aa-subtle">→</span>
                      <span className="aa-linkish w-1/2 truncate" title={entry.translated}>{entry.translated}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="aa-button-danger ml-2 rounded p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aa-subtle rounded-md border-2 border-dashed border-[var(--aa-border)] py-8 text-center text-sm">
                등록된 사용자 사전이 없습니다.
              </div>
            )}
          </section>

          {/* Default Dictionary Section */}
          <section className="aa-divider border-t pt-6">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <h3 className="aa-muted text-sm font-bold uppercase tracking-wider">기본 제공 AA 사전</h3>
                 <span className="aa-subtle text-xs">(야루오, 모나 등)</span>
               </div>
               <label className="flex items-center cursor-pointer">
                 <span className="aa-muted mr-3 text-sm">{useDefaultDictionary ? '사용 중' : '사용 안 함'}</span>
                 <div className="relative">
                   <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={useDefaultDictionary} 
                      onChange={(e) => setUseDefaultDictionary(e.target.checked)}
                   />
                   <div className={`h-5 w-10 rounded-full shadow-inner transition-colors ${useDefaultDictionary ? 'bg-[var(--aa-accent)]' : 'bg-[var(--aa-border)]'}`}></div>
                   <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transition-transform ${useDefaultDictionary ? 'translate-x-5' : 'translate-x-0'}`}></div>
                 </div>
               </label>
            </div>

            {useDefaultDictionary ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 opacity-100 transition-opacity duration-300">
                {DEFAULT_DICTIONARY.map((entry) => (
                    <div key={entry.id} className="aa-panel-soft rounded px-3 py-2 text-xs flex justify-between items-center">
                        <span className="aa-muted">{entry.original}</span>
                        <span style={{ color: 'var(--aa-success)' }}>{entry.translated}</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="aa-subtle py-8 text-center text-sm opacity-70">
                    기본 사전이 비활성화되었습니다.
                </div>
            )}
          </section>

        </div>

        <div className="aa-modal-footer flex justify-end border-t p-4">
          <button
            onClick={onClose}
            className="aa-button-primary flex items-center gap-2 rounded px-5 py-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            설정 저장 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
