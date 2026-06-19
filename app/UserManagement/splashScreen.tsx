import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import bcrypt from '@/lib/bcrypt';
import { isAdminRole } from '@/lib/isAdminRole';
import {
  isFirstLaunch,
  isRememberMeEnabled,
  getSavedCredentials,
  saveLoggedInEmail,
  clearSavedCredentials,
} from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { scale } from '@/lib/responsive';

const colors = {
  brandGreen: '#3E9B4F',
};

async function verifySavedCredentials(
  emailOrPhone: string,
  password: string,
): Promise<Record<string, unknown> | null> {
  const trimmedInput = emailOrPhone.trim();
  if (!trimmedInput || !password) return null;

  const { data: emailProfile, error: emailError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', trimmedInput)
    .maybeSingle();

  if (emailError) return null;

  let userProfile: Record<string, unknown> | null = emailProfile
    ? (emailProfile as Record<string, unknown>)
    : null;

  if (!userProfile) {
    const { data: phoneProfile, error: phoneError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone_number', trimmedInput)
      .maybeSingle();
    if (phoneError || !phoneProfile) return null;
    userProfile = phoneProfile as Record<string, unknown>;
  }

  const storedPassword =
    typeof userProfile.password === 'string'
      ? userProfile.password
      : String(userProfile.password ?? '');
  const isBcryptHash = /^\$2[aby]\$/.test(storedPassword);
  let passwordMatches = false;

  if (isBcryptHash) {
    try {
      passwordMatches = await bcrypt.compare(password, storedPassword);
    } catch {
      passwordMatches = password === storedPassword;
    }
  } else {
    passwordMatches = password === storedPassword;
  }

  return passwordMatches ? userProfile : null;
}

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const checkNavigation = async () => {
      try {
        const firstLaunch = await isFirstLaunch();

        if (firstLaunch) {
          setTimeout(() => {
            router.replace('/UserManagement/welcomeScreen');
          }, 4000);
          return;
        }

        const rememberMeEnabled = await isRememberMeEnabled();

        if (rememberMeEnabled) {
          const savedCredentials = await getSavedCredentials();

          if (savedCredentials) {
            try {
              const userProfile = await verifySavedCredentials(
                savedCredentials.email,
                savedCredentials.password,
              );

              if (userProfile && typeof userProfile.email === 'string') {
                if (isAdminRole(userProfile.role)) {
                  await clearSavedCredentials();
                  setTimeout(() => {
                    router.replace({
                      pathname: '/UserManagement/login',
                      params: { blocked: 'admin' },
                    });
                  }, 4000);
                  return;
                }

                const userEmail = userProfile.email;
                await saveLoggedInEmail(userEmail);
                setTimeout(() => {
                  router.replace({
                    pathname: '/UserManagement/dashboard',
                    params: { email: userEmail },
                  });
                }, 4000);
                return;
              }

              await clearSavedCredentials();
            } catch (error) {
              console.error('Error verifying saved credentials:', error);
              try {
                await clearSavedCredentials();
              } catch (clearError) {
                console.error('Error clearing invalid credentials:', clearError);
              }
            }
          }
        }

        setTimeout(() => {
          router.replace('/UserManagement/login');
        }, 4000);
      } catch (error) {
        console.error('Error checking navigation:', error);
        setTimeout(() => {
          router.replace('/UserManagement/login');
        }, 4000);
      } finally {
        setIsChecking(false);
      }
    };

    checkNavigation();
  }, [router, fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image
          source={require('@/assets/images/agri_hydra_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandGreen,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: scale(200),
    height: scale(200),
    tintColor: '#fff',
    marginBottom: scale(40),
  },
  loader: {
    marginTop: scale(20),
  },
});
