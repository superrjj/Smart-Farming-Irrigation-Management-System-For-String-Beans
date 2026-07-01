import { StyleSheet, Text, View } from "react-native";

type AdvisoryVariant = "report" | "recommendation" | "alert" | "sensor";

type AdvisorySection = {
  variant: AdvisoryVariant;
  title: string;
  body: string;
};

const SECTION_STYLES: Record<
  AdvisoryVariant,
  { bg: string; border: string; title: string; icon: string }
> = {
  report: {
    bg: "#F9FAFB",
    border: "#E5E7EB",
    title: "#374151",
    icon: "🕐",
  },
  recommendation: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    title: "#1D4ED8",
    icon: "📋",
  },
  alert: {
    bg: "#FEF2F2",
    border: "#FECACA",
    title: "#DC2626",
    icon: "⚠️",
  },
  sensor: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    title: "#B45309",
    icon: "⚙️",
  },
};

const HEADER_ALIASES: { variant: AdvisoryVariant; labels: string[] }[] = [
  {
    variant: "report",
    labels: ["ORAS AT ULAT", "TIME AND REPORT", "TIME & REPORT"],
  },
  {
    variant: "recommendation",
    labels: ["REKOMENDASYON", "RECOMMENDATION"],
  },
  {
    variant: "alert",
    labels: ["MGA ALERTO", "ALERTO", "ALERTS", "ALERT"],
  },
  {
    variant: "sensor",
    labels: ["ARDUINO SENSOR", "SENSOR DATA", "SENSOR READINGS"],
  },
];

function normalizeHeader(value: string): string {
  return value
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[^\w\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function resolveVariant(header: string): AdvisoryVariant | null {
  const normalized = normalizeHeader(header);
  for (const entry of HEADER_ALIASES) {
    if (entry.labels.some((label) => normalized.includes(label))) {
      return entry.variant;
    }
  }
  return null;
}

function displayTitle(variant: AdvisoryVariant, rawHeader: string): string {
  const cleaned = rawHeader
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
  if (cleaned) return cleaned;
  switch (variant) {
    case "report":
      return "Time and Report";
    case "recommendation":
      return "Recommendation";
    case "alert":
      return "Alerts";
    default:
      return "Arduino Sensor";
  }
}

export function parseFarmAdvisoryMessage(message: string): AdvisorySection[] | null {
  const text = message.replace(/\r\n/g, "\n").trim();
  if (!text) return null;

  try {
    const json = JSON.parse(text) as {
      sections?: Array<{ type?: string; title?: string; body?: string }>;
    };
    if (Array.isArray(json.sections) && json.sections.length > 0) {
      const parsed = json.sections
        .map((section) => {
          const header = `${section.type ?? ""} ${section.title ?? ""}`.trim();
          const variant =
            resolveVariant(header) ??
            resolveVariant(section.title ?? "") ??
            "report";
          const body = String(section.body ?? "").trim();
          if (!body) return null;
          return {
            variant,
            title: section.title?.trim() || displayTitle(variant, header),
            body,
          };
        })
        .filter(Boolean) as AdvisorySection[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // Plain text / section headers from web advisories
  }

  const headerPattern =
    /(?:^|\n)\s*(?:\d+\.\s*)?(?:ORAS AT ULAT|TIME AND REPORT|REKOMENDASYON|RECOMMENDATION|MGA ALERTO|ALERTS?|ARDUINO SENSOR|SENSOR DATA)\s*:?\s*(?:\n|$)/gi;

  const matches: { index: number; length: number; header: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headerPattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      header: match[0],
    });
  }

  if (matches.length === 0) return null;

  const sections: AdvisorySection[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const variant = resolveVariant(current.header);
    if (!variant) continue;
    const bodyStart = current.index + current.length;
    const bodyEnd = next ? next.index : text.length;
    const body = text.slice(bodyStart, bodyEnd).trim();
    if (!body) continue;
    sections.push({
      variant,
      title: displayTitle(variant, current.header),
      body,
    });
  }

  return sections.length > 0 ? sections : null;
}

/** Accent color for notification list items (matches web advisory slots). */
export function getAdvisoryAccentColor(title: string, message?: string): string {
  const haystack = `${title} ${message ?? ""}`.toUpperCase();
  if (haystack.includes("6:00 AM") || haystack.includes("6:00AM")) {
    return "#059669";
  }
  if (haystack.includes("1:00 PM") || haystack.includes("1:00PM")) {
    return "#EA580C";
  }
  if (haystack.includes("7:00 PM") || haystack.includes("7:00PM")) {
    return "#2563EB";
  }

  const sections = message ? parseFarmAdvisoryMessage(message) : null;
  if (sections?.some((s) => s.variant === "alert")) return "#DC2626";
  if (sections?.some((s) => s.variant === "recommendation")) return "#2563EB";
  if (sections?.some((s) => s.variant === "sensor")) return "#B45309";
  return "#3E9B4F";
}

type FarmAdvisoryMessageProps = {
  message: string;
  plainTextStyle?: object;
};

export function FarmAdvisoryMessage({
  message,
  plainTextStyle,
}: FarmAdvisoryMessageProps) {
  const sections = parseFarmAdvisoryMessage(message);

  if (!sections) {
    return <Text style={[styles.plainText, plainTextStyle]}>{message}</Text>;
  }

  return (
    <View style={styles.stack}>
      {sections.map((section, index) => {
        const palette = SECTION_STYLES[section.variant];
        return (
          <View
            key={`${section.variant}-${index}`}
            style={[
              styles.sectionCard,
              { backgroundColor: palette.bg, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: palette.title }]}>
              {palette.icon} {section.title}
            </Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
  plainText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
