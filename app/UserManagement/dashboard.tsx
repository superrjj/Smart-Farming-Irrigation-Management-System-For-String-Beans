import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
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

const MENU_ITEMS = [
  { key: 'soil', icon: 'leaf', label: 'Soil Moisture' },
  { key: 'temp', icon: 'thermometer', label: 'Temperature' },
  { key: 'humidity', icon: 'tint', label: 'Humidity' },
  { key: 'weather', icon: 'cloud', label: 'Weather Update' },
  { key: 'water', icon: 'tint', label: 'Water Distribution' },
  { key: 'schedule', icon: 'calendar', label: 'Irrigation Schedule' },
];

const ANALYTICS_SUB_ITEMS = [
  { key: 'env', label: 'Environmental Condition Pattern Analyzer' },
  { key: 'seasonal', label: 'Seasonal Irrigation Behavior Summary' },
];

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.8);

export default function DashboardScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const router = useRouter();

  // TODO: replace this mock value with real soil moisture percentage from Supabase/sensors
  const soilMoisturePercent = 80;

  const [fullName, setFullName] = useState<string>('Farmer');
  const [loadingName, setLoadingName] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Disable Android hardware back when on dashboard (so user can't go back to login)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Returning true tells React Native we've handled the back press
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!email) {
        setLoadingName(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('email', email)
          .maybeSingle();

        if (!error && data?.name) {
          setFullName(data.name);
        }
      } catch {
        // ignore for now, keep default name
      } finally {
        setLoadingName(false);
      }
    };

    fetchProfile();
  }, [email]);

  useEffect(() => {
    Animated.timing(drawerX, {
      toValue: menuOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [menuOpen, drawerX]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setMenuOpen(false);
          setLoggingOut(true);
          try {
            // Small delay to show loader; navigation time still depends on device/network
            await new Promise(resolve => setTimeout(resolve, 600));
            router.replace('/UserManagement/login');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <FontAwesome name="bars" size={22} color="#000" />
          </TouchableOpacity>


          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="bell" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="user-circle-o" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main dashboard content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Dashboard</Text>

          {/* Circular gauge placeholder */}
          <View style={styles.gaugeCard}>
            <View style={styles.gaugeOuter}>
              <View style={styles.gaugeInner}>
                <Text style={styles.gaugeValue}>{soilMoisturePercent}%</Text>
                <Text style={styles.gaugeLabel}>Soil Moisture</Text>
              </View>
            </View>
          </View>

          {/* Simple charts placeholders */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Irrigation Trends</Text>
            <View style={styles.barRow}>
              {[60, 40, 70, 50, 80].map((h, idx) => (
                <View key={idx} style={[styles.bar, { height: 40 + h / 2 }]} />
              ))}
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Sensor Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Temp</Text>
                <Text style={styles.summaryValue}>26°C</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Humidity</Text>
                <Text style={styles.summaryValue}>65%</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Water Flow</Text>
                <Text style={styles.summaryValue}>1.2 L/min</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Backdrop for drawer */}
        {menuOpen && (
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        )}

        {/* Sliding sidebar menu */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: drawerX }],
            },
          ]}>
          <ScrollView
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}>
            {/* User header inside drawer */}
            <View style={styles.userHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Farmer</Text>
                {loadingName ? (
                  <ActivityIndicator size="small" color={colors.brandBlue} />
                ) : (
                  <Text style={styles.userName}>{fullName}</Text>
                )}
              </View>
            </View>

            {/* Menu */}
            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Menu</Text>

              {MENU_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.menuItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item.key === 'weather') {
                      setMenuOpen(false);
                      router.push({
                        pathname: '/UserManagement/weatherUpdate',
                        params: { email },
                      });
                    }
                  }}>
                  <View style={styles.menuItemLeft}>
                    <FontAwesome name={item.icon as any} size={18} color={colors.brandBlue} />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color={colors.brandGrayText} />
                </TouchableOpacity>
              ))}

              {/* Analytics & Reporting */}
              <View className="analytics-header" style={styles.analyticsHeader}>
                <View style={styles.menuItemLeft}>
                  <FontAwesome name="bar-chart" size={18} color={colors.brandBlue} />
                  <Text style={styles.menuItemLabel}>Analytics &amp; Reporting</Text>
                </View>
              </View>

              {ANALYTICS_SUB_ITEMS.map(sub => (
                <TouchableOpacity key={sub.key} style={styles.subMenuItem} activeOpacity={0.8}>
                  <Text style={styles.subMenuItemLabel}>{sub.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Settings */}
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
                <View style={styles.menuItemLeft}>
                  <FontAwesome name="cog" size={18} color={colors.brandBlue} />
                  <Text style={styles.menuItemLabel}>Settings</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.brandGrayText} />
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity style={styles.logoutItem} activeOpacity={0.8} onPress={handleLogout}>
                <View style={styles.menuItemLeft}>
                  <FontAwesome name="sign-out" size={18} color="#FF3B30" />
                  <Text style={styles.logoutLabel}>Log Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {loggingOut && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Logging out...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brandGrayBorder,
  },
  topBarTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#000',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    marginBottom: 12,
    color: '#000',
  },
  gaugeCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gaugeOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 14,
    borderColor: colors.brandBlue,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  gaugeInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.brandBlue,
  },
  gaugeLabel: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brandGrayText,
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    padding: 14,
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    marginBottom: 10,
    color: '#000',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    backgroundColor: colors.brandGreen,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.brandGrayText,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#000',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.brandBlue,
  },
  userInfo: {
    marginLeft: 12,
  },
  userLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.brandGrayText,
  },
  userName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#000',
  },
  menuSection: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  menuTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brandGrayText,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brandGrayBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.brandGrayBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000',
  },
  analyticsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.brandGrayBorder,
    backgroundColor: '#F7F7F8',
  },
  subMenuItem: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.brandGrayBorder,
  },
  subMenuItemLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.brandGrayText,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  logoutLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#FF3B30',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  drawerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#fff',
  },
});


