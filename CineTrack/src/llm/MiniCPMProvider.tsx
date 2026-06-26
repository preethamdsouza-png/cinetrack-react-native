import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const MODEL_CANDIDATE_PATHS = [
  {
    model: 'file:///data/local/tmp/MiniCPM-V-4_6-Q4_K_M.gguf',
    mmproj: 'file:///data/local/tmp/mmproj-MiniCPM-V-4.6-Q8_0.gguf',
  },
  {
    model: 'file:///data/local/tmp/MiniCPM-V-4.6-Q4_K_M.gguf',
    mmproj: 'file:///data/local/tmp/mmproj-MiniCPM-V-4.6-Q8_0.gguf',
  }
];

type MiniCPMContextType = {
  llm: {
    sendMessageWithImage: (prompt: string, imagePath: string) => Promise<string>;
  } | null;
  isReady: boolean;
  isInitializing: boolean;
  initError: string | null;
  modelPath: string | null;
  ensureLoaded: () => Promise<boolean>;
};

const MiniCPMContext = createContext<MiniCPMContextType | null>(null);

export function MiniCPMProvider({ children }: { children: React.ReactNode }) {
  const contextRef = useRef<any>(null);
  const initInFlightRef = useRef<Promise<boolean> | null>(null);
  const readyRef = useRef(false);
  const loadedPathRef = useRef<string | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState<string | null>(null);

  const ensureLoaded = useCallback(async (): Promise<boolean> => {
    if (readyRef.current && contextRef.current) {
      return true;
    }

    if (initInFlightRef.current) {
      return initInFlightRef.current;
    }

    const initTask = (async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        const { initLlama } = await import('llama.rn');

        let lastError: unknown = null;
        for (const { model: localModelPath, mmproj: mmprojPath } of MODEL_CANDIDATE_PATHS) {
          try {
            console.log(`Attempting to load model from: ${localModelPath}`);
            
            const context = await initLlama({
              model: localModelPath,
              use_mlock: true,
              n_ctx: 2048,
              n_gpu_layers: 99,
              context_shift: false,
            });

            console.log(`Model loaded, initializing multimodal support with: ${mmprojPath}`);
            
            const multimodalSuccess = await context.initMultimodal({
              path: mmprojPath,
            });

            if (!multimodalSuccess) {
              throw new Error('Failed to initialize multimodal support');
            }

            const support = await context.getMultimodalSupport();
            console.log('Vision support:', support.vision);

            contextRef.current = context;
            readyRef.current = true;
            loadedPathRef.current = localModelPath;

            setIsReady(true);
            setModelPath(localModelPath);
            console.log(`Model and multimodal projector loaded successfully`);
            return true;
          } catch (error) {
            lastError = error;
            console.log(`Failed to load model from ${localModelPath}:`, error);
          }
        }

        readyRef.current = false;
        loadedPathRef.current = null;
        contextRef.current = null;
        setIsReady(false);
        setModelPath(null);
        setInitError(
          lastError instanceof Error 
            ? lastError.message 
            : 'Failed to initialize MiniCPM. Please ensure both the model and mmproj files exist at one of the configured paths.'
        );
        return false;
      } catch (error) {
        console.error('MiniCPM initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Unexpected initialization error');
        return false;
      }
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
    return () => {
      try {
        if (contextRef.current && typeof contextRef.current.release === 'function') {
          contextRef.current.release();
        }
      } catch (error) {
        console.error('Error releasing MiniCPM context:', error);
      }
    };
  }, []);

  const llmInterface = isReady && contextRef.current ? {
    sendMessageWithImage: async (prompt: string, imagePath: string) => {
      if (!contextRef.current) {
        throw new Error('Model context not initialized');
      }

      try {
        const imageUrl = imagePath.startsWith('file://') 
          ? imagePath 
          : `file://${imagePath}`;

        console.log('Calling completion with image:', imageUrl);
        console.log('Prompt:', prompt);

        const completion = await contextRef.current.completion(
          {
            messages: [
              {
                role: 'user',
                content: [
                  { 
                    type: 'image_url', 
                    image_url: { 
                      url: imageUrl 
                    } 
                  },
                  { 
                    type: 'text', 
                    text: prompt 
                  },
                ],
              },
            ],
            n_predict: 200,
            temperature: 0.1,
            top_k: 40,
            top_p: 0.95,
            stop: ['</s>', '<|im_end|>', '<|endoftext|>', '}'],
          },
          (data: any) => {
            if (data.token) {
              console.log('Token generated:', data.token);
            }
          }
        );

        console.log('Completion result:', completion);
        return completion.text || '';
      } catch (error) {
        console.error('Completion error:', error);
        throw error;
      }
    }
  } : null;

  return (
    <MiniCPMContext.Provider value={{
      llm: llmInterface,
      isReady,
      isInitializing,
      initError,
      modelPath,
      ensureLoaded
    }}>
      {children}
    </MiniCPMContext.Provider>
  );
}

export function useMiniCPM() {
  const context = useContext(MiniCPMContext);
  if (!context) {
    throw new Error('useMiniCPM must be used within a MiniCPMProvider');
  }
  return context;
}
