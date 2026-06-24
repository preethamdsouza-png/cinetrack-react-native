import * as Calendar from 'expo-calendar/legacy';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createLLM, type LiteRTLM } from 'react-native-litert-lm';
import movieService from '../services/movieService';


// Safely grab your API key exported by Expo Env
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const MODEL_CANDIDATE_PATHS = [
  '/data/local/tmp/gemma-4-E2B-it.litertlm',
  '/data/local/tmp/llm/gemma_multimodal.litertlm',
];
const MODEL_BACKENDS: Array<'gpu' | 'cpu'> = ['gpu', 'cpu'];
const ANALYSIS_IMAGE_DIR = `${FileSystem.cacheDirectory}litert-analysis`;
const MAX_LLM_RESPONSE_CHARS = 12000;
const normalizeLocalFilePath = (uri: string): string =>
  uri.startsWith('file://') ? uri.replace('file://', '') : uri;
const extractJsonObject = (raw: string): string => {
  const startIndex = raw.indexOf('{');
  const endIndex = raw.lastIndexOf('}');
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    return raw.trim();
  }
  return raw.slice(startIndex, endIndex + 1).trim();
};

type PosterExtraction = {
  movieTitle: string | null;
  releaseYear?: string | null;
};

export default function WatchListScreen({ navigation }: any) {
  const camera = useRef<React.ComponentRef<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const llmRef = useRef<LiteRTLM | null>(null);

  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Local Gemma Engine...');
  const [activeBackend, setActiveBackend] = useState<'gpu' | 'cpu' | null>(null);

  if (!llmRef.current) {
    llmRef.current = createLLM();
  }

  const getLLM = (): LiteRTLM => {
    if (!llmRef.current) {
      throw new Error('LLM instance is not available.');
    }
    return llmRef.current;
  };

  const ensureEngineLoaded = async (): Promise<boolean> => {
    const llm = getLLM();
    try {
      if (llm.isReady()) {
        setIsEngineReady(true);
        if (activeBackend) {
          setStatusText('Gemma Ready. Align a movie poster!');
        }
        return true;
      }
    } catch {
      // proceed to load model
    }

    setIsEngineReady(false);
    setStatusText('Initializing Local Gemma Engine...');

    let lastError: unknown = null;
    for (const localModelPath of MODEL_CANDIDATE_PATHS) {
      for (const backend of MODEL_BACKENDS) {
        try {
          await llm.loadModel(localModelPath, {
            backend,
            multimodal: true,
            temperature: 0.1,
          });
          setIsEngineReady(true);
          setActiveBackend(backend);
          setStatusText('Gemma Ready. Align a movie poster!');
          return true;
        } catch (error) {
          lastError = error;
        }
      }
    }

    const initMessage =
      lastError instanceof Error ? lastError.message : 'No valid local model path was found.';
    setStatusText(`Engine Init Failed: ${initMessage}`);
    return false;
  };

  // 1. Load the model on mount
  useEffect(() => {
    ensureEngineLoaded();

    return () => {
      setIsEngineReady(false);
      setActiveBackend(null);
      llmRef.current?.close(); // Clean up native memory allocations
      llmRef.current = null;
    };
  }, []);

  // 2. Capture photograph & feed down to Gemma's Vision layers
  const handleCaptureAndAnalyze = async () => {
    if (!camera.current || isProcessing) return;

    setIsProcessing(true);
    setStatusText('Capturing poster frame...');

    try {
      const ready = await ensureEngineLoaded();
      if (!ready) {
        throw new Error('Gemma model is not loaded. Please wait for initialization to complete.');
      }

      const photo = await camera.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        throw new Error('Camera did not return an image path.');
      }

      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      if (!fileInfo.exists) {
        throw new Error(`Captured image file does not exist: ${photo.uri}`);
      }

      const imageDirInfo = await FileSystem.getInfoAsync(ANALYSIS_IMAGE_DIR);
      if (!imageDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ANALYSIS_IMAGE_DIR, { intermediates: true });
      }

      const stableImageUri = `${ANALYSIS_IMAGE_DIR}/${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: photo.uri,
        to: stableImageUri,
      });

      const stableInfo = await FileSystem.getInfoAsync(stableImageUri);
      if (!stableInfo.exists || !stableInfo.size || stableInfo.size <= 0) {
        throw new Error(`Stable image file is invalid: ${stableImageUri}`);
      }

      setStatusText('Gemma is parsing pixels locally...');

      const prompt = `
        Analyze this movie poster and extract the main movie title and release year (if visible).
        Return ONLY valid JSON (no markdown, no extra text) with this exact shape:
        {
          "movieTitle": string | null,
          "releaseYear": string | null
        }
      `.trim();

      // Use absolute file path API; this avoids cross-thread JS ArrayBuffer errors.
      const imagePath = normalizeLocalFilePath(stableImageUri);
      const llm = getLLM();
      const rawResponse = await llm.sendMessageWithImage(prompt, imagePath);
      const responseText =
        typeof rawResponse === 'string' ? rawResponse : String(rawResponse ?? '');
      const boundedResponse =
        responseText.length > MAX_LLM_RESPONSE_CHARS
          ? responseText.slice(0, MAX_LLM_RESPONSE_CHARS)
          : responseText;
      const cleanJsonString = extractJsonObject(
        boundedResponse
          .replace('```json', '')
          .replace('```', '')
          .trim()
      );

      const parsedData = JSON.parse(cleanJsonString) as PosterExtraction;

      if (parsedData.movieTitle) {
        await matchWithTmdbAndSchedule(parsedData);
      } else {
        throw new Error('Could not reliably parse a movie title from that picture.');
      }
    } catch (error: any) {
      const message = String(error?.message ?? error);
      Alert.alert('Analysis Failed', message);
    } finally {
      setIsProcessing(false);
      if (isEngineReady) {
        setStatusText('Gemma Ready. Scan a movie poster!');
      }
    }
  };

  // 3. Look up exact metadata on TMDB & commit to Native Calendar
  const matchWithTmdbAndSchedule = async (extraction: PosterExtraction) => {
    const primaryTitle = extraction.movieTitle?.trim();
    if (!primaryTitle) {
      throw new Error('No movie title found in extracted data.');
    }

    setStatusText(`Verifying "${primaryTitle}" via TMDB API...`);
    const data = await movieService.searchMovies(encodeURIComponent(primaryTitle));

    if (data.length === 0) {
      Alert.alert('Not Found', `Extracted "${primaryTitle}", but couldn't locate it on TMDB.`);
      return;
    }

    const movieMatch = data[0];
    const releaseDate = movieMatch.release_date; // Expected string format: YYYY-MM-DD

    if (!releaseDate) {
      Alert.alert('Release Pending', `"${movieMatch.title}" has no confirmed release date on TMDB yet.`);
      return;
    }

    setStatusText('Scheduling Calendar Entry...');
    
    // Request permission to write events
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Calendar write permission is required.');
      return;
    }

    // Find the primary system calendar container (Required target on Android)
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];

    if (!defaultCalendar) {
      Alert.alert('Error', 'No system calendar found to attach this event.');
      return;
    }

    const eventTimeStart = new Date(`${releaseDate}T19:00:00`);
    const eventTimeEnd = new Date(`${releaseDate}T21:30:00`);

    // Create the native calendar block
    await Calendar.createEventAsync(defaultCalendar.id, {
      title: `${movieMatch.title} - Opening Night!`,
      startDate: eventTimeStart,
      endDate: eventTimeEnd,
      notes: `Automated poster match via CineTrack. Synopsis: ${movieMatch.overview}`,
      timeZone: 'UTC'
    });

    Alert.alert(
      'Movie Added to your Calender!',
      `"${movieMatch.title}" successfully added to your native device calendar for ${releaseDate}!`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Details', { movieId: movieMatch.id }),
        },
      ]
    );
  };

  // 1. Wait for Expo to check the hardware permissions
  if (!permission) {
    return <View style={styles.centerBox}><ActivityIndicator color="#FFF" /></View>;
  }

  // 2. Render system permission fallback if denied
  if (!permission.granted) {
    return (
      <View style={styles.centerBox}>
        <Text style={{ color: '#fff', marginBottom: 20, fontSize: 16 }}>
          We need your permission to scan posters.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Live Camera Render View */}
     <CameraView 
       ref={camera} 
       style={StyleSheet.absoluteFill} 
      facing="back"
      />      
      {/* HUD Controls Container Overlay */}
      <View style={styles.overlayContainer}>
        <View style={styles.hudBubble}>
          <Text style={styles.statusText}>{statusText}</Text>
          {isProcessing && <ActivityIndicator color="#6200EE" style={{ marginTop: 8 }} />}
        </View>

        {!isProcessing && (
          <TouchableOpacity
            style={[styles.captureButton, !isEngineReady && styles.captureButtonDisabled]}
            onPress={handleCaptureAndAnalyze}
            disabled={!isEngineReady}
            accessibilityState={{ disabled: !isEngineReady }}
          >
            <View style={styles.innerCaptureCircle} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  overlayContainer: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 48 },
  hudBubble: { backgroundColor: 'rgba(255,255,255,0.92)', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  statusText: { fontSize: 15, fontWeight: '600', color: '#121212', textAlign: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  captureButtonDisabled: { opacity: 0.45 },
  innerCaptureCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF3B30' },
  button: { padding: 16, backgroundColor: '#007AFF', borderRadius: 8 }
});