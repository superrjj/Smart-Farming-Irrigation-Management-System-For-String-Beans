import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  { day: 'Today', temp: '28°', icon: 'cloud' },
  { day: 'Tue', temp: '29°', icon: 'cloud' },
  { day: 'Wed', temp: '30°', icon: 'cloud' },
  { day: 'Thu', temp: '27°', icon: 'cloud' },
];

export default function WeatherUpdateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={20} color="#000" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Weather Update</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.brandBlueLight, colors.brandBlueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.weatherWrapper}>
            {/* Location row */}
            <View style={styles.locationRow}>
              <View style={styles.locationLeft}>
                <FontAwesome name="map-marker" size={16} color="#fff" />
                <Text style={styles.locationText}>Dalayap, Tarlac City</Text>
              </View>
        
            </View>

            {/* Main temperature & icon */}
            <View style={styles.mainCenter}>
              <View style={styles.mainIconCircle}>
                <FontAwesome name="cloud" size={60} color="#fff" />
              </View>
              <Text style={styles.mainTemp}>28°</Text>
              <Text style={styles.mainCondition}>Light Rain</Text>
              <Text style={styles.mainDetail}>Max 29° · Min 23°</Text>
            </View>

            {/* Small info pills */}
            <View style={styles.pillRow}>
              <View style={styles.infoPill}>
                <FontAwesome name="tint" size={14} color="#fff" />
                <Text style={styles.infoPillText}>Humidity 78%</Text>
              </View>
              <View style={styles.infoPill}>
                <FontAwesome name="leaf" size={14} color="#fff" />
                <Text style={styles.infoPillText}>Soil moisture 80%</Text>
              </View>
              <View style={styles.infoPill}>
                <FontAwesome name="flag" size={14} color="#fff" />
                <Text style={styles.infoPillText}>Wind 8 km/h</Text>
              </View>
            </View>

            {/* Forecast header */}
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastTitle}>Today</Text>
              <Text style={styles.forecastSubtitle}>Next 3 days</Text>
            </View>

            {/* Horizontal forecast cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastScroll}>
              {FORECAST.map((f, index) => (
                <View
                  key={f.day}
                  style={[
                    styles.forecastCard,
                    index === 0 && styles.forecastCardActive,
                  ]}>
                  <Text style={styles.forecastDay}>{f.day}</Text>
                  <View style={styles.forecastIconRow}>
                    <FontAwesome name={f.icon as any} size={22} color="#fff" />
                  </View>
                  <Text style={styles.forecastTemp}>{f.temp}</Text>
                  <Text style={styles.forecastTime}>15:00</Text>
                </View>
              ))}
            </ScrollView>
          </LinearGradient>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brandGrayBorder,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    paddingRight: 16,
    paddingVertical: 4,
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
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  weatherWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    minHeight: '100%',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#fff',
  },
  locationSubText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#E5E7EB',
  },
  mainCenter: {
    alignItems: 'center',
    marginTop: 16,
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  forecastTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#fff',
  },
  forecastSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#E5E7EB',
  },
  forecastScroll: {
    paddingVertical: 4,
    paddingHorizontal: 10, // add side padding so cards are not flush to the edges
  },
  forecastCard: {
    width: 90,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  forecastCardActive: {
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  forecastDay: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#E5E7EB',
  },
  forecastIconRow: {
    marginTop: 6,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  forecastTemp: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#fff',
  },
  forecastTime: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#E5E7EB',
  },
});


