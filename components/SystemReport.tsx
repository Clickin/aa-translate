
import React from 'react';
import { X, Zap, Layers, Terminal, Coins } from 'lucide-react';
import { DEFAULT_GEMINI_MODEL } from '../src/shared/gemini-models';

interface SystemReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemReport: React.FC<SystemReportProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="aa-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="aa-modal flex max-h-[80vh] w-full max-w-2xl flex-col rounded-md shadow-2xl">
        <div className="aa-modal-header flex items-center justify-between border-b p-6">
          <h2 className="aa-title flex items-center gap-2 text-xl font-bold">
            <Terminal className="aa-linkish w-5 h-5" />
            시스템 리포트: 로직 & 아키텍처
          </h2>
          <button onClick={onClose} className="aa-muted hover:text-[var(--aa-text)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="aa-muted space-y-6 overflow-y-auto p-6 leading-relaxed">
          
          <section>
            <h3 className="aa-title mb-3 flex items-center gap-2 text-lg font-semibold">
              <Layers className="w-4 h-4" style={{ color: 'var(--aa-success)' }} />
              1. 스마트 텍스트 분할 (Segmentation)
            </h3>
            <p className="aa-muted text-sm">
              이 시스템은 아스키 아트(AA)의 구조를 밀도 휴리스틱(density heuristics)으로 분석하여 캐릭터의 대사와 그림 선(Drawing strokes)을 지능적으로 구별합니다.
            </p>
          </section>

          <section>
            <h3 className="aa-title mb-3 flex items-center gap-2 text-lg font-semibold">
              <Zap className="w-4 h-4" style={{ color: 'var(--aa-warn)' }} />
              2. 비용 최적화 배치 번역 (Batch Translation)
            </h3>
             <div className="aa-panel-soft rounded-md p-4 font-mono text-xs">
              <p className="mb-2 opacity-75">// 청킹 전략 (Chunking Strategy)</p>
              <p>전략: <span className="aa-linkish">동적 토큰 채우기 (Dynamic Token Filling)</span></p>
              <p>목표: <span className="aa-linkish">요청당 약 3000 토큰</span></p>
              <p>모델: <span className="aa-linkish">{DEFAULT_GEMINI_MODEL}</span></p>
            </div>
            <p className="mt-2 text-sm">
              API 오버헤드를 줄이고 컨텍스트 윈도우(Context Window) 활용을 극대화하기 위해 다음과 같은 전략을 사용합니다:
            </p>
            <ul className="aa-muted ml-2 mt-2 list-inside list-disc space-y-2 text-sm">
              <li><strong className="aa-title">원자적 그룹화 (Atomic Grouping):</strong> 문장은 분할 불가능한 최소 단위로 취급됩니다. 시스템은 <strong>절대로 문장을 중간에 자르지 않으며</strong>, 현재 배치에 들어가지 않으면 다음 배치로 넘깁니다.</li>
              <li><strong className="aa-title">동적 채우기 (Dynamic Filling):</strong> 효율성을 위해 세그먼트들을 약 4,000자(약 3,000 토큰)가 될 때까지 모아서 하나의 요청으로 보냅니다.</li>
              <li><strong className="aa-title">속도 제한 제어 (Rate Limiting):</strong> "429 Too Many Requests" 오류 발생 시 지수 백오프(Exponential Backoff)를 사용하여 자동으로 재시도합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="aa-title mb-3 flex items-center gap-2 text-lg font-semibold">
              <Coins className="w-4 h-4" style={{ color: 'var(--aa-warn)' }} />
              3. 실시간 비용 예측 (Cost Estimation)
            </h3>
            <p className="aa-muted text-sm">
              비용은 Gemini API에서 반환된 <strong>토큰 사용량 메타데이터(Usage Metadata)</strong>를 기반으로 계산됩니다.
            </p>
             <div className="aa-panel-soft mt-2 rounded p-3 font-mono text-xs">
                <p>입력 (Input): 100만 토큰당 $0.50</p>
                <p>출력 (Output): 100만 토큰당 $3.00</p>
                <p className="aa-subtle mt-1 italic">* 기본 Gemini 모델 기준 추정치</p>
            </div>
          </section>

        </div>
        
        <div className="aa-modal-footer flex justify-end border-t p-4">
          <button 
            onClick={onClose}
            className="aa-button rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
