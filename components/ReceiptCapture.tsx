import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { parseReceiptImage } from '../lib/services/receiptParser';
import PhotoCapture, { type PhotoCaptureHandle } from './PhotoCapture';
import type { TransactionInput } from '../lib/types';

interface ReceiptCaptureProps {
  onImageCaptured: (imageUri: string) => void;
  onReceiptParsed?: (parsed: Partial<TransactionInput>) => void;
  capturedImage?: string;
}

export default function ReceiptCapture({ onImageCaptured, onReceiptParsed, capturedImage }: ReceiptCaptureProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null);

  const analyzeReceipt = async (uri: string) => {
    if (!onReceiptParsed) return;

    setAnalyzing(true);
    try {
      const { data } = await parseReceiptImage(uri);
      if (data) {
        onReceiptParsed(data);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCaptured = (uri: string) => {
    onImageCaptured(uri);
    analyzeReceipt(uri);
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Receipt Photo',
      'Are you sure you want to remove this receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onImageCaptured('') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Receipt Photo (Optional)</Text>

      {capturedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.receiptImage} />
          {analyzing && <Text style={styles.analyzingText}>Analyzing receipt...</Text>}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={removeImage}>
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => photoCaptureRef.current?.openCamera()}>
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <PhotoCapture
        ref={photoCaptureRef}
        onCaptured={handleCaptured}
        modalTitle="Capture Receipt"
        guideText="Position receipt within the frame"
        aspectRatio={[3, 4]}
        hideButtons={!!capturedImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  imageContainer: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  analyzingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
});