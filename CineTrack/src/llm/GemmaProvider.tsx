import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createLLM, type LiteRTLM } from 'react-native-litert-lm';

const MODEL_CANDIDATE_PATHS = [
  '/data/local/tmp/gemma-4-E2B-it.litertlm',
  '/data/local/tmp/llm/gemma_multimodal.litertlm',
];

const MODEL_BACKENDS: Array<'gpu' | 'cpu'> = ['gpu', 'cpu'];

type GemmaContextValue = {
  llm: LiteRTLM;
  isReady: boolean;
  isInitializing: boolean;
  initError: string | null;
  activeBackend: 'gpu' | 'cpu' | null;
  loadedModelPath: string | null;
  ensureLoaded: () => Promise<boolean>;
};

const GemmaContext = createContext<GemmaContextValue | null>(null);

export function GemmaProvider({ children }: { children: React.ReactNode }) {
  const llmRef = useRef<LiteRTLM>(createLLM());
  const initInFlightRef = useRef<Promise<boolean> | null>(null);
  const readyRef = useRef(false);
  const loadedPathRef = useRef<string | null>(null);
  const backendRef = useRef<'gpu' | 'cpu' | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeBackend, setActiveBackend] = useState<'gpu' | 'cpu' | null>(null);
  const [loadedModelPath, setLoadedModelPath] = useState<string | null>(null);

  const ensureLoaded = useCallback(async (): Promise<boolean> => {
    if (readyRef.current) {
      try {
        if (llmRef.current.isReady()) {
          return true;
        }
      } catch {
        readyRef.current = false;
      }
    }

    if (initInFlightRef.current) {
      return initInFlightRef.current;
    }

    const initTask = (async () => {
      setIsInitializing(true);
      setInitError(null);

      let lastError: unknown = null;
      for (const localModelPath of MODEL_CANDIDATE_PATHS) {
        for (const backend of MODEL_BACKENDS) {
          try {
            await llmRef.current.loadModel(localModelPath, {
              backend,
              multimodal: true,
              temperature: 0.1,
            });

            readyRef.current = true;
            loadedPathRef.current = localModelPath;
            backendRef.current = backend;

            setIsReady(true);
            setActiveBackend(backend);
            setLoadedModelPath(localModelPath);
            return true;
          } catch (error) {
            lastError = error;
          }
        }
      }

      readyRef.current = false;
      loadedPathRef.current = null;
      backendRef.current = null;
      setIsReady(false);
      setActiveBackend(null);
      setLoadedModelPath(null);
      setInitError(lastError instanceof Error ? lastError.message : 'Failed to initialize Gemma.');
      return false;
    })();

    initInFlightRef.current = initTask;
    try {
      return await initTask;
    } finally {
      setIsInitializing(false);
      initInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!readyRef.current && !initInFlightRef.current) {
        await ensureLoaded();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GemmaContext.Provider
      value={{
        llm: llmRef.current,
        isReady,
        isInitializing,
        initError,
        activeBackend,
        loadedModelPath,
        ensureLoaded,
      }}
    >
      {children}
    </GemmaContext.Provider>
  );
}

export function useGemma(): GemmaContextValue {
  const context = useContext(GemmaContext);
  if (!context) {
    throw new Error('useGemma must be used within GemmaProvider.');
  }
  return context;
}
