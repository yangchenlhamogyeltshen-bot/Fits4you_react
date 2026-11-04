import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Try to copy the photo into the app's own folder. If that fails for any
// reason, keep using the original photo so the user is never blocked.
async function keepPhoto(uri) {
  try {
    const { File, Directory, Paths } = FileSystem;
    if (!File || !Directory || !Paths) return uri;
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create();
    const dest = new File(dir, `photo_${Date.now()}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

// Returns the photo uri, or null if cancelled or failed
export async function pickPhoto(useCamera) {
  let stage = 'start';
  try {
    stage = 'permission';
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access in your phone settings.');
      return null;
    }

    stage = 'opening camera/gallery';
    const options = { mediaTypes: ['images'], quality: 0.6 };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;

    stage = 'saving photo';
    return await keepPhoto(result.assets[0].uri);
  } catch (e) {
    Alert.alert('Photo error at: ' + stage, String(e && e.message ? e.message : e));
    return null;
  }
}