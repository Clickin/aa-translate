
import React from 'react';
import { X, Server, Coins, ArrowUpFromLine, ArrowDownToLine, AlertTriangle } from 'lucide-react';
import { ApiUsageStats } from '../types';

interface UsageStatsProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ApiUsageStats;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="aa-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="aa-modal flex w-full max-w-md flex-col rounded-md shadow-2xl">
        <div className="aa-modal-header flex items-center justify-between border-b p-6">
          <h2 className="aa-title flex items-center gap-2 text-lg font-bold">
            <Server className="aa-linkish w-5 h-5" />
            API 사용량 통계 (API Usage)
          </h2>
          <button onClick={onClose} className="aa-muted hover:text-[var(--aa-text)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="aa-panel-soft rounded-md p-4">
              <div className="aa-muted mb-1 flex items-center gap-2 text-xs">
                <ArrowUpFromLine className="w-3 h-3" />
                입력 토큰 (Input)
              </div>
              <div className="aa-title font-mono text-xl">{stats.inputTokens.toLocaleString()}</div>
            </div>
            <div className="aa-panel-soft rounded-md p-4">
              <div className="aa-muted mb-1 flex items-center gap-2 text-xs">
                <ArrowDownToLine className="w-3 h-3" />
                출력 토큰 (Output)
              </div>
              <div className="aa-title font-mono text-xl">{stats.outputTokens.toLocaleString()}</div>
            </div>
          </div>

          <div className="aa-panel-soft flex items-center justify-between rounded-md p-4">
             <div className="aa-muted text-sm">API 요청 횟수</div>
             <div className="aa-title text-lg font-bold">{stats.requestCount}회</div>
          </div>

          <div className="aa-panel-soft rounded-md p-5">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="aa-linkish flex items-center gap-2 text-sm font-medium">
                        <Coins className="w-4 h-4" />
                        총 예상 비용
                    </div>
                    <div className="aa-subtle mt-1 text-xs">기본 Gemini 모델 기준 (추정)</div>
                </div>
                <div className="aa-title font-mono text-3xl font-bold">
                    ${stats.totalCost.toFixed(6)}
                </div>
            </div>
            
            <div className="aa-divider mt-3 flex items-start gap-2 border-t pt-3">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--aa-warn)' }} />
                <p className="aa-muted text-[10px] leading-tight">
                    * 위 비용은 <strong>기본 Gemini 모델 단가</strong>를 기준으로 계산된 추정치입니다.<br/>
                    실제 과금은 Google AI Studio의 현재 가격 정책을 확인하세요.
                </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
