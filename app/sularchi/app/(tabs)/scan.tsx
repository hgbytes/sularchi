import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { classifyWaste, type ClassificationResult } from '@/services/waste-classifier';
import { getCurrentLocation } from '@/services/location-service';
import { fileComplaint, type GeoLocation } from '@/services/complaint-store';
import { ClassificationResultCard } from '@/components/classification-result-card';

type ScanState = 'camera' | 'processing' | 'result';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanState, setScanState] = useState<ScanState>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo) return;

      setCapturedUri(photo.uri);
      setScanState('processing');

      // Run classification and GPS fetch in parallel
      const [classification, geoLocation] = await Promise.all([
        classifyWaste(photo.uri),
        getCurrentLocation(),
      ]);

      setResult(classification);
      setLocation(geoLocation);
      setScanState('result');
    } catch (error) {
      console.error('Error capturing/classifying:', error);
      Alert.alert('Error', 'Failed to capture or classify the image. Please try again.');
      setScanState('camera');
    }
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!result || !capturedUri || !location) return;

    setIsSubmitting(true);
    try {
      const { pointsAwarded: pts } = await fileComplaint({
        imageUri: capturedUri,
        wasteCategory: result.category,
        confidence: result.confidence,
        wasteLabel: result.label,
        description: result.description,
        location,
      });

      setPointsAwarded(pts);
      setSubmitted(true);
    } catch (error) {
      console.error('Error filing complaint:', error);
      Alert.alert('Error', 'Failed to submit the report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [result, capturedUri, location]);

  const handleScanAgain = useCallback(() => {
    setCapturedUri(null);
    setResult(null);
    setLocation(null);
    setIsSubmitting(false);
    setSubmitted(false);
    setPointsAwarded(null);
    setScanState('camera');
  }, []);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan and classify your waste items.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && styles.permissionButtonPressed,
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show classification result
  if (scanState === 'result' && result && capturedUri) {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Pressable onPress={handleScanAgain} style={styles.headerBackButton}>
            <Text style={styles.headerBackText}>← Back</Text>
          </Pressable>
          <Text style={styles.resultHeaderTitle}>Classification Result</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ClassificationResultCard
          result={result}
          imageUri={capturedUri}
          location={location}
          onSubmitReport={handleSubmitReport}
          onScanAgain={handleScanAgain}
          isSubmitting={isSubmitting}
          submitted={submitted}
          pointsAwarded={pointsAwarded}
        />
      </SafeAreaView>
    );
  }

  // Show processing state
  if (scanState === 'processing') {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.processingTitle}>Analyzing Waste...</Text>
          <Text style={styles.processingSubtitle}>
            AI is classifying the captured image
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Top overlay */}
        <SafeAreaView style={styles.topOverlay}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.scanTitle}>Scan Waste</Text>
          <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.flipButtonText}>🔄</Text>
          </Pressable>
        </SafeAreaView>

        {/* Center scanning guide */}
        <View style={styles.scanGuideContainer}>
          <View style={styles.scanGuide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanHint}>
            Point camera at waste item
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomOverlay}>
          <Pressable
            style={({ pressed }) => [
              styles.captureButton,
              pressed && styles.captureButtonPressed,
            ]}
            onPress={handleCapture}
          >
            <View style={styles.captureButtonInner} />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout containers
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Permission screen
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonPressed: {
    opacity: 0.8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
  },

  // Processing screen
  processingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  processingSubtitle: {
    fontSize: 15,
    color: '#888',
  },

  // Result header
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBackButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  headerBackText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  resultHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 60,
  },

  // Camera overlays
  topOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  scanTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 20,
  },

  // Scanning guide
  scanGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGuide: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2E7D32',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontWeight: '500',
  },

  // Bottom controls
  bottomOverlay: {
    paddingBottom: Platform.OS === 'android' ? 40 : 30,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
