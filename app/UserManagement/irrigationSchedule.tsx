import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  primary: '#22C55E',
  primaryLight: '#BBF7D0',
  primaryDark: '#16A34A',
  accent: '#0EA5E9',
  grayText: '#94A3B8',
  grayBorder: '#E2E8F0',
  grayLight: '#F8FAFC',
  dark: '#0F172A',
  white: '#FFFFFF',
};

const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Mock schedule data
const SCHEDULED_TIMES = [
  { id: 1, time: '08:00 AM', enabled: true },
  { id: 2, time: '10:00 AM', enabled: true },
  { id: 3, time: '12:00 NN', enabled: true },
];

// Mock scheduled dates (days of month that have irrigation scheduled)
const SCHEDULED_DATES = [20, 21, 22];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export default function IrrigationScheduleScreen() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<number[]>(SCHEDULED_DATES);
  const [schedules, setSchedules] = useState(SCHEDULED_TIMES);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  // Generate calendar days array
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const toggleDate = (day: number) => {
    if (selectedDates.includes(day)) {
      setSelectedDates(selectedDates.filter(d => d !== day));
    } else {
      setSelectedDates([...selectedDates, day]);
    }
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const handleAddSchedule = () => {
    // TODO: Implement add schedule modal/screen
    console.log('Add new schedule');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={18} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={styles.topBarTitle}>IRRIGATION SCHEDULE</Text>
            <TouchableOpacity onPress={handleAddSchedule} style={styles.addIconButton}>
              <FontAwesome name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Hero / Status */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroTitle}>Healthy String Beans</Text>
                <Text style={styles.heroSubtitle}>Keep soil moisture balanced</Text>
              </View>
              <TouchableOpacity style={styles.heroCTA} onPress={handleAddSchedule}>
                <FontAwesome name="plus" size={14} color={colors.white} />
                <Text style={styles.heroCTAText}>Add Schedule</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Scheduled days</Text>
                <Text style={styles.statValue}>{selectedDates.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Next watering</Text>
                <Text style={styles.statValue}>08:00 AM</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Mode</Text>
                <Text style={styles.statValue}>Smart</Text>
              </View>
            </View>
          </View>

          {/* Time Schedule Card */}
          <View style={styles.timeScheduleCard}>
            <View style={styles.timeScheduleLeft}>
              <Text style={styles.timeScheduleTitle}>Time schedule</Text>
              <Text style={styles.timeScheduleSubtitle}>
                Toggle or adjust irrigation slots
              </Text>
            </View>
            <View style={styles.timeScheduleRight}>
              {schedules.map((schedule) => (
                <View key={schedule.id} style={styles.timeRow}>
                  <Text style={styles.timeText}>{schedule.time}</Text>
                  <TouchableOpacity style={styles.timeToggle}>
                    <FontAwesome
                      name={schedule.enabled ? 'toggle-on' : 'toggle-off'}
                      size={20}
                      color={schedule.enabled ? colors.primary : colors.grayText}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                <FontAwesome name="chevron-left" size={16} color={colors.grayText} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth].toUpperCase()}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <FontAwesome name="chevron-right" size={16} color={colors.grayText} />
              </TouchableOpacity>
            </View>

            {/* Year */}
            <Text style={styles.yearText}>{currentYear}</Text>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.dayHeader}>
                  {day.charAt(0)}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isSelected = day !== null && selectedDates.includes(day);
                const isTodayDate = day !== null && isToday(day);
                
                // Check if this date is part of a consecutive selection
                const isPrevSelected = day !== null && selectedDates.includes(day - 1);
                const isNextSelected = day !== null && selectedDates.includes(day + 1);
                const isMiddle = isPrevSelected && isNextSelected;
                const isStart = isSelected && !isPrevSelected && isNextSelected;
                const isEnd = isSelected && isPrevSelected && !isNextSelected;
                const isSingle = isSelected && !isPrevSelected && !isNextSelected;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDay,
                      isMiddle && styles.middleDay,
                      isStart && styles.startDay,
                      isEnd && styles.endDay,
                      isSingle && styles.singleDay,
                    ]}
                    onPress={() => day && toggleDate(day)}
                    disabled={day === null}>
                    <Text
                      style={[
                        styles.dayText,
                        day === null && styles.emptyDay,
                        isSelected && styles.selectedDayText,
                        isTodayDate && !isSelected && styles.todayText,
                      ]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Scheduled</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.grayText }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <FontAwesome name="clock-o" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Edit Times</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <FontAwesome name="calendar-check-o" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <FontAwesome name="trash-o" size={18} color="#EF4444" />
              <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Clear</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <FontAwesome name="info-circle" size={16} color={colors.grayText} />
            <Text style={styles.footerText}>
              {selectedDates.length} days scheduled this month
            </Text>
          </View>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.grayLight,
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
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grayBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  addIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 18,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.dark,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.grayText,
    marginTop: 2,
  },
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  heroCTAText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.grayText,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.dark,
    marginTop: 6,
  },
  timeScheduleCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    padding: 16,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  timeScheduleLeft: {
    justifyContent: 'center',
    width: 140,
  },
  timeScheduleTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.dark,
    lineHeight: 24,
  },
  timeScheduleSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.grayText,
    marginTop: 4,
  },
  timeScheduleRight: {
    flex: 1,
    gap: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark,
  },
  timeToggle: {
    padding: 4,
  },
  calendarSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 4,
  },
  navButton: {
    padding: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
  },
  monthTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.dark,
    letterSpacing: 1,
    minWidth: 140,
    textAlign: 'center',
  },
  yearText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.grayText,
    textAlign: 'center',
    marginBottom: 14,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.grayText,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.grayBorder,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.white,
  },
  dayText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.dark,
  },
  emptyDay: {
    color: 'transparent',
  },
  selectedDay: {
    backgroundColor: colors.primaryLight,
  },
  startDay: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  endDay: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  middleDay: {
    borderRadius: 0,
  },
  singleDay: {
    borderRadius: 20,
  },
  selectedDayText: {
    color: colors.primaryDark,
    fontFamily: fonts.semibold,
  },
  todayText: {
    color: colors.accent,
    fontFamily: fonts.bold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.grayText,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
  },
  quickActionText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayBorder,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.grayText,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
});

