import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { type ClassificationResult } from '@/services/waste-classifier';
import { type GeoLocation } from '@/services/complaint-store';
import { formatCoordinates } from '@/services/location-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ClassificationResultCardProps {
  result: ClassificationResult;
  imageUri: string;
  location: GeoLocation | null;
  onSubmitReport: () => void;
  onScanAgain: () => void;
  isSubmitting: boolean;
  submitted: boolean;
  pointsAwarded: number | null;
}

export function ClassificationResultCard({
  result,
  imageUri,
  location,
  onSubmitReport,
  onScanAgain,
  isSubmitting,
  submitted,
  pointsAwarded,
}: ClassificationResultCardProps) {
  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? '#4CAF50'
      : confidencePercent >= 60
        ? '#FF9800'
        : '#F44336';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Captured Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.capturedImage} contentFit="cover" />
        <View style={[styles.categoryBadge, { backgroundColor: result.color }]}>
          <Text style={styles.categoryBadgeText}>
            {result.icon} {result.label}
          </Text>
        </View>
      </View>

      {/* Classification Result */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>{result.icon}</Text>
          <View style={styles.resultHeaderText}>
            <Text style={styles.resultTitle}>{result.label}</Text>
            <View style={styles.confidenceRow}>
              <View style={styles.confidenceBarBg}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${confidencePercent}%`,
                      backgroundColor: confidenceColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidencePercent}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.description}>{result.description}</Text>

        {/* Recyclable Badge */}
        <View
          style={[
            styles.recyclableBadge,
            {
              backgroundColor: result.recyclable ? '#E8F5E9' : '#FFF3E0',
              borderColor: result.recyclable ? '#4CAF50' : '#FF9800',
            },
          ]}
        >
          <Text
            style={[
              styles.recyclableText,
              { color: result.recyclable ? '#2E7D32' : '#E65100' },
            ]}
          >
            {result.recyclable ? '♻️ Recyclable' : '🚫 Not Recyclable'}
          </Text>
        </View>

        {/* Disposal Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>💡 Disposal Tip</Text>
          <Text style={styles.tipText}>{result.disposalTip}</Text>
        </View>

        {/* GPS Location */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Location</Text>
          {location ? (
            <>
              <Text style={styles.locationCoords}>
                {formatCoordinates(location.latitude, location.longitude)}
              </Text>
              {location.address && (
                <Text style={styles.locationAddress}>{location.address}</Text>
              )}
            </>
          ) : (
            <Text style={styles.locationUnavailable}>Location unavailable</Text>
          )}
        </View>
      </View>

      {/* Points Celebration */}
      {submitted && pointsAwarded !== null && (
        <View style={styles.pointsCelebration}>
          <Text style={styles.pointsEmoji}>🎉</Text>
          <Text style={styles.pointsTitle}>Report Submitted!</Text>
          <Text style={styles.pointsValue}>+{pointsAwarded} points</Text>
          <Text style={styles.pointsSubtext}>Thank you for keeping our city clean!</Text>
        </View>
      )}

      {/* Submit / Scan Again Buttons */}
      {!submitted ? (
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              (!location || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={onSubmitReport}
            disabled={!location || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                📋 Submit Complaint
              </Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.scanAgainButtonOutline,
              pressed && styles.scanAgainButtonPressed,
            ]}
            onPress={onScanAgain}
          >
            <Text style={styles.scanAgainTextOutline}>📷 Retake Photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.scanAgainButton,
            pressed && styles.scanAgainButtonPressed,
          ]}
          onPress={onScanAgain}
        >
          <Text style={styles.scanAgainText}>📷 Scan Another Item</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    marginBottom: 16,
  },
  recyclableBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  recyclableText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  scanAgainButton: {
    backgroundColor: '#2E7D32',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanAgainButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  locationContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  locationCoords: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  locationAddress: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    lineHeight: 20,
  },
  locationUnavailable: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  pointsCelebration: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  pointsEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
  },
  pointsSubtext: {
    fontSize: 14,
    color: '#4CAF50',
  },
  buttonRow: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scanAgainButtonOutline: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanAgainTextOutline: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
});
