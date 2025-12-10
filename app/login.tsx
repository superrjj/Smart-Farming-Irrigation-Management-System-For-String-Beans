import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.phoneFrame}>
          <View style={styles.statusBar}>
            <Text style={styles.statusTime}>10:09 AM</Text>
            <View style={styles.statusIcons}>
              <FontAwesome name="signal" size={14} color={colors.brandGrayText} />
              <FontAwesome name="wifi" size={14} color={colors.brandGrayText} />
              <FontAwesome name="battery-full" size={16} color={colors.brandGrayText} />
            </View>
          </View>

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
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={18} color={colors.brandGrayText} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.brandGrayText}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.forgotWrapper} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} activeOpacity={0.9}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?{' '}
              <Link href="/" asChild>
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  statusTime: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: '#1C1C1E',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: 'space-between',
    gap: 16,
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
    fontSize: 13,
    color: colors.brandGrayText,
  },
  footerLink: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.brandBlue,
  },
});

