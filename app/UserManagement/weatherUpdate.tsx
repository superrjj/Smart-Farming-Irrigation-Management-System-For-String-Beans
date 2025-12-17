import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  brandBlue: '#007AFF',
  brandBlueDark: '#004E92',
  brandBlueLight: '#4FACFE',
  brandGrayText: '#8A8A8E',
  brandGrayBorder: '#D1D1D6',
  cardBg: '#111827',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const FORECAST = [
  { day: 'Today', temp: '28°', icon: 'sun-o' },
  { day: 'Tue', temp: '29°', icon: 'cloud' },
  { day: 'Wed', temp: '30°', icon: 'umbrella' },
  { day: 'Thu', temp: '27°', icon: 'sun-o' },
];

export default function WeatherUpdateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={20} color="#000" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Weather Update</Text>

          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="search" size={18} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="bell-o" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Location row */}
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>Dalayap, Tarlac City</Text>
            <View style={styles.locationRight}>
              <FontAwesome name="map-marker" size={16} color={colors.brandBlue} />
            </View>
          </View>

          {/* Main weather card */}
          <LinearGradient
            colors={[colors.brandBlueLight, colors.brandBlueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCard}>
            <View style={styles.mainTopRow}>
              <View>
                <Text style={styles.mainTemp}>28°</Text>
                <Text style={styles.mainCondition}>Light Rain</Text>
                <Text style={styles.mainDetail}>Feels like 30°</Text>
              </View>
              <View style={styles.mainIconCircle}>
                <FontAwesome name="umbrella" size={38} color="#fff" />
              </View>
            </View>

            <View style={styles.mainBottomRow}>
              <View style={styles.infoPill}>
                <FontAwesome name="tint" size={14} color="#fff" />
                <Text style={styles.infoPillText}>Humidity 78%</Text>
              </View>
              <View style={styles.infoPill}>
                <FontAwesome name="leaf" size={14} color="#fff" />
                <Text style={styles.infoPillText}>Soil moisture 80%</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Today summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rain chance</Text>
              <Text style={styles.summaryValue}>65%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Wind</Text>
              <Text style={styles.summaryValue}>8 km/h</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>UV Index</Text>
              <Text style={styles.summaryValue}>4 (Moderate)</Text>
            </View>
          </View>

          {/* Forecast list */}
          <View style={styles.forecastCard}>
            <Text style={styles.forecastTitle}>Next days</Text>
            {FORECAST.map((f, idx) => (
              <View key={f.day} style={[styles.forecastRow, idx !== 0 && styles.forecastRowDivider]}>
                <Text style={styles.forecastDay}>{f.day}</Text>
                <View style={styles.forecastRight}>
                  <FontAwesome name={f.icon as any} size={18} color={colors.brandBlueLight} />
                  <Text style={styles.forecastTemp}>{f.temp}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
    paddingHorizontal: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#000',
  },
  locationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  mainTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTemp: {
    fontFamily: fonts.bold,
    fontSize: 52,
    color: '#fff',
  },
  mainCondition: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: '#E5E7EB',
  },
  mainDetail: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#E5E7EB',
  },
  mainIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    gap: 6,
  },
  infoPillText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.brandGrayText,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#000',
  },
  forecastCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.brandGrayBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  forecastTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    marginBottom: 6,
    color: '#000',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  forecastRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.brandGrayBorder,
  },
  forecastDay: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000',
  },
  forecastRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastTemp: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000',
  },
});


