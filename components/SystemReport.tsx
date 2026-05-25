
import React from 'react';
import { X, Zap, Layers, Terminal, Coins } from 'lucide-react';

interface SystemReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemReport: React.FC<SystemReportProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            시스템 리포트: 로직 & 아키텍처
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 leading-relaxed">
          
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-400" />
              1. 스마트 텍스트 분할 (Segmentation)
            </h3>
            <p className="text-sm text-slate-400">
              이 시스템은 아스키 아트(AA)의 구조를 밀도 휴리스틱(density heuristics)으로 분석하여 캐릭터의 대사와 그림 선(Drawing strokes)을 지능적으로 구별합니다.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              2. 비용 최적화 배치 번역 (Batch Translation)
            </h3>
             <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-400">
              <p className="mb-2 opacity-75">// 청킹 전략 (Chunking Strategy)</p>
              <p>전략: <span className="text-blue-300">동적 토큰 채우기 (Dynamic Token Filling)</span></p>
              <p>목표: <span className="text-blue-300">요청당 약 3000 토큰</span></p>
              <p>모델: <span className="text-purple-300">gemini-3-flash-preview</span></p>
            </div>
            <p className="mt-2 text-sm">
              API 오버헤드를 줄이고 컨텍스트 윈도우(Context Window) 활용을 극대화하기 위해 다음과 같은 전략을 사용합니다:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-slate-400 space-y-2 ml-2">
              <li><strong className="text-slate-200">원자적 그룹화 (Atomic Grouping):</strong> 문장은 분할 불가능한 최소 단위로 취급됩니다. 시스템은 <strong>절대로 문장을 중간에 자르지 않으며</strong>, 현재 배치에 들어가지 않으면 다음 배치로 넘깁니다.</li>
              <li><strong className="text-slate-200">동적 채우기 (Dynamic Filling):</strong> 효율성을 위해 세그먼트들을 약 4,000자(약 3,000 토큰)가 될 때까지 모아서 하나의 요청으로 보냅니다.</li>
              <li><strong className="text-slate-200">속도 제한 제어 (Rate Limiting):</strong> "429 Too Many Requests" 오류 발생 시 지수 백오프(Exponential Backoff)를 사용하여 자동으로 재시도합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-orange-400" />
              3. 실시간 비용 예측 (Cost Estimation)
            </h3>
            <p className="text-sm text-slate-400">
              비용은 Gemini API에서 반환된 <strong>토큰 사용량 메타데이터(Usage Metadata)</strong>를 기반으로 계산됩니다.
            </p>
             <div className="mt-2 bg-slate-800/50 p-3 rounded border border-slate-700 text-xs font-mono">
                <p>입력 (Input): 100만 토큰당 $0.50</p>
                <p>출력 (Output): 100만 토큰당 $3.00</p>
                <p className="text-slate-500 mt-1 italic">* Gemini 3.0 Flash 기준 추정치</p>
            </div>
          </section>

        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
