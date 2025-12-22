import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

const colors = {
  brandGreen: '#22C55E',
  brandBlue: '#3B82F6',
  brandGrayText: '#6B7280',
  brandGrayBorder: '#E5E7EB',
  cardBg: '#F9FAFB',
  orange: '#F97316',
  purple: '#A855F7',
  red: '#EF4444',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

interface UserProfile {
  name: string;
  contactNumber: string;
  email: string;
  profilePicture?: string;
}

export default function FarmerProfileScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    contactNumber: '',
    email: email,
    profilePicture: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showBasicInfoSection, setShowBasicInfoSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [email]);

  const fetchProfile = async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (!error && data) {
        setProfile({
          name: data.name || '',
          contactNumber: data.phone_number || '',
          email: data.email || email,
          profilePicture: data.profile_picture || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!profile.contactNumber.trim()) {
      Alert.alert('Error', 'Please enter your contact number');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving profile:', {
        email: profile.email,
        name: profile.name.trim(),
        phone_number: profile.contactNumber.trim(),
        profile_picture: profile.profilePicture || null,
      });
      
      const { error, data } = await supabase
        .from('user_profiles')
        .upsert({
          email: profile.email,
          name: profile.name.trim(),
          phone_number: profile.contactNumber.trim(),
          profile_picture: profile.profilePicture || null,
        }, {
          onConflict: 'email'
        });

      console.log('Save result:', { error, data });

      if (error) {
        console.error('Database save error:', error);
        Alert.alert('Error', `Failed to save profile: ${error.message}`);
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter your new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', 'Failed to update password');
      } else {
        Alert.alert('Success', 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const permissionResult = source === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission required', `Permission to access ${source === 'camera' ? 'camera' : 'photo library'} is required!`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (!result.canceled && result.assets[0]) {
      console.log('Image selected:', {
        uri: result.assets[0].uri,
        width: result.assets[0].width,
        height: result.assets[0].height,
        fileSize: result.assets[0].fileSize,
      });
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      console.log('Starting image upload for:', uri);
      
      // Create FormData and append the file
      const formData = new FormData();
      
      // Extract file extension
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const userId = email.replace(/[@.]/g, '-');
      const fileName = `farmer_profile_pictures/${userId}/profile-${Date.now()}.${fileExtension}`;
      
      // Create file object for FormData
      const file = {
        uri: uri,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        name: fileName.split('/').pop() || 'profile.jpg',
      } as any;
      
      formData.append('file', file);
      
      console.log('Uploading file:', fileName);
      
      // Get Supabase credentials
      // Note: Make sure these are exported from your supabase.ts file
      const supabaseUrl = (supabase as any).supabaseUrl || 'https://xzouepokakzubwjogmdr.supabase.co';
      const supabaseKey = (supabase as any).supabaseKey || '';
      
      // If the above doesn't work, you can also get them from the session
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || supabaseKey;
      
      // Upload using fetch with FormData
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/images/${fileName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      }

      console.log('Upload successful');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      
      // Wait a moment for the file to be fully available
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save the profile picture URL to the database
      const { error: dbError } = await supabase
        .from('user_profiles')
        .upsert({
          email: profile.email,
          name: profile.name.trim() || 'Farmer',
          phone_number: profile.contactNumber.trim() || '',
          profile_picture: publicUrl,
        }, {
          onConflict: 'email'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        Alert.alert('Error', 'Image uploaded but failed to save to profile');
        setUploadingImage(false);
        return;
      }
      
      // Update local state
      setProfile({ ...profile, profilePicture: publicUrl });
      
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to upload image: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandBlue} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Card */}
          <View style={styles.card}>
            <View style={styles.profilePicHeader}>
              <Text style={styles.cardTitle}>Profile Picture</Text>
            </View>

            <View style={styles.profilePicSection}>
              <View style={styles.profilePicContainer}>
                {profile.profilePicture ? (
                  <Image
                    source={{ uri: profile.profilePicture }}
                    style={styles.profilePicImage}
                    onError={(e) => {
                      console.log('Image failed to load:', profile.profilePicture);
                      console.log('Error details:', e.nativeEvent.error);
                    }}
                    onLoad={() => console.log('Image loaded successfully:', profile.profilePicture)}
                  />
                ) : (
                  <View style={styles.profilePicPlaceholder}>
                    <FontAwesome name="user" size={40} color={colors.brandGrayText} />
                  </View>
                )}
              </View>

              <View style={styles.profilePicButtons}>
                <TouchableOpacity
                  style={[styles.profilePicButton, styles.cameraButton]}
                  onPress={() => pickImage('camera')}
                  disabled={uploadingImage}
                >
                  <FontAwesome name="camera" size={16} color="#fff" />
                  <Text style={styles.profilePicButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profilePicButton, styles.galleryButton]}
                  onPress={() => pickImage('library')}
                  disabled={uploadingImage}
                >
                  <FontAwesome name="image" size={16} color="#fff" />
                  <Text style={styles.profilePicButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              {uploadingImage && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color={colors.brandBlue} />
                  <Text style={styles.uploadingText}>Uploading photo...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Basic Information Card */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.basicInfoHeader}
              onPress={() => setShowBasicInfoSection(!showBasicInfoSection)}
            >
              <Text style={styles.cardTitle}>Basic Information</Text>
              <FontAwesome
                name={showBasicInfoSection ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.brandGrayText}
              />
            </TouchableOpacity>

            {showBasicInfoSection && (
              <View style={styles.basicInfoSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(text) => setProfile({ ...profile, name: text })}
                    placeholder="Enter your full name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.contactNumber}
                    onChangeText={(text) => setProfile({ ...profile, contactNumber: text })}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={profile.email}
                    editable={false}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Password Change Card */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.passwordHeader}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Text style={styles.cardTitle}>Change Password</Text>
              <FontAwesome
                name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.brandGrayText}
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.passwordSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min 6 chars)"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.changePasswordButton}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.changePasswordButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.brandGrayText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brandGrayBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#000',
  },
  headerRight: {
    width: 28,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  basicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  basicInfoSection: {
    marginTop: 16,
  },
  profilePicSection: {
    marginTop: 16,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.brandGrayBorder,
  },
  profilePicPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: colors.brandGrayBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  profilePicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: colors.brandBlue,
  },
  galleryButton: {
    backgroundColor: colors.brandGreen,
  },
  profilePicButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: '#fff',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brandGrayText,
  },
  passwordSection: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: colors.brandGrayText,
  },
  changePasswordButton: {
    backgroundColor: colors.brandBlue,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#fff',
  },
  saveButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: colors.brandGrayText,
  },
  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#fff',
  },
});