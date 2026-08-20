import { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { resizeReceiptImage } from '../lib/utils/imageResize';

interface PhotoCaptureProps {
  onCaptured: (uri: string) => void;
  modalTitle: string;
  guideText: string;
  captureLabel?: string;
  galleryLabel?: string;
  webLabel?: string;
  disabled?: boolean;
  aspectRatio?: [number, number];
  guideFrameHeight?: `${number}%`;
  hideButtons?: boolean;
}

export interface PhotoCaptureHandle {
  openCamera: () => void;
}

function PhotoCaptureImpl({
  onCaptured,
  modalTitle,
  guideText,
  captureLabel = '📷 Take Photo',
  galleryLabel = '📁 Choose from Gallery',
  webLabel = '📷 Take Photo or Choose from Gallery',
  disabled = false,
  aspectRatio,
  guideFrameHeight = '60%',
  hideButtons = false,
}: PhotoCaptureProps, ref: React.ForwardedRef<PhotoCaptureHandle>) {
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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
          setShowCamera(false);
          onCaptured(resizedUri);
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
        ...(aspectRatio ? { aspect: aspectRatio } : {}),
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const resizedUri = await resizeReceiptImage(result.assets[0].uri);
        onCaptured(resizedUri);
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
        'Please grant camera access to take a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: requestPermission },
        ]
      );
    }
  };

  let cameraRef: any = null;

  useImperativeHandle(ref, () => ({
    openCamera,
  }));

  return (
    <View style={styles.container}>
      {!hideButtons && (Platform.OS === 'web' ? (
        <TouchableOpacity style={styles.captureButton} onPress={pickFromGallery} disabled={disabled}>
          <Text style={styles.captureButtonText}>{webLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.captureOptions}>
          <TouchableOpacity style={[styles.captureButton, styles.captureButtonHalf]} onPress={openCamera} disabled={disabled}>
            <Text style={styles.captureButtonText}>{captureLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.captureButton, styles.captureButtonHalf]} onPress={pickFromGallery} disabled={disabled}>
            <Text style={styles.captureButtonText}>{galleryLabel}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <CameraView ref={(ref) => (cameraRef = ref)} style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>{modalTitle}</Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.guideContainer}>
                <View style={[styles.guideFrame, { height: guideFrameHeight }]} />
                <Text style={styles.guideText}>{guideText}</Text>
              </View>

              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.captureButtonLarge} onPress={() => takePicture(cameraRef)}>
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

const PhotoCapture = forwardRef(PhotoCaptureImpl);
export default PhotoCapture;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
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
  captureButtonHalf: {
    flex: 1,
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
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guideFrame: {
    width: '90%',
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
