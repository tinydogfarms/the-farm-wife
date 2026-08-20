import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_RECEIPT_DIMENSION = 1600;
const RECEIPT_COMPRESSION_QUALITY = 0.7;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/**
 * Caps an image to MAX_RECEIPT_DIMENSION on its longest side, re-encoding as
 * JPEG at RECEIPT_COMPRESSION_QUALITY. Returns the original uri unchanged if
 * it's already within the cap (avoids upscaling/re-encoding small images).
 */
export async function resizeReceiptImage(uri: string): Promise<string> {
  try {
    const { width, height } = await getImageSize(uri);
    const longestSide = Math.max(width, height);

    if (longestSide <= MAX_RECEIPT_DIMENSION) {
      return uri;
    }

    const scale = MAX_RECEIPT_DIMENSION / longestSide;
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: Math.round(width * scale), height: Math.round(height * scale) })
      .renderAsync();
    const saved = await rendered.saveAsync({
      compress: RECEIPT_COMPRESSION_QUALITY,
      format: SaveFormat.JPEG,
    });

    return saved.uri;
  } catch (error) {
    console.error('Error resizing receipt image, using original:', error);
    return uri;
  }
}
