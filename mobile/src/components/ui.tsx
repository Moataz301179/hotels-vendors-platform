import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, radius, spacing, typography } from '../theme';

export function rtlRow(rtl: boolean): ViewStyle {
  return { flexDirection: rtl ? 'row-reverse' : 'row' };
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) {
    return <View style={styles.screen}>{children}</View>;
  }
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  rtl,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  rtl: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.headerRow, rtlRow(rtl), { alignItems: 'center' }]}>
        {onBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.headerBack}>
            <Text style={styles.headerBackText}>{rtl ? '›' : '‹'}</Text>
          </Pressable>
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function TaskCard({
  title,
  hint,
  onPress,
  badge,
  rtl,
  disabled,
}: {
  title: string;
  hint: string;
  onPress: () => void;
  badge?: number;
  rtl: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.taskCard, disabled && styles.disabled]}
    >
      <View style={[rtlRow(rtl), { alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }]}>
        <View style={styles.taskCopy}>
          <Text style={styles.taskTitle}>{title}</Text>
          <Text style={styles.taskHint}>{hint}</Text>
        </View>
        {typeof badge === 'number' && badge > 0 ? <Text style={styles.taskBadge}>{badge}</Text> : null}
        <Text style={styles.taskChevron}>{rtl ? '‹' : '›'}</Text>
      </View>
    </Pressable>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' }) {
  const toneStyle =
    tone === 'success' ? styles.pillSuccess : tone === 'danger' ? styles.pillDanger : tone === 'accent' ? styles.pillAccent : styles.pillNeutral;
  return <Text style={[styles.pill, toneStyle]}>{label}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primary, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color={theme.accentInk} /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.secondary, disabled && styles.disabled]}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function StateView({
  kind,
  title,
  message,
  onRetry,
  rtl,
}: {
  kind: 'loading' | 'empty' | 'error' | 'offline' | 'denied' | 'expired' | 'conflict';
  title: string;
  message?: string;
  onRetry?: () => void;
  rtl: boolean;
}) {
  return (
    <View style={styles.state}>
      {kind === 'loading' ? <ActivityIndicator color={theme.accent} /> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateMessage}>{message}</Text> : null}
      {onRetry ? (
        <View style={styles.stateAction}>
          <SecondaryButton label={rtl ? 'إعادة المحاولة' : 'Retry'} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  rtl,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  rtl: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        keyboardType={keyboardType ?? 'default'}
        style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
      />
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.paper },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { backgroundColor: theme.header, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerRow: { gap: spacing.sm },
  headerBack: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { color: theme.onDark, fontSize: 26, lineHeight: 30 },
  headerCopy: { flex: 1 },
  headerTitle: { color: theme.onDark, fontSize: 18, lineHeight: 24 },
  headerSubtitle: { color: theme.onDarkMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  taskCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, padding: spacing.lg, minHeight: 72 },
  taskCopy: { flex: 1, gap: 4 },
  taskTitle: { color: theme.ink, fontSize: 16, lineHeight: 22 },
  taskHint: { color: theme.muted, fontSize: 13, lineHeight: 18 },
  taskBadge: { color: theme.accentInk, backgroundColor: theme.accent, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, overflow: 'hidden' },
  taskChevron: { color: theme.accent, fontSize: 22 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, fontSize: 11, overflow: 'hidden' },
  pillNeutral: { color: theme.ink, backgroundColor: theme.surface },
  pillAccent: { color: theme.accentInk, backgroundColor: theme.accentSoft },
  pillSuccess: { color: theme.success, backgroundColor: theme.successSoft },
  pillDanger: { color: theme.danger, backgroundColor: theme.dangerSoft },
  primary: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryText: { color: theme.accentInk, fontSize: typography.action.fontSize },
  secondary: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: theme.ink, fontSize: typography.action.fontSize },
  disabled: { opacity: 0.5 },
  state: { gap: spacing.md, padding: spacing.xl, alignItems: 'center', backgroundColor: theme.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border },
  stateTitle: { color: theme.ink, fontSize: 16, textAlign: 'center' },
  stateMessage: { color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stateAction: { marginTop: spacing.xs },
  field: { gap: 6 },
  fieldLabel: { color: theme.muted, fontSize: 12 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: theme.ink,
    backgroundColor: theme.card,
    fontSize: 15,
  },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
});
