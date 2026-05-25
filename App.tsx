import React, { useState, useEffect, startTransition } from "react";
import { FileUpload } from "./components/FileUpload";
import { Editor } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { SystemReport } from "./components/SystemReport";
import { UsageStats } from "./components/UsageStats";
import { ChangelogModal } from "./components/ChangelogModal";
import { DictionaryModal } from "./components/DictionaryModal";
import { PromptModal } from "./components/PromptModal";
import { ProfileModal } from "./components/ProfileModal";
import {
  SelectionRange,
  ViewMode,
  TextSegment,
  ApiUsageStats,
  DictionaryEntry,
  TranslationProfile,
} from "./types";
import {
  translateSelection,
  translateBatch,
  DEFAULT_SYSTEM_PROMPT,
} from "./services/translationService";
import {
  deleteProfile,
  fetchProfileModels,
  fetchProfiles,
  saveProfile,
  testProfile,
} from "./services/profileService";
import { groupSelectedJapaneseSentences } from "./src/shared/grouping";
import { selectProfileId } from "./src/shared/profile-selection";
import {
  FileText,
  Info,
  Activity,
  Download,
  Coins,
  History,
  Book,
  MessageSquareQuote,
  Server,
  CheckSquare,
  Bell,
  BellOff,
} from "lucide-react";
import { translationNotifier } from "./services/notificationService";

function App() {
  const [content, setContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("smart");
  const [isDragMode, setIsDragMode] = useState(false); // New Drag Mode State
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [segments, setSegments] = useState<TextSegment[]>([]);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    () => localStorage.getItem("aat_notify_on_complete") !== "false",
  );

  const [historyStack, setHistoryStack] = useState<
    { prevContent: string; prevSegments: TextSegment[] }[]
  >([]);
  const [lastTranslated, setLastTranslated] = useState<{
    original: string;
    translated: string;
  } | null>(null);

  const [profiles, setProfiles] = useState<TranslationProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>(
    () => localStorage.getItem("aat_profile_id") || undefined,
  );

  useEffect(() => {
    fetchProfiles()
      .then((loaded) => {
        setProfiles(loaded);
        setActiveProfileId(selectProfileId(loaded, activeProfileId));
      })
      .catch((error) => {
        console.error(error);
        setIsProfileOpen(true);
      });
  }, []);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem("aat_profile_id", activeProfileId);
    }
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem("aat_notify_on_complete", String(isNotificationEnabled));
  }, [isNotificationEnabled]);

  // Dictionary State with Persistence
  const [customDictionary, setCustomDictionary] = useState<DictionaryEntry[]>(() => {
    const saved = localStorage.getItem("aat_custom_dict");
    return saved ? JSON.parse(saved) : [];
  });

  const [useDefaultDictionary, setUseDefaultDictionary] = useState(true);

  // Persist Dictionary
  useEffect(() => {
    localStorage.setItem("aat_custom_dict", JSON.stringify(customDictionary));
  }, [customDictionary]);

  // Prompt State
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);

  // Stats State
  const [apiStats, setApiStats] = useState<ApiUsageStats>({
    requestCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
  });

  const handleFileLoaded = (newContent: string, name: string) => {
    setContent(newContent);
    setFileName(name);
    setSelection(null);
    setSegments([]);
    setHistoryStack([]);
    // 내용이 비어있으면 자동으로 편집(raw) 모드로 전환
    setViewMode(newContent.trim() === "" ? "raw" : "smart");
    setIsDragMode(false);
  };

  const updateStats = (usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
    requestCount?: number;
  }) => {
    setApiStats((prev) => ({
      requestCount: prev.requestCount + (usage.requestCount || 1),
      inputTokens: prev.inputTokens + usage.inputTokens,
      outputTokens: prev.outputTokens + usage.outputTokens,
      totalCost: prev.totalCost + usage.cost,
    }));
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let downloadName = "translation.txt";
    if (fileName) {
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        const name = fileName.substring(0, lastDotIndex);
        const ext = fileName.substring(lastDotIndex);
        downloadName = `${name}_translated${ext}`;
      } else {
        downloadName = `${fileName}_translated.txt`;
      }
    }

    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRawTranslate = async () => {
    if (!selection) return;

    setIsTranslating(true);
    setHistoryStack((prev) => [...prev, { prevContent: content, prevSegments: [] }]);
    void translationNotifier.requestPermission(isNotificationEnabled);

    try {
      const { text: translatedText, usage } = await translateSelection(
        selection.text,
        customDictionary,
        useDefaultDictionary,
        systemPrompt,
        activeProfileId,
      );

      const isUnchanged = translatedText.trim() === selection.text.trim();

      const before = content.substring(0, selection.start);
      const after = content.substring(selection.end);
      const newContent = before + translatedText + after;

      setContent(newContent);
      setSegments([]);
      updateStats(usage);

      setLastTranslated({ original: selection.text, translated: translatedText });

      if (!isUnchanged) {
        setSelection(null);
      } else {
        // 원문과 동일한 경우 선택 상태 유지 (길이가 달라졌을 수 있으므로 업데이트)
        setSelection({
          start: selection.start,
          end: selection.start + translatedText.length,
          text: translatedText,
        });
      }
      translationNotifier.notify(
        {
          title: "번역 완료",
          body: "선택 영역 번역이 완료되었습니다.",
        },
        isNotificationEnabled,
      );
    } catch (error: any) {
      translationNotifier.notify(
        {
          title: "번역 실패",
          body: error.message || "알 수 없는 오류",
        },
        isNotificationEnabled,
      );
      alert(`번역 실패: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSmartTranslate = async () => {
    const selectedSegments = segments.filter((s) => s.isSelected && !s.isTranslated);
    if (selectedSegments.length === 0) return;

    setIsTranslating(true);
    setHistoryStack((prev) => [...prev, { prevContent: content, prevSegments: [...segments] }]);
    void translationNotifier.requestPermission(isNotificationEnabled);

    try {
      const groups = groupSelectedJapaneseSentences(segments);
      const textsToTranslate = groups.map((group) => group.text);
      const { translations: translatedTexts, usage } = await translateBatch(
        textsToTranslate,
        customDictionary,
        useDefaultDictionary,
        systemPrompt,
        activeProfileId,
      );

      const groupBySegmentId = new Map<string, { groupIndex: number; segmentIndex: number }>();
      groups.forEach((group, groupIndex) => {
        group.ids.forEach((id, segmentIndex) =>
          groupBySegmentId.set(id, { groupIndex, segmentIndex }),
        );
      });

      const newSegments = segments.map((s) => {
        const groupInfo = groupBySegmentId.get(s.id);
        if (groupInfo) {
          const translatedText =
            groupInfo.segmentIndex === 0 ? translatedTexts[groupInfo.groupIndex] || s.text : "";
          // 번역 결과가 원문과 동일한 경우 (실패 또는 거부로 간주) 선택 상태 유지
          const isUnchanged = translatedText.trim() === s.text.trim();

          return {
            ...s,
            text: translatedText,
            isTranslated: !isUnchanged,
            isSelected: isUnchanged,
          };
        }
        return s;
      });

      setSegments(newSegments);
      updateStats(usage);

      const newContent = newSegments.map((s) => s.text).join("");
      setContent(newContent);

      setLastTranslated({
        original: `${selectedSegments.length} segments / ${groups.length} groups / ${usage.requestCount ?? 1} API requests`,
        translated: "Done",
      });
      translationNotifier.notify(
        {
          title: "번역 완료",
          body: `${selectedSegments.length}개 segment / ${groups.length}개 group / ${usage.requestCount ?? 1}회 요청 완료`,
        },
        isNotificationEnabled,
      );
    } catch (error: any) {
      translationNotifier.notify(
        {
          title: "번역 실패",
          body: error.message || "알 수 없는 오류",
        },
        isNotificationEnabled,
      );
      alert(`일괄 번역 실패: ${error.message || "알 수 없는 오류"}`);
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSelectAllJapanese = () => {
    startTransition(() => {
      const newSegments = segments.map((s) => {
        if (s.isTranslated) {
          return s.isSelected ? { ...s, isSelected: false } : s;
        }

        return s.isStrictJapanese ||
          s.isAutoSelected ||
          s.isBoxedDialogue ||
          s.isContextDialogue ||
          s.isArrowBox ||
          s.isVerticalBox ||
          s.isIndentedDialogue ||
          s.isIsolatedDialogue
          ? { ...s, isSelected: true }
          : s;
      });
      setSegments(newSegments);
    });
  };

  const handleUndo = () => {
    const last = historyStack[historyStack.length - 1];
    if (last) {
      setContent(last.prevContent);
      if (last.prevSegments.length > 0) {
        setSegments(last.prevSegments);
      } else {
        setSegments([]);
      }
      setHistoryStack((prev) => prev.slice(0, -1));
      setLastTranslated(null);
    }
  };

  const handleClear = () => {
    setContent("");
    setFileName("");
    setSelection(null);
    setSegments([]);
    setHistoryStack([]);
  };

  const refreshProfiles = async (preferredProfileId?: string) => {
    const loaded = await fetchProfiles();
    setProfiles(loaded);
    setActiveProfileId(selectProfileId(loaded, activeProfileId, preferredProfileId));
  };

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="min-h-14 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6 shrink-0 z-20">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-100 leading-none">AA Translator</h1>
            <div className="flex min-w-0 items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-[260px]">
                {activeProfile
                  ? `${activeProfile.provider} / ${activeProfile.model}`
                  : "NO PROFILE"}
              </span>
              <span className="w-0.5 h-2.5 bg-slate-700"></span>
              <button
                onClick={() => setIsStatsOpen(true)}
                className="text-[10px] text-green-400 font-mono flex items-center gap-1 hover:text-green-300 transition-colors"
                title="예상 비용 보기"
              >
                <Coins className="w-3 h-3" />${apiStats.totalCost.toFixed(6)} (예상)
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                const next = !isNotificationEnabled;
                setIsNotificationEnabled(next);
                if (next) {
                  void translationNotifier.requestPermission(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border rounded text-xs transition-colors sm:px-3 ${isNotificationEnabled ? "border-emerald-600/50 text-emerald-300" : "border-slate-700 text-slate-500"}`}
              title={isNotificationEnabled ? "번역 완료 알림 끄기" : "번역 완료 알림 켜기"}
            >
              {isNotificationEnabled ? (
                <Bell className="w-3.5 h-3.5" />
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">알림</span>
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border rounded text-xs transition-colors sm:px-3 ${activeProfile ? "border-blue-600/50 text-blue-400" : "border-slate-700 text-slate-300"}`}
              title="Provider Profile 설정"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setIsDictOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 transition-colors sm:px-3"
              title="번역 사전 설정"
            >
              <Book className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">사전</span>
            </button>
            <button
              onClick={() => setIsPromptOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 transition-colors sm:px-3"
              title="번역 프롬프트 설정"
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">프롬프트</span>
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 transition-colors sm:px-3"
              title="시스템 로직 보기"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logic</span>
            </button>
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 transition-colors sm:px-3"
              title="업데이트 내역 보기"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>

          {content && viewMode === "smart" && (
            <button
              onClick={handleSelectAllJapanese}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors shadow-sm sm:px-3"
              title="모든 일본어 텍스트 선택"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">자동 선택</span>
            </button>
          )}

          {(content || fileName) && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-sm sm:px-3"
              title="번역된 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>다운로드</span>
            </button>
          )}

          {fileName && (
            <span className="hidden md:inline-block px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 font-mono border border-slate-700 max-w-[150px] truncate">
              {fileName}
            </span>
          )}
          {fileName && (
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-[#1a1b26]">
        {!fileName && !content ? (
          <FileUpload onFileLoaded={handleFileLoaded} />
        ) : (
          <Editor
            content={content}
            fileName={fileName}
            onChange={setContent}
            onSelectionChange={setSelection}
            viewMode={viewMode}
            segments={segments}
            onSegmentsChange={setSegments}
            isDragMode={isDragMode}
          />
        )}
      </main>

      <Toolbar
        selection={selection}
        isTranslating={isTranslating}
        onTranslate={handleRawTranslate}
        onClearSelection={() => setSelection(null)}
        lastTranslation={lastTranslated}
        onUndo={handleUndo}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        smartSelectionCount={segments.filter((s) => s.isSelected && !s.isTranslated).length}
        onSmartTranslate={handleSmartTranslate}
        isDragMode={isDragMode}
        onToggleDragMode={() => setIsDragMode(!isDragMode)}
      />

      <SystemReport isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <UsageStats isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} stats={apiStats} />
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      <DictionaryModal
        isOpen={isDictOpen}
        onClose={() => setIsDictOpen(false)}
        customDictionary={customDictionary}
        setCustomDictionary={setCustomDictionary}
        useDefaultDictionary={useDefaultDictionary}
        setUseDefaultDictionary={setUseDefaultDictionary}
      />
      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={setActiveProfileId}
        onSaveProfile={async (profile) => {
          const saved = await saveProfile(profile);
          setActiveProfileId(saved.id);
          await refreshProfiles(saved.id);
          return saved;
        }}
        onDeleteProfile={async (id) => {
          await deleteProfile(id);
          await refreshProfiles();
        }}
        onTestProfile={testProfile}
        onFetchModels={fetchProfileModels}
      />

      <div className="fixed bottom-4 right-4 z-40">
        <div className="group relative">
          <div className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white cursor-help shadow-lg border border-slate-700">
            <Info className="w-5 h-5" />
          </div>
          <div className="absolute bottom-full right-0 mb-2 w-72 bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
            <p className="font-bold text-slate-100 mb-2">사용 가이드</p>
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-blue-400">선택 모드</span>
                <p>번역하려는 텍스트를 클릭하여 선택하세요.</p>
                <p className="mt-1">
                  하단 툴바의{" "}
                  <span className="text-slate-100 bg-slate-700 px-1 rounded">드래그</span> 버튼을
                  켜면 박스 드래그로 여러 줄을 한 번에 선택할 수 있습니다.
                </p>
              </div>
              <div>
                <span className="font-semibold text-green-400">사전 기능</span>
                <p>상단의 [사전] 메뉴에서 나만의 번역 규칙을 추가하고 저장/복원할 수 있습니다.</p>
              </div>
              <div>
                <span className="font-semibold text-yellow-400">Profile</span>
                <p>상단 [Profile] 메뉴에서 Gemini 또는 OpenAI-compatible provider를 설정하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
