import { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { parseEquipmentTagImage } from '../../lib/services/equipmentTagParser';
import PhotoCapture from '../PhotoCapture';
import type { EquipmentInput } from '../../lib/types';

interface TagScannerProps {
  onScanned: (parsed: Partial<EquipmentInput>) => void;
}

export default function TagScanner({ onScanned }: TagScannerProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeTag = async (uri: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await parseEquipmentTagImage(uri);
      if (data) {
        onScanned(data);
      } else if (error) {
        Alert.alert('Could Not Read Tag', error);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <PhotoCapture
        onCaptured={analyzeTag}
        modalTitle="Scan Equipment Tag"
        guideText="Position the ID tag or nameplate within the frame"
        guideFrameHeight="40%"
        disabled={analyzing}
        captureLabel={analyzing ? 'Reading Tag...' : '📷 Scan Tag'}
        galleryLabel={analyzing ? 'Reading Tag...' : '📁 From Gallery'}
        webLabel={analyzing ? 'Reading Tag...' : '📷 Scan Tag Photo'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
});
