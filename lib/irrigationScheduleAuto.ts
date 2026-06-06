import {
  getPhilippinesNowClock,
  getPhilippinesTodayYmd,
} from "@/lib/notifications";
import { getLoggedInEmail } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const AUTO_MODE_COLUMN = "auto_mode_enabled";
const DEFAULT_IRRIGATION_BRIDGE_URL =
  "https://arduino-bridge-production.up.railway.app";

export type IrrigationSystemRow = {
  id: number;
  farm_id: number;
  system_name: string;
  pump_status: boolean;
  auto_mode_enabled?: boolean | null;
};

type UserProfileRow = {
  id?: string | number | null;
  user_id?: string | number | null;
  owner_id?: string | number | null;
};

const isMissingAutoModeColumnError = (error: unknown): boolean => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  return message.toLowerCase().includes(AUTO_MODE_COLUMN);
};

const toOwnerIdCandidates = (profile: UserProfileRow): (string | number)[] => {
  const raw = [profile.id, profile.user_id, profile.owner_id];
  const unique = new Set<string | number>();
  raw.forEach((value) => {
    if (value == null) return;
    if (typeof value === "number" && Number.isFinite(value)) {
      unique.add(value);
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) unique.add(trimmed);
    }
  });
  return Array.from(unique);
};

export function parseScheduleTimeToMinutes(timeStr: string): number {
  const trimmed = timeStr.trim();
  if (!trimmed || trimmed === "Not set") return -1;
  try {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1 && /^\d{1,2}:\d{2}$/.test(parts[0])) {
      const [hour, minute] = parts[0].split(":").map(Number);
      return hour * 60 + minute;
    }
    const [time, period] = parts;
    const [hour, minute] = time.split(":").map(Number);
    let total = hour * 60 + minute;
    const p = (period ?? "").toUpperCase();
    if (p === "PM" && hour !== 12) total += 12 * 60;
    else if (p === "AM" && hour === 12) total -= 12 * 60;
    else if (p === "NN" || p === "NOON") {
      if (hour !== 12) total = 12 * 60 + minute;
    }
    return total;
  } catch {
    return -1;
  }
}

export async function syncIrrigationStateToBridge({
  systemId,
  autoModeEnabled,
  pumpStatus,
}: {
  systemId: number;
  autoModeEnabled: boolean;
  pumpStatus: boolean;
}): Promise<boolean> {
  const configuredBridgeUrl =
    process.env.EXPO_PUBLIC_ARDUINO_BRIDGE_URL?.trim() || "";
  const candidateBaseUrls = [
    configuredBridgeUrl || DEFAULT_IRRIGATION_BRIDGE_URL,
  ].filter((url, idx, arr): url is string => {
    const normalized = url.trim();
    if (!normalized) return false;
    return arr.findIndex((item) => item.trim() === normalized) === idx;
  });

  const payload = {
    system_id: systemId,
    auto_mode_enabled: autoModeEnabled,
    pump_status: pumpStatus,
  };

  for (const baseUrl of candidateBaseUrls) {
    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/irrigation-state`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text().catch(() => "");
      if (!response.ok) continue;

      let parsed: {
        auto_mode_enabled?: unknown;
        pump_status?: unknown;
      } | null = null;
      try {
        parsed = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsed = null;
      }

      const hasExpectedShape =
        !!parsed &&
        typeof parsed.auto_mode_enabled === "boolean" &&
        typeof parsed.pump_status === "boolean";
      if (hasExpectedShape) return true;
    } catch {
      // try next endpoint
    }
  }
  return false;
}

export type ResolveIrrigationSystemResult = {
  system: IrrigationSystemRow | null;
  supportsAutoMode: boolean;
  failureReason?: string;
};

const MAIN_SYSTEM_NAME = "Main Irrigation System";

async function loadUserProfile(
  email?: string | null,
  userId?: string | null,
): Promise<UserProfileRow | null> {
  // Only select columns that exist on user_profiles (same as sensorDevice / waterDistribution).
  const profileSelect = "id, email";

  const normalizedUserId =
    userId == null ? "" : String(userId).trim();
  if (normalizedUserId) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(profileSelect)
      .eq("id", normalizedUserId)
      .maybeSingle();
    if (!error && data?.id) return data as UserProfileRow;
    if (error) {
      console.warn("[irrigationScheduleAuto] profile by id failed:", error.message);
    }
  }

  let effectiveEmail = (email ?? "").trim();
  if (!effectiveEmail) {
    effectiveEmail = (await getLoggedInEmail())?.trim() ?? "";
  }
  if (!effectiveEmail) return null;

  const { data: exactMatch, error: exactError } = await supabase
    .from("user_profiles")
    .select(profileSelect)
    .eq("email", effectiveEmail)
    .maybeSingle();
  if (!exactError && exactMatch?.id) return exactMatch as UserProfileRow;
  if (exactError) {
    console.warn(
      "[irrigationScheduleAuto] profile by email failed:",
      exactError.message,
    );
  }

  const { data: looseMatch, error: looseError } = await supabase
    .from("user_profiles")
    .select(profileSelect)
    .ilike("email", effectiveEmail)
    .maybeSingle();
  if (!looseError && looseMatch?.id) return looseMatch as UserProfileRow;
  if (looseError) {
    console.warn(
      "[irrigationScheduleAuto] profile by ilike email failed:",
      looseError.message,
    );
  }

  return null;
}

async function loadFarmForProfile(
  profile: UserProfileRow,
): Promise<{ id: number | string } | null> {
  const ownerCandidates = toOwnerIdCandidates(profile);
  for (const ownerCandidate of ownerCandidates) {
    const { data: farmData, error: farmError } = await supabase
      .from("farm")
      .select("id")
      .eq("owner_id", ownerCandidate)
      .maybeSingle();
    if (farmError?.code === "22P02") continue;
    if (farmError) throw farmError;
    if (farmData?.id) return farmData;
  }

  for (const ownerCandidate of ownerCandidates) {
    const { data: farms, error: farmsError } = await supabase
      .from("farm")
      .select("id")
      .eq("owner_id", ownerCandidate)
      .limit(1);
    if (farmsError?.code === "22P02") continue;
    if (farmsError) throw farmsError;
    if (farms?.[0]?.id) return farms[0];
  }

  return null;
}

async function loadOrCreateSystemForFarm(
  farmId: number | string,
): Promise<ResolveIrrigationSystemResult> {
  const { data: namedSystem, error: namedError } = await supabase
    .from("irrigation_system")
    .select("id, farm_id, system_name, pump_status, auto_mode_enabled")
    .eq("farm_id", farmId)
    .eq("system_name", MAIN_SYSTEM_NAME)
    .maybeSingle();

  if (namedError && !isMissingAutoModeColumnError(namedError)) {
    throw namedError;
  }

  if (namedError && isMissingAutoModeColumnError(namedError)) {
    const { data: namedNoAuto, error: namedNoAutoError } = await supabase
      .from("irrigation_system")
      .select("id, farm_id, system_name, pump_status")
      .eq("farm_id", farmId)
      .eq("system_name", MAIN_SYSTEM_NAME)
      .maybeSingle();
    if (namedNoAutoError) throw namedNoAutoError;
    if (namedNoAuto) {
      return {
        system: namedNoAuto as IrrigationSystemRow,
        supportsAutoMode: false,
      };
    }
  } else if (namedSystem) {
    return {
      system: namedSystem as IrrigationSystemRow,
      supportsAutoMode: true,
    };
  }

  const { data: anySystem, error: anyError } = await supabase
    .from("irrigation_system")
    .select("id, farm_id, system_name, pump_status, auto_mode_enabled")
    .eq("farm_id", farmId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (anyError && !isMissingAutoModeColumnError(anyError)) {
    throw anyError;
  }

  if (anyError && isMissingAutoModeColumnError(anyError)) {
    const { data: anyNoAuto, error: anyNoAutoError } = await supabase
      .from("irrigation_system")
      .select("id, farm_id, system_name, pump_status")
      .eq("farm_id", farmId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (anyNoAutoError) throw anyNoAutoError;
    if (anyNoAuto) {
      return {
        system: anyNoAuto as IrrigationSystemRow,
        supportsAutoMode: false,
      };
    }
  } else if (anySystem) {
    return {
      system: anySystem as IrrigationSystemRow,
      supportsAutoMode: true,
    };
  }

  const { data: createdSystem, error: createError } = await supabase
    .from("irrigation_system")
    .insert({
      farm_id: farmId,
      system_name: MAIN_SYSTEM_NAME,
      hardware_model: null,
      water_source_details: null,
      pump_status: false,
      auto_mode_enabled: false,
    })
    .select("id, farm_id, system_name, pump_status, auto_mode_enabled")
    .single();

  if (createError && isMissingAutoModeColumnError(createError)) {
    const { data: createdNoAuto, error: createdNoAutoError } = await supabase
      .from("irrigation_system")
      .insert({
        farm_id: farmId,
        system_name: MAIN_SYSTEM_NAME,
        hardware_model: null,
        water_source_details: null,
        pump_status: false,
      })
      .select("id, farm_id, system_name, pump_status")
      .single();
    if (createdNoAutoError) {
      return {
        system: null,
        supportsAutoMode: false,
        failureReason: `Could not create irrigation system: ${createdNoAutoError.message}`,
      };
    }
    return {
      system: createdNoAuto as IrrigationSystemRow,
      supportsAutoMode: false,
    };
  }

  if (createError) {
    return {
      system: null,
      supportsAutoMode: true,
      failureReason: `Could not create irrigation system: ${createError.message}`,
    };
  }

  return {
    system: createdSystem as IrrigationSystemRow,
    supportsAutoMode: true,
  };
}

export async function resolveIrrigationSystem(options: {
  email?: string | null;
  userId?: string | null;
}): Promise<ResolveIrrigationSystemResult> {
  try {
    const profile = await loadUserProfile(options.email, options.userId);
    if (!profile) {
      return {
        system: null,
        supportsAutoMode: true,
        failureReason: "User profile not found",
      };
    }

    const farm = await loadFarmForProfile(profile);
    if (!farm?.id) {
      return {
        system: null,
        supportsAutoMode: true,
        failureReason: "Farm not found — complete your farm profile first",
      };
    }

    return loadOrCreateSystemForFarm(farm.id);
  } catch (error) {
    console.error(
      "[irrigationScheduleAuto] Failed to resolve irrigation system:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "Unknown error resolving system";
    return { system: null, supportsAutoMode: true, failureReason: message };
  }
}

export async function resolveIrrigationSystemForEmail(
  email: string,
): Promise<ResolveIrrigationSystemResult> {
  return resolveIrrigationSystem({ email });
}

export async function fetchIrrigationSystemById(
  systemId: number,
): Promise<IrrigationSystemRow | null> {
  const { data, error } = await supabase
    .from("irrigation_system")
    .select("id, farm_id, system_name, pump_status, auto_mode_enabled")
    .eq("id", systemId)
    .maybeSingle();
  if (error) {
    if (isMissingAutoModeColumnError(error)) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("irrigation_system")
        .select("id, farm_id, system_name, pump_status")
        .eq("id", systemId)
        .maybeSingle();
      if (fallbackError) throw fallbackError;
      return (fallback as IrrigationSystemRow | null) ?? null;
    }
    throw error;
  }
  return (data as IrrigationSystemRow | null) ?? null;
}

let autoModeBusy = false;

export async function setIrrigationAutoMode({
  systemId,
  on,
  userId,
  scheduleId,
  forcePumpStop = false,
}: {
  systemId: number;
  on: boolean;
  userId?: string | null;
  scheduleId?: string | null;
  /** When entering manual (e.g. after saving a schedule), always stop the pump. */
  forcePumpStop?: boolean;
}): Promise<boolean> {
  if (autoModeBusy) {
    return false;
  }

  autoModeBusy = true;
  try {
    const system = await fetchIrrigationSystemById(systemId);
    if (!system) {
      return false;
    }

    const wasPumpRunning = Boolean(system.pump_status);
    const shouldStopPump = forcePumpStop || (!on && wasPumpRunning);
    const nextPumpStatus = on ? false : shouldStopPump ? false : system.pump_status;

    const { error: systemError } = await supabase
      .from("irrigation_system")
      .update({
        pump_status: nextPumpStatus,
        auto_mode_enabled: on,
      })
      .eq("id", system.id);

    if (systemError) {
      if (isMissingAutoModeColumnError(systemError)) {
        return false;
      }
      throw systemError;
    }

    const nowIso = new Date().toISOString();
    const { error: logError } = await supabase.from("irrigation_log").insert({
      system_id: system.id,
      triggered_by_user_id: userId ?? null,
      trigger_type: "Automated",
      status: shouldStopPump ? "completed" : "idle",
      command: on ? "auto_mode_on" : "auto_mode_off",
      start_time: nowIso,
      end_time: shouldStopPump ? nowIso : null,
      duration_seconds: shouldStopPump ? 0 : null,
      schedule_id: scheduleId ?? null,
    });
    if (logError) {
      console.warn(
        "[irrigationScheduleAuto] irrigation_log insert failed:",
        logError.message,
      );
    }

    await syncIrrigationStateToBridge({
      systemId: system.id,
      autoModeEnabled: on,
      pumpStatus: Boolean(nextPumpStatus),
    });

    return true;
  } catch (error) {
    console.error("[irrigationScheduleAuto] Failed to set irrigation mode:", error);
    return false;
  } finally {
    autoModeBusy = false;
  }
}

/** After the user saves a schedule: force MANUAL (from AUTOMATIC if needed). */
export async function ensureManualModeForEmail(
  email: string,
  userId?: string | null,
  scheduleId?: string | null,
): Promise<boolean> {
  const { system, supportsAutoMode } = await resolveIrrigationSystem({
    email,
    userId,
  });
  if (!system?.id || !supportsAutoMode) {
    return false;
  }
  const ok = await setIrrigationAutoMode({
    systemId: system.id,
    on: false,
    userId,
    scheduleId,
    forcePumpStop: true,
  });
  return ok;
}

/** When a scheduled date/time is reached: force AUTOMATIC and leave it on. */
export async function startScheduledIrrigationAutoForEmail(
  email: string,
  userId?: string | null,
  scheduleId?: string | null,
): Promise<boolean> {
  const { system, supportsAutoMode } = await resolveIrrigationSystem({
    email,
    userId,
  });
  if (!system?.id || !supportsAutoMode) {
    return false;
  }
  const ok = await setIrrigationAutoMode({
    systemId: system.id,
    on: true,
    userId,
    scheduleId,
  });
  return ok;
}

const firedScheduleSlots = new Set<string>();

let cachedTodaySlots: Array<{
  year: number;
  month: number;
  day: number;
  time: string;
}> = [];
let cachedTodaySlotsUserId: string | null = null;
let cachedTodaySlotsDayKey = "";
let cachedTodaySlotsFetchedAt = 0;
const TODAY_SLOTS_CACHE_MS = 30_000;

export function invalidateTodayScheduleSlotsCache(): void {
  cachedTodaySlots = [];
  cachedTodaySlotsUserId = null;
  cachedTodaySlotsDayKey = "";
  cachedTodaySlotsFetchedAt = 0;
}

async function getTodayScheduleSlotsCached(
  userId: string,
): Promise<Array<{ year: number; month: number; day: number; time: string }>> {
  const phToday = getPhilippinesTodayYmd();
  const dayKey = `${phToday.year}-${phToday.month}-${phToday.day}`;
  const now = Date.now();
  const cacheValid =
    cachedTodaySlotsUserId === userId &&
    cachedTodaySlotsDayKey === dayKey &&
    now - cachedTodaySlotsFetchedAt < TODAY_SLOTS_CACHE_MS;

  if (cacheValid) return cachedTodaySlots;

  cachedTodaySlots = await fetchTodayScheduleSlotsForUser(userId);
  cachedTodaySlotsUserId = userId;
  cachedTodaySlotsDayKey = dayKey;
  cachedTodaySlotsFetchedAt = now;
  return cachedTodaySlots;
}

export async function fetchTodayScheduleSlotsForUser(
  userId: string,
): Promise<Array<{ year: number; month: number; day: number; time: string }>> {
  const normalizedUserId = String(userId).trim();
  const { data: schedules, error: schedulesError } = await supabase
    .from("irrigation_schedules")
    .select("id")
    .eq("user_id", normalizedUserId)
    .eq("is_active", true);
  if (schedulesError || !schedules?.length) return [];

  const scheduleIds = schedules.map((s) => s.id);
  const phToday = getPhilippinesTodayYmd();
  const { data, error } = await supabase
    .from("irrigation_scheduled_dates")
    .select("day, month, year, time")
    .in("schedule_id", scheduleIds)
    .eq("year", phToday.year)
    .eq("month", phToday.month)
    .eq("day", phToday.day);
  if (error || !data?.length) return [];

  return data
    .filter((row) => row.time && row.time !== "Not set")
    .map((row) => ({
      year: row.year,
      month: row.month,
      day: row.day,
      time: row.time as string,
    }));
}

export async function maybeFireScheduledIrrigationAuto(
  email: string,
  userId?: string | null,
): Promise<boolean> {
  if (!email || !userId) return false;

  const phNow = getPhilippinesNowClock();
  const slots = await getTodayScheduleSlotsCached(userId);

  for (const slot of slots) {
    if (
      slot.year !== phNow.year ||
      slot.month !== phNow.month ||
      slot.day !== phNow.day
    ) {
      continue;
    }
    const slotMinutes = parseScheduleTimeToMinutes(slot.time);
    if (slotMinutes < 0 || slotMinutes !== phNow.minutesSinceMidnight) continue;

    const slotKey = `${slot.year}-${slot.month}-${slot.day}|${slotMinutes}`;
    if (firedScheduleSlots.has(slotKey)) continue;
    firedScheduleSlots.add(slotKey);

    return startScheduledIrrigationAutoForEmail(email, userId);
  }

  return false;
}

/** Clear fired-slot memory at midnight Philippines time. */
export function pruneFiredScheduleSlots(): void {
  const phToday = getPhilippinesTodayYmd();
  const prefix = `${phToday.year}-${phToday.month}-${phToday.day}|`;
  for (const key of firedScheduleSlots) {
    if (!key.startsWith(prefix)) firedScheduleSlots.delete(key);
  }
}
