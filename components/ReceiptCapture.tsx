import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { resizeReceiptImage } from '../lib/utils/imageResize';
import { parseReceiptImage } from '../lib/services/receiptParser';
import type { TransactionInput } from '../lib/types';

interface ReceiptCaptureProps {
  onImageCaptured: (imageUri: string) => void;
  onReceiptParsed?: (parsed: Partial<TransactionInput>) => void;
  capturedImage?: string;
}

export default function ReceiptCapture({ onImageCaptured, onReceiptParsed, capturedImage }: ReceiptCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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

  const requestCameraPermission = async () => {
    if (!permission) {
      const { status } = await requestPermission();
      return status === 'granted';
    }
    return permission.granted;
  };

  const takePicture = async (camera: any) => {
    if (camera) {
      try {
        const photo = await camera.takePictureAsync({
          quality: 0.7,
          base64: false,
          skipProcessing: true,
        });
        
        if (photo && photo.uri) {
          const resizedUri = await resizeReceiptImage(photo.uri);
          onImageCaptured(resizedUri);
          setShowCamera(false);
          analyzeReceipt(resizedUri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const resizedUri = await resizeReceiptImage(result.assets[0].uri);
        onImageCaptured(resizedUri);
        analyzeReceipt(resizedUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowCamera(true);
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera access to take receipt photos',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: requestPermission },
        ]
      );
    }
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

  let cameraRef: any = null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Receipt Photo (Optional)</Text>
      
      {capturedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.receiptImage} />
          {analyzing && <Text style={styles.analyzingText}>Analyzing receipt...</Text>}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={removeImage}>
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.captureOptions, Platform.OS === 'web' && styles.singleButtonContainer]}>
          {Platform.OS === 'web' ? (
            // Web platform - single button for both camera and gallery
            <TouchableOpacity style={[styles.captureButton, styles.singleButton]} onPress={pickFromGallery}>
              <Text style={styles.captureButtonText}>📷 Take Photo or Choose from Gallery</Text>
            </TouchableOpacity>
          ) : (
            // Mobile platform - separate buttons
            <>
              <TouchableOpacity style={styles.captureButton} onPress={openCamera}>
                <Text style={styles.captureButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.captureButton} onPress={pickFromGallery}>
                <Text style={styles.captureButtonText}>📁 Choose from Gallery</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={(ref) => (cameraRef = ref)}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Capture Receipt</Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.receiptGuide}>
                <View style={styles.guideFrame} />
                <Text style={styles.guideText}>
                  Position receipt within the frame
                </Text>
              </View>

              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButtonLarge}
                  onPress={() => takePicture(cameraRef)}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
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
  captureOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  singleButtonContainer: {
    flexDirection: 'column',
  },
  singleButton: {
    flex: 0,
    width: '100%',
    minHeight: 48,
  },
  captureButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  receiptGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guideFrame: {
    width: '90%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraControls: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  captureButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});