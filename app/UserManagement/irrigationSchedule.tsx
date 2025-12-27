import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

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

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export default function IrrigationScheduleScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addScheduleModalVisible, setAddScheduleModalVisible] = useState(false);
  const [newScheduleTime, setNewScheduleTime] = useState('08:00');
  const [newSchedulePeriod, setNewSchedulePeriod] = useState<'AM' | 'PM'>('AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [loading, setLoading] = useState(true);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const hours = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'));

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const visibleSchedules = schedules.slice(0, 2);
  const hasMore = schedules.length > 2;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Fetch user session
  useEffect(() => {
    fetchUserSession();
  }, [email]);

  // Fetch schedules when user is loaded
  useEffect(() => {
    if (userId) {
      fetchOrCreateSchedule();
    }
  }, [userId, currentMonth, currentYear]);

  const fetchUserSession = async () => {
    if (!email) {
      Alert.alert('Error', 'No email provided');
      setLoading(false);
      return;
    }

    try {
      // Get user ID from user_profiles table using email
      const { data: userData, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error || !userData) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'User not found');
        setLoading(false);
        return;
      }

      setUserId(userData.id);
      console.log('Loaded user ID:', userData.id);
    } catch (error) {
      console.error('Error fetching user session:', error);
      Alert.alert('Error', 'Failed to load user session');
      setLoading(false);
    }
  };

  const fetchOrCreateSchedule = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Check if schedule exists
      const { data: existingSchedule, error: scheduleError } = await supabase
        .from('irrigation_schedules')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        throw scheduleError;
      }

      let scheduleId = existingSchedule?.id;

      // Create schedule if it doesn't exist
      if (!existingSchedule) {
        const { data: newSchedule, error: createError } = await supabase
          .from('irrigation_schedules')
          .insert({
            user_id: userId,
            schedule_name: 'My Irrigation Schedule',
            is_active: true
          })
          .select()
          .single();

        if (createError) throw createError;
        scheduleId = newSchedule.id;
        console.log('Created new schedule:', scheduleId);
      }

      setCurrentScheduleId(scheduleId);
      
      // Fetch time schedules
      await fetchTimeSchedules(scheduleId);
      
      // Fetch scheduled dates for current month
      await fetchScheduledDates(scheduleId);
      
    } catch (error) {
      console.error('Error fetching schedule:', error);
      Alert.alert('Error', 'Failed to load irrigation schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSchedules = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('irrigation_time_schedules')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('time');

      if (error) throw error;
      
      console.log('Fetched time schedules:', data);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching time schedules:', error);
    }
  };

  const fetchScheduledDates = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('irrigation_scheduled_dates')
        .select('day')
        .eq('schedule_id', scheduleId)
        .eq('month', currentMonth + 1)
        .eq('year', currentYear);

      if (error) throw error;
      
      console.log('Fetched scheduled dates:', data);
      setSelectedDates(data?.map(d => d.day) || []);
    } catch (error) {
      console.error('Error fetching scheduled dates:', error);
    }
  };

  const canGoPrevMonth = () => {
    const currentDate = new Date();
    const prevMonthDate = currentMonth === 0 
      ? new Date(currentYear - 1, 11) 
      : new Date(currentYear, currentMonth - 1);
    const todayMonth = new Date(currentDate.getFullYear(), currentDate.getMonth());
    return prevMonthDate >= todayMonth;
  };

  const goToPrevMonth = () => {
    if (!canGoPrevMonth()) return;
    
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

  const isPastDate = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < todayDate;
  };

  const toggleDate = async (day: number) => {
    if (!currentScheduleId) return;
    
    const selectedDate = new Date(currentYear, currentMonth, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < todayDate) return;
    
    try {
      if (selectedDates.includes(day)) {
        // Remove date
        const { error } = await supabase
          .from('irrigation_scheduled_dates')
          .delete()
          .eq('schedule_id', currentScheduleId)
          .eq('day', day)
          .eq('month', currentMonth + 1)
          .eq('year', currentYear);

        if (error) throw error;
        setSelectedDates(selectedDates.filter(d => d !== day));
      } else {
        // Add date
        const scheduledDate = new Date(currentYear, currentMonth, day);
        const { error } = await supabase
          .from('irrigation_scheduled_dates')
          .insert({
            schedule_id: currentScheduleId,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            month: currentMonth + 1,
            year: currentYear,
            day: day
          });

        if (error) throw error;
        setSelectedDates([...selectedDates, day]);
      }
    } catch (error) {
      console.error('Error toggling date:', error);
      Alert.alert('Error', 'Failed to update scheduled date');
    }
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const canSaveSchedule = () => {
    const hasSelectedDates = selectedDates.length > 0;
    const hasEnabledSchedules = schedules.some(schedule => schedule.enabled);
    return hasSelectedDates && hasEnabledSchedules;
  };

  const toggleSchedule = async (id: string) => {
    try {
      const schedule = schedules.find(s => s.id === id);
      if (!schedule) return;

      const { error } = await supabase
        .from('irrigation_time_schedules')
        .update({ enabled: !schedule.enabled })
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ));
    } catch (error) {
      console.error('Error toggling schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('irrigation_time_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSchedules(schedules.filter(s => s.id !== id));
      Alert.alert('Success', 'Schedule deleted');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Alert.alert('Error', 'Failed to delete schedule');
    }
  };

  const addNewSchedule = async () => {
    if (!currentScheduleId || !newScheduleTime.trim()) return;

    try {
      const timeString = `${newScheduleTime.trim()} ${newSchedulePeriod}`;
      
      const { data, error } = await supabase
        .from('irrigation_time_schedules')
        .insert({
          schedule_id: currentScheduleId,
          time: timeString,
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Added new schedule:', data);
      setSchedules([...schedules, data]);
      setNewScheduleTime('08:00');
      setNewSchedulePeriod('AM');
      setSelectedHour('08');
      setSelectedMinute('00');
      setShowTimePicker(false);
      setAddScheduleModalVisible(false);
      Alert.alert('Success', 'Schedule added successfully!');
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add schedule');
    }
  };

  const handleSelectHour = (hour: string) => {
    setSelectedHour(hour);
    setNewScheduleTime(`${hour}:${selectedMinute}`);
  };

  const handleSelectMinute = (minute: string) => {
    setSelectedMinute(minute);
    setNewScheduleTime(`${selectedHour}:${minute}`);
  };

  const handleConfirmTime = () => {
    setNewScheduleTime(`${selectedHour}:${selectedMinute}`);
    setShowTimePicker(false);
  };

  const handleCancelTime = () => {
    setShowTimePicker(false);
    const [hour, minute] = newScheduleTime.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const saveSchedule = async () => {
    if (!canSaveSchedule()) return;
    
    Alert.alert('Success', 'Irrigation schedule saved successfully!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.timeText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={18} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={styles.topBarTitle}>IRRIGATION SCHEDULE</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          <View style={styles.heroCard}>
            <View style={styles.heroStats}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Scheduled days</Text>
                <Text style={styles.statValue}>{selectedDates.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Next watering</Text>
                <Text style={styles.statValue}>
                  {schedules.find(s => s.enabled)?.time || '--'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timeScheduleCard}>
            <View style={styles.timeScheduleHeader}>
              <View style={styles.timeScheduleTitleRow}>
                <Text style={styles.timeScheduleTitle}>Time schedule</Text>
                {schedules.length > 0 && (
                  <TouchableOpacity 
                    style={styles.addTimeButton}
                    onPress={() => setAddScheduleModalVisible(true)}
                  >
                    <FontAwesome name="plus" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.timeScheduleRight}>
              {schedules.length === 0 ? (
                <View style={styles.noSchedulesContainer}>
                  <Text style={styles.noSchedulesText}>No time schedules available</Text>
                  <TouchableOpacity 
                    style={styles.addScheduleButton}
                    onPress={() => setAddScheduleModalVisible(true)}
                  >
                    <FontAwesome name="plus" size={16} color={colors.primary} />
                    <Text style={styles.addScheduleText}>Add Schedule</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {visibleSchedules.map((schedule) => (
                    <View key={schedule.id} style={styles.timeRow}>
                      <Text style={styles.timeText}>{schedule.time}</Text>
                      <View style={styles.timeActions}>
                        <TouchableOpacity 
                          style={styles.timeToggle} 
                          onPress={() => toggleSchedule(schedule.id)}
                        >
                          <FontAwesome
                            name={schedule.enabled ? 'check-circle' : 'circle-o'}
                            size={20}
                            color={schedule.enabled ? colors.primary : colors.grayText}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timeDelete}
                          onPress={() => deleteSchedule(schedule.id)}
                        >
                          <FontAwesome name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  {hasMore && (
                    <TouchableOpacity 
                      style={styles.seeMoreButton}
                      onPress={() => setModalVisible(true)}
                    >
                      <Text style={styles.seeMoreText}>
                        See more ({schedules.length - 2} more)
                      </Text>
                      <FontAwesome name="chevron-down" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          <View style={styles.calendarSection}>
            <View style={styles.monthNav}>
              {canGoPrevMonth() ? (
                <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                  <FontAwesome name="chevron-left" size={16} color={colors.grayText} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.navButton, styles.navButtonDisabled]} />
              )}
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth].toUpperCase()}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <FontAwesome name="chevron-right" size={16} color={colors.grayText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.yearText}>{currentYear}</Text>

            <View style={styles.dayHeaders}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.dayHeader}>
                  {day.charAt(0)}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isSelected = day !== null && selectedDates.includes(day);
                const isTodayDate = day !== null && isToday(day);
                const isPast = day !== null && isPastDate(day);
                
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
                      isPast && styles.pastDay,
                    ]}
                    onPress={() => day && toggleDate(day)}
                    disabled={day === null || isPast}>
                    <Text
                      style={[
                        styles.dayText,
                        day === null && styles.emptyDay,
                        isSelected && styles.selectedDayText,
                        isTodayDate && !isSelected && styles.todayText,
                        isPast && styles.pastDayText,
                      ]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

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

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setAddScheduleModalVisible(true)}
            >
              <FontAwesome name="clock-o" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Add Time</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <FontAwesome name="calendar-check-o" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setSelectedDates([])}
            >
              <FontAwesome name="trash-o" size={18} color="#EF4444" />
              <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Clear</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <FontAwesome name="info-circle" size={16} color={colors.grayText} />
            <Text style={styles.footerText}>
              {selectedDates.length} days scheduled this month
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              !canSaveSchedule() && styles.saveButtonDisabled
            ]}
            disabled={!canSaveSchedule()}
            onPress={saveSchedule}
          >
            <Text style={[
              styles.saveButtonText,
              !canSaveSchedule() && styles.saveButtonTextDisabled
            ]}>Save Schedule</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Time Schedules</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={24} color={colors.dark} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {schedules.map((schedule) => (
                  <View key={schedule.id} style={styles.modalTimeRow}>
                    <Text style={styles.timeText}>{schedule.time}</Text>
                    <View style={styles.timeActions}>
                      <TouchableOpacity 
                        style={styles.timeToggle} 
                        onPress={() => toggleSchedule(schedule.id)}
                      >
                        <FontAwesome
                          name={schedule.enabled ? 'check-circle' : 'circle-o'}
                          size={20}
                          color={schedule.enabled ? colors.primary : colors.grayText}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.timeDelete}
                        onPress={() => deleteSchedule(schedule.id)}
                      >
                        <FontAwesome name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={addScheduleModalVisible}
          onRequestClose={() => setAddScheduleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.addScheduleModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Time Schedule</Text>
                <TouchableOpacity onPress={() => setAddScheduleModalVisible(false)}>
                  <FontAwesome name="times" size={24} color={colors.dark} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.inputLabel}>Time</Text>
                <View style={styles.timeInputRow}>
                  <TouchableOpacity 
                    style={styles.timeSelector}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                  >
                    <Text style={styles.timeSelectorText}>{newScheduleTime}</Text>
                    <FontAwesome name="chevron-down" size={12} color={colors.grayText} />
                  </TouchableOpacity>
                  <View style={styles.periodButtons}>
                    <TouchableOpacity
                      style={[
                        styles.periodButton,
                        newSchedulePeriod === 'AM' && styles.periodButtonActive
                      ]}
                      onPress={() => setNewSchedulePeriod('AM')}
                    >
                      <Text style={[
                        styles.periodButtonText,
                        newSchedulePeriod === 'AM' && styles.periodButtonTextActive
                      ]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.periodButton,
                        newSchedulePeriod === 'PM' && styles.periodButtonActive
                      ]}
                      onPress={() => setNewSchedulePeriod('PM')}
                    >
                      <Text style={[
                        styles.periodButtonText,
                        newSchedulePeriod === 'PM' && styles.periodButtonTextActive
                      ]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {showTimePicker && (
                  <View style={styles.timePickerWrapper}>
                    <View style={styles.timePickerContainer}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                          {hours.map((hour) => (
                            <TouchableOpacity
                              key={hour}
                              style={[
                                styles.timePickerOption,
                                selectedHour === hour && styles.timePickerOptionSelected
                              ]}
                              onPress={() => handleSelectHour(hour)}
                            >
                              <Text style={[
                                styles.timePickerOptionText,
                                selectedHour === hour && styles.timePickerOptionTextSelected
                              ]}>{hour}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                      
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                          {minutes.map((minute) => (
                            <TouchableOpacity
                              key={minute}
                              style={[
                                styles.timePickerOption,
                                selectedMinute === minute && styles.timePickerOptionSelected
                              ]}
                              onPress={() => handleSelectMinute(minute)}
                            >
                              <Text style={[
                                styles.timePickerOptionText,
                                selectedMinute === minute && styles.timePickerOptionTextSelected
                              ]}>{minute}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                    
                    <View style={styles.timePickerActions}>
                      <TouchableOpacity 
                        style={styles.timePickerCancelButton}
                        onPress={handleCancelTime}
                      >
                        <Text style={styles.timePickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.timePickerConfirmButton}
                        onPress={handleConfirmTime}
                      >
                        <Text style={styles.timePickerConfirmText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {!showTimePicker && (
                <View style={styles.addScheduleModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setAddScheduleModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={addNewSchedule}
                  >
                    <Text style={styles.addButtonText}>Save Schedule</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

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
    flexDirection: 'column',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  timeScheduleHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timeScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addTimeButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },
  timeScheduleTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.dark,
    textAlign: 'center',
    lineHeight: 24,
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
  timeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDelete: {
    padding: 4,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    gap: 6,
  },
  seeMoreText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
  },
  noSchedulesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSchedulesText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.grayText,
    marginBottom: 12,
    textAlign: 'center',
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
  },
  addScheduleText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primaryDark,
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
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
  pastDay: {
    backgroundColor: '#F7F7F7',
    opacity: 1,
  },
  pastDayText: {
    color: '#D1D5DB',
    opacity: 1,
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
  saveButtonDisabled: {
    backgroundColor: colors.grayText,
  },
  saveButtonTextDisabled: {
    color: colors.grayLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.dark,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
  addScheduleModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  timeInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.dark,
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeSelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSelectorText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.dark,
  },
  timePickerWrapper: {
    marginTop: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: 12,
  },
  timePickerColumn: {
    flex: 1,
  },
  timePickerLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.grayText,
    marginBottom: 8,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 120,
  },
  timePickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  timePickerOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  timePickerOptionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
  },
  timePickerOptionTextSelected: {
    color: colors.primaryDark,
    fontFamily: fonts.semibold,
  },
  timePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  timePickerCancelText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.grayText,
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  timePickerConfirmText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.grayText,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  addScheduleModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.grayText,
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  addButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
});