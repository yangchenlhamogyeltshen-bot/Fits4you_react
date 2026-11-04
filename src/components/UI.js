import { View, Text, TextInput, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, radius, shadow } from '../theme';
import { COLORS, hexOf } from '../constants';

export function Txt({ style, muted, bold, size, color, children, ...rest }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[{ color: color || (muted ? colors.muted : colors.text), fontSize: size || 15 }, bold && { fontWeight: 'bold' }, style]}
    >
      {children}
    </Text>
  );
}

export function Screen({ children, style }) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

// White top bar with a bottom border, like the Android header
export function Header({ title, onBack, right, subtitle }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.surface, paddingTop: insets.top, borderBottomWidth: 1, borderBottomColor: colors.border,
        flexDirection: 'row', alignItems: 'center', minHeight: 64 + insets.top, paddingHorizontal: 12,
      }}
    >
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1, paddingLeft: onBack ? 4 : 8 }}>
        <Txt bold size={20} numberOfLines={1}>{title}</Txt>
        {subtitle ? <Txt muted size={12}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({ name, onPress, tint, bg, size = 44 }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg || colors.primaryContainer }}
    >
      <Ionicons name={name} size={size * 0.5} color={tint || colors.primary} />
    </TouchableOpacity>
  );
}

export function TextAction({ title, onPress, color }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
      <Txt bold size={16} color={color || colors.primary}>{title}</Txt>
    </TouchableOpacity>
  );
}

export function Card({ children, style, flat }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.card, borderRadius: radius.card, padding: 16 },
        flat ? { borderWidth: 1, borderColor: colors.border } : shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Pill button (28 radius, 52 high) like the Android buttons
export function Button({ title, onPress, variant = 'solid', icon, style, disabled }) {
  const { colors } = useTheme();
  const map = {
    solid: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    soft: { bg: colors.primaryContainer, fg: colors.primary, border: colors.primaryContainer },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    danger: { bg: 'transparent', fg: colors.error, border: colors.error },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        { height: 52, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          paddingHorizontal: 18, backgroundColor: map.bg, borderWidth: 1, borderColor: map.border, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={map.fg} /> : null}
      <Text style={{ color: map.fg, fontWeight: 'bold', fontSize: 15 }}>{title}</Text>
    </TouchableOpacity>
  );
}

// Selected chip = coral, like chip_selector.xml
export function Chip({ label, active, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, marginRight: 8, marginBottom: 8,
        backgroundColor: active ? colors.secondary : 'transparent', borderWidth: 1, borderColor: active ? colors.secondary : colors.border,
      }}
    >
      <Text style={{ color: active ? colors.onSecondary : colors.muted, fontWeight: active ? 'bold' : 'normal' }}>{String(label)}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ label, tone = 'secondary', style }) {
  const { colors } = useTheme();
  const bg = tone === 'accent' ? colors.accentContainer : tone === 'primary' ? colors.primaryContainer : colors.secondaryContainer;
  const fg = tone === 'secondary' ? colors.onSecondary : colors.primary;
  return (
    <View style={[{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' }, style]}>
      <Text style={{ color: fg, fontSize: 10, fontWeight: 'bold' }}>{label}</Text>
    </View>
  );
}

export function Input({ style, ...props }) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        { height: 56, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text,
          borderRadius: radius.input, paddingHorizontal: 16, fontSize: 16 },
        style,
      ]}
    />
  );
}

export function SearchBar({ value, onChangeText, placeholder }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.card, paddingHorizontal: 16, gap: 8 }}
    >
      <Ionicons name="search" size={20} color={colors.muted} />
      <TextInput
        style={{ flex: 1, color: colors.text, fontSize: 16 }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function Label({ children }) {
  return <Txt bold style={{ marginTop: 14, marginBottom: 8 }}>{children}</Txt>;
}

export function Options({ label, values, value, onChange }) {
  return (
    <View>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {values.map((v) => (
          <Chip key={String(v)} label={v} active={value === v} onPress={() => onChange(v)} />
        ))}
      </View>
    </View>
  );
}

export function Swatches({ value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {COLORS.map((c) => (
        <TouchableOpacity
          key={c.name}
          onPress={() => onChange(c.name)}
          style={{
            width: 42, height: 42, borderRadius: 21, backgroundColor: c.hex, borderWidth: value === c.name ? 3 : 1,
            borderColor: value === c.name ? colors.secondary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export function ColorDot({ name }) {
  const { colors } = useTheme();
  const hex = hexOf(name);
  if (!hex) return null;
  return <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: hex, borderWidth: 1, borderColor: colors.border }} />;
}

export function Photo({ uri, style, iconSize = 36 }) {
  const { colors } = useTheme();
  if (uri) return <Image source={{ uri }} style={[{ backgroundColor: colors.primaryContainer }, style]} resizeMode="cover" />;
  return (
    <View style={[{ backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name="shirt-outline" size={iconSize} color={colors.primary} style={{ opacity: 0.6 }} />
    </View>
  );
}

// Two-column grid card used by Closet, Capsule, Looks picker and Mark Worn
export function ItemCard({ title, subtitle, uri, essential, selected, onPress, onLongPress }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const w = (width - 16 * 2 - 12) / 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        { width: w, backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', marginBottom: 12,
          borderWidth: selected ? 2 : 1, borderColor: selected ? colors.secondary : colors.border },
        shadow,
      ]}
    >
      <View>
        <Photo uri={uri} style={{ width: '100%', height: w * 1.15 }} />
        {essential ? <Badge label="ESSENTIAL" style={{ position: 'absolute', top: 8, left: 8 }} /> : null}
        {selected ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle" size={44} color="#fff" />
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <Txt bold size={14} numberOfLines={1}>{title}</Txt>
        <Txt muted size={12} numberOfLines={1}>{subtitle}</Txt>
      </View>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon = 'shirt-outline', title, text, button, onPress }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Txt bold size={20} style={{ marginTop: 8 }}>{title}</Txt>
      <Txt muted style={{ textAlign: 'center' }}>{text}</Txt>
      {button ? <Button title={button} onPress={onPress} style={{ marginTop: 12 }} /> : null}
    </View>
  );
}