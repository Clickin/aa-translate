
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            API 사용량 통계 (API Usage)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ArrowUpFromLine className="w-3 h-3" />
                입력 토큰 (Input)
              </div>
              <div className="text-xl font-mono text-slate-100">{stats.inputTokens.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ArrowDownToLine className="w-3 h-3" />
                출력 토큰 (Output)
              </div>
              <div className="text-xl font-mono text-slate-100">{stats.outputTokens.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
             <div className="text-sm text-slate-400">API 요청 횟수</div>
             <div className="text-lg font-bold text-white">{stats.requestCount}회</div>
          </div>

          <div className="bg-blue-900/20 p-5 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="text-blue-300 text-sm font-medium flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        총 예상 비용
                    </div>
                    <div className="text-xs text-blue-400/70 mt-1">Gemini 3.0 Flash 기준 (추정)</div>
                </div>
                <div className="text-3xl font-bold text-blue-100 font-mono">
                    ${stats.totalCost.toFixed(6)}
                </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-500/20 flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-tight">
                    * 위 비용은 <strong>Gemini 3.0 Flash ($0.50/$3.00)</strong>를 기준으로 계산된 추정치입니다.<br/>
                    Preview 기간에는 무료일 수 있으나, 정식 출시 후 예상 비용을 미리 파악하기 위한 수치입니다.
                </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
