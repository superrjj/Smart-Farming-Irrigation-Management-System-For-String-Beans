import { registerToastListener, ToastPayload } from "@/lib/toast";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOAST_DURATION_MS = 3200;

const variantStyles = {
  success: { backgroundColor: "#16A34A", borderColor: "#15803D" },
  error: { backgroundColor: "#DC2626", borderColor: "#B91C1C" },
  info: { backgroundColor: "#0F172A", borderColor: "#334155" },
} as const;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unregister = registerToastListener((payload) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setToast(payload);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      hideTimerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setToast(null);
        });
      }, TOAST_DURATION_MS);
    });
    return () => {
      unregister();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [opacity]);

  if (!toast) return null;

  const variant = toast.variant ?? "info";
  const colors = variantStyles[variant];

  return (
    <View style={[styles.host, { bottom: insets.bottom + 16 }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor, opacity },
        ]}
      >
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
