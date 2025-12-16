import { FontAwesome } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const colors = {
  brandGreen: '#3E9B4F',
  brandBlue: '#007AFF',
  brandGrayText: '#8A8A8E',
  brandGrayBorder: '#D1D1D6',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password) // assumes password column; consider hashing in production
        .maybeSingle();

      if (error) {
        Alert.alert('Login Failed', error.message);
        setLoading(false);
        return;
      }

      if (!userProfile) {
        Alert.alert('Login Failed', 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.phoneFrame}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQgDWUXUvaG8Sig9YPNaUo4ileQEXp1kF4z-ASwmIk9PVBpqN7AiYb_pWGwP61LLl8bnGoQ81vGcEnRA2HAiJuH723dJm07YUIDCTV76QetcaxBhkDxlJhmKjwPtWMwh-r69MOAFck-eI-hltoxzfcao7-Cm32auwF1-qHuQCXtilsII_P1Y0A2QZgIu1PFIKunehRgNSO_JDGUX5keuTk28ByeU2FJbe5gyy1VllzwqN-ksiFKH6vFgv9ccAQgoAd_tauBvWTG93q',
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Smart Irrigation &amp; Monitor</Text>
              <Text style={styles.subtitle}>User Login</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <FontAwesome name="envelope" size={16} color={colors.brandGrayText} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor={colors.brandGrayText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={18} color={colors.brandGrayText} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.brandGrayText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.togglePasswordButton}
                  activeOpacity={0.7}
                  onPress={() => setShowPassword((prev) => !prev)}>
                  <FontAwesome
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={18}
                    color={colors.brandGrayText}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotWrapper} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?{' '}
              <Link href="/UserManagement/signup" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  phoneFrame: {
    flex: 1,
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 24,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 28,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: '#000',
    marginTop: 8,
  },
  form: {
    gap: 14,
    paddingTop: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    paddingLeft: 48,
    paddingRight: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#000',
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.brandBlue,
  },
  loginButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.brandGrayText,
  },
  footerLink: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brandBlue,
  },
});

