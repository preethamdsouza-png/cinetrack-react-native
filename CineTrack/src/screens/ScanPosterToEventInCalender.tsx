import * as Calendar from 'expo-calendar/legacy';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// NOTE: Make sure to point this hook to your new MiniCPM loader or native llama runner
import { useMiniCPM } from '../llm/MiniCPMProvider'; 
import movieService from '../services/movieService';

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

export default function ScanPosterToEventInCalender({ navigation }: any) {
  const camera = useRef<React.ComponentRef<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Updated Hook Context for the 1B model
  const { llm, isReady, isInitializing, initError, ensureLoaded } = useMiniCPM();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Local MiniCPM Engine...');

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  useEffect(() => {
    if (isProcessing) return;
    if (isInitializing) {
      setStatusText('Initializing Local MiniCPM Engine...');
      return;
    }
    if (initError) {
      setStatusText(`Engine Init Failed: ${initError}`);
      return;
    }
    if (isReady) {
      setStatusText(`Scan a movie poster! (MiniCPM-V Active)`);
    }
  }, [isInitializing, isProcessing, isReady, initError]);

  const handleCaptureAndAnalyze = async () => {
    if (!camera.current || isProcessing) return;

    setIsProcessing(true);
    setStatusText('Capturing poster frame...');

    try {
      const ready = await ensureLoaded();
      if (!ready || !llm) {
        throw new Error('Model is not loaded. Please wait for initialization.');
      }

      // Optimized camera settings for blazing fast local vision speeds
      const photo = await camera.current.takePictureAsync({
        quality: 0.4,
        skipProcessing: true,
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
      await FileSystem.copyAsync({ from: photo.uri, to: stableImageUri });

      setStatusText('MiniCPM is processing image tokens...');

      // Formatted prompt syntax specifically tuned for MiniCPM-V 4.6
      const prompt = `<user>\nAnalyze this movie poster and extract the main movie title and release year (if visible).
Return ONLY valid JSON with this exact shape:
{
  "movieTitle": string | null,
  "releaseYear": string | null
}
Do not write markdown backticks or any conversational fillers, return only the JSON raw string.\n<assistant>\n`;

      const imagePath = normalizeLocalFilePath(stableImageUri);
      console.log('Calling sendMessageWithImage with path:', imagePath);
      console.log('Prompt length:', prompt.length);
      
      setStatusText('Analyzing image... This may take 1-2 minutes...');
      
      const rawResponse = await llm.sendMessageWithImage(prompt, imagePath);
      console.log('Got response from model, length:', rawResponse?.length);
      
      const responseText = typeof rawResponse === 'string' ? rawResponse : String(rawResponse ?? '');
      const boundedResponse = responseText.length > MAX_LLM_RESPONSE_CHARS ? responseText.slice(0, MAX_LLM_RESPONSE_CHARS) : responseText;
      
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
    }
  };

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
    const releaseDate = movieMatch.release_date;

    if (!releaseDate) {
      Alert.alert('Release Pending', `"${movieMatch.title}" has no confirmed release date.`);
      return;
    }

    setStatusText('Scheduling Calendar Entry...');
    
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Calendar write permission is required.');
      return;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];

    if (!defaultCalendar) {
      Alert.alert('Error', 'No system calendar found to attach this event.');
      return;
    }

    const eventTimeStart = new Date(`${releaseDate}T19:00:00`);
    const eventTimeEnd = new Date(`${releaseDate}T21:30:00`);

    await Calendar.createEventAsync(defaultCalendar.id, {
      title: `${movieMatch.title} - Opening Night!`,
      startDate: eventTimeStart,
      endDate: eventTimeEnd,
      notes: `Automated poster match via CineTrack. Synopsis: ${movieMatch.overview}`,
      timeZone: 'UTC'
    });

    Alert.alert(
      'Movie Added to your Calendar!',
      `"${movieMatch.title}" successfully added!`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Details', { movieId: movieMatch.id }),
        },
      ]
    );
  };

  if (!permission) {
    return <View style={styles.centerBox}><ActivityIndicator color="#FFF" /></View>;
  }

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
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />      
      <View style={styles.overlayContainer}>
        <View style={styles.hudBubble}>
          <Text style={styles.statusText}>{statusText}</Text>
          {isProcessing && <ActivityIndicator color="#6200EE" style={{ marginTop: 8 }} />}
        </View>

        {!isProcessing && (
          <TouchableOpacity
            style={[styles.captureButton, !isReady && styles.captureButtonDisabled]}
            onPress={handleCaptureAndAnalyze}
            disabled={!isReady}
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