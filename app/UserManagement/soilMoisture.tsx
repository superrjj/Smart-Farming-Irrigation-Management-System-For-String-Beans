import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';

const colors = {
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  accent: '#22C55E',
  text: '#0F172A',
  subText: '#64748B',
  card: '#FFFFFF',
  bg: '#F8FAFF',
  border: '#E2E8F0',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const MOISTURE_POINTS = [55, 60, 57, 63, 65, 62, 68];
const AREAS = [
  { id: 1, name: 'Area 1', moisture: 70 },
  { id: 2, name: 'Area 2', moisture: 64 },
  { id: 3, name: 'Area 3', moisture: 78 },
];

function LineChart({ data, color }: { data: number[]; color: string }) {
  const { points } = useMemo(() => {
    const w = 240;
    const h = 120;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = Math.max(1, max - min);
    const stepX = data.length > 1 ? w / (data.length - 1) : 0;
    const pts = data
      .map((v, idx) => {
        const x = idx * stepX;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
    return { points: pts };
  }, [data]);

  return (
    <View style={styles.chartShell}>
      <Svg height="140" width="100%" viewBox="0 0 240 140">
        <Polyline points={points} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function GaugeRing({ percent }: { percent: number }) {
  const size = 110;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <View style={styles.gaugeShell}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.gaugeCenter}>
        <Text style={styles.gaugeValue}>{percent}%</Text>
        <Text style={styles.gaugeLabel}>Soil moisture</Text>
      </View>
    </View>
  );
}

export default function SoilMoistureScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>SOIL MOISTURE</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today trend</Text>
              <Text style={styles.cardPill}>Live</Text>
            </View>
            <LineChart data={MOISTURE_POINTS} color={colors.primary} />
            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.metricLabel}>Current</Text>
                <Text style={styles.metricValue}>68%</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>Optimal range</Text>
                <Text style={styles.metricValue}>60 - 80%</Text>
              </View>
            </View>
          </View>

          {AREAS.map(area => (
            <View key={area.id} style={styles.areaCard}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <TouchableOpacity>
                  <FontAwesome name="info-circle" size={16} color={colors.subText} />
                </TouchableOpacity>
              </View>
              <GaugeRing percent={area.moisture} />
              <View style={styles.areaFooter}>
                <Text style={styles.areaFootLabel}>Status</Text>
                <Text style={styles.areaFootValue}>
                  {area.moisture >= 60 && area.moisture <= 80 ? 'Optimal' : 'Needs check'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backButton: { padding: 6 },
  titleWrap: { flex: 1, marginLeft: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, letterSpacing: 0.4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.subText, marginTop: 2 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  cardPill: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryDark,
    backgroundColor: '#E0EAFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartShell: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 8,
  },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.subText },
  metricValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 2 },
  areaCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  areaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  areaName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  gaugeShell: { alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  gaugeLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.subText },
  areaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  areaFootLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.subText },
  areaFootValue: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryDark },
});

