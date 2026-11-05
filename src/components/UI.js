import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Switch, useWindowDimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, radius, shadow, fonts, fixed } from '../theme';
import { COLORS, hexOf } from '../constants';
import { useNavigation, useRoute } from '@react-navigation/native';

// Text. Pass `heading` for the Fraunces title font (it replaces bold, since the font is already heavy)
export function Txt({ style, muted, bold, heading, size, color, children, ...rest }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        { color: color || (muted ? colors.muted : colors.text), fontSize: size || 15 },
        heading ? { fontFamily: fonts.heading } : bold && { fontWeight: 'bold' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({ children, style }) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

// True when a "Settings" screen can be reached from here (so not on Welcome, Login or Sign Up)
function hasSettingsRoute(navigation) {
  let n = navigation;
  while (n) {
    const state = n.getState ? n.getState() : null;
    if (state && state.routeNames && state.routeNames.includes('Settings')) return true;
    n = n.getParent ? n.getParent() : undefined;
  }
  return false;
}

// One header for every screen: big bold title with a coral bar underneath.
// With onBack, the arrow (and the right-hand actions) sit on a row above the title.
// The settings gear is added automatically; pass settings={false} to hide it on one screen.
export function Header({ title, onBack, right, subtitle, logo, settings = true }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const showGear = settings && route.name !== 'Settings' && hasSettingsRoute(navigation);

  const actions = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {right}
      {showGear ? <IconButton name="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} /> : null}
    </View>
  );

  return (
    <View
      style={{
        paddingTop: insets.top + (onBack ? 4 : 14), paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: colors.bg,
      }}
    >
      {onBack ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          {actions}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {logo ? <Image source={logo} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 12 }} /> : null}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ color: colors.text, fontSize: 34, fontFamily: fonts.heading, letterSpacing: -1 }}
          >
            {title}
          </Text>
          {subtitle ? <Txt muted size={14} style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
          <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: colors.secondary, marginTop: 10 }} />
        </View>
        {onBack ? null : actions}
      </View>
    </View>
  );
}

// Kept so Collections and Looks still work; it is now the same as Header
export function PageTitle(props) {
  return <Header {...props} />;
}

// Round icon-only button. `label` is read aloud by screen readers (defaults to the icon name).
export function IconButton({ name, onPress, tint, bg, size = 44, label }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label || name}
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

// Pill-shaped switch between a few options, e.g. Modern | Traditional.
// options: array of strings. onChange gets the tapped option.
export function SegmentedControl({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: colors.primaryContainer, borderRadius: 24, padding: 4 }}
    >
      {options.map((o) => {
        const active = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: active ? colors.primary : 'transparent' }}
          >
            <Txt bold color={active ? colors.onPrimary : colors.primary}>{o}</Txt>
          </TouchableOpacity>
        );
      })}
    </View>
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

export function Badge({ label, tone = 'secondary', style, textColor }) {
  const { colors } = useTheme();
  const bg = tone === 'accent' ? colors.accentContainer : tone === 'primary' ? colors.primaryContainer : colors.secondaryContainer;
  const fg = tone === 'secondary' ? colors.onSecondary : tone === 'accent' ? colors.accentText : colors.primary;
  return (
    <View style={[{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' }, style]}>
      <Text style={{ color: textColor || fg, fontSize: 10, fontWeight: 'bold' }}>{label}</Text>
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

// Warmth 1-5 for clothes. Shoes and accessories use Season only, so nothing is shown for them.
export function WarmthPicker({ category, value, onChange }) {
  if (category === 'Shoes' || category === 'Accessories') return null;
  return (
    <Options label="Warmth (1 = very light, 5 = very warm)" values={[1, 2, 3, 4, 5]} value={value} onChange={onChange} />
  );
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return ('#' + to(f(0)) + to(f(8)) + to(f(4))).toUpperCase();
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// Quick swatches plus a custom colour picker (any colour, stored as a hex value)
export function Swatches({ value, onChange }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = hexOf(value) || '#808080';
  const [h, s, l] = hexToHsl(current);
  const isCustom = !!value && !COLORS.some((c) => c.name === value);

  const set = (nh, ns, nl) => onChange(hslToHex(nh, ns, nl));

  const row = (label, max, val, onSlide) => (
    <View style={{ marginTop: 6 }}>
      <Txt muted size={12}>{label}</Txt>
      <Slider
        minimumValue={0}
        maximumValue={max}
        step={1}
        value={val}
        onValueChange={onSlide}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={current}
      />
    </View>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c.name}
            onPress={() => onChange(c.name)}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${c.name}`}
            accessibilityState={{ selected: value === c.name }}
            style={{
              width: 42, height: 42, borderRadius: 21, backgroundColor: c.hex,
              borderWidth: value === c.name ? 3 : 1,
              borderColor: value === c.name ? colors.secondary : colors.border,
            }}
          />
        ))}
        <TouchableOpacity
          onPress={() => setOpen(!open)}
          accessibilityRole="button"
          accessibilityLabel="Custom colour"
          accessibilityState={{ expanded: open }}
          style={{
            width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
            backgroundColor: isCustom ? current : colors.primaryContainer,
            borderWidth: isCustom ? 3 : 1, borderColor: isCustom ? colors.secondary : colors.border,
          }}
        >
          <Ionicons name="color-palette" size={20} color={isCustom ? fixed.white : colors.primary} />
        </TouchableOpacity>
      </View>

      {open && (
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: current, borderWidth: 1, borderColor: colors.border }} />
            <Txt bold>Custom colour · {current}</Txt>
          </View>
          {row('Shade', 360, h, (v) => set(v, s || 60, l || 50))}
          {row('Intensity', 100, s, (v) => set(h, v, l))}
          {row('Brightness', 100, l, (v) => set(h, s, v))}
        </View>
      )}
    </View>
  );
}

export function SwitchRow({ label, hint, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Txt bold>{label}</Txt>
        {hint ? <Txt muted size={12}>{hint}</Txt> : null}
      </View>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.secondary }}
        thumbColor={fixed.white}
      />
    </View>
  );
}

export function ColorDot({ name }) {
  const { colors } = useTheme();
  const hex = hexOf(name);
  if (!hex) return null;
  return <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: hex, borderWidth: 1, borderColor: colors.border }} />;
}

export function Photo({ uri, style, iconSize = 36, fit = 'cover' }) {
  const { colors } = useTheme();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ backgroundColor: fit === 'contain' ? fixed.white : colors.primaryContainer }, style]}
        resizeMode={fit}
      />
    );
  }
  return (
    <View style={[{ backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name="shirt-outline" size={iconSize} color={colors.primary} style={{ opacity: 0.6 }} />
    </View>
  );
}

// Two-column grid card used by Closet, Capsule, Looks picker and Mark Worn
export function ItemCard({ title, subtitle, uri, essential, badge, selected, onPress, onLongPress }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const w = (width - 16 * 2 - 12) / 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        { width: w, backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', marginBottom: 14,
          borderWidth: selected ? 2 : 1, borderColor: selected ? colors.secondary : colors.border },
        shadow,
      ]}
    >
      <View>
        <Photo uri={uri} fit="contain" style={{ width: '100%', height: w * 1.4 }} iconSize={48} />
        <View style={{ position: 'absolute', top: 10, left: 10 }}>
          {badge ? (
            <Badge label={badge} tone="accent" />
          ) : essential ? (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
              }}
            >
              <Ionicons name="star" size={11} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: 'bold' }}>Essential</Text>
            </View>
          ) : null}
        </View>
        {selected ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle" size={44} color={fixed.white} />
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12 }}>
        <Txt bold size={15} numberOfLines={1}>{title}</Txt>
        <Txt muted size={12} numberOfLines={1}>{subtitle}</Txt>
      </View>
    </TouchableOpacity>
  );
}

// A saved Look: all pieces shown whole (never cropped), the name large underneath.
// `label` is the small pill text (e.g. "3 MODERN PIECES"); `children` are action buttons shown below.
export function LookCard({ look, label, onPress, onLongPress, children }) {
  const { colors } = useTheme();
  const items = look.items || [];
  const shown = items.slice(0, 4);
  const pill = label || `${items.length} ${items.length === 1 ? 'PIECE' : 'PIECES'}`;
  return (
    <TouchableOpacity
      activeOpacity={onPress || onLongPress ? 0.85 : 1}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`Look ${look.name}`}
      style={[
        { backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden', marginTop: 16,
          borderWidth: 1, borderColor: colors.border },
        shadow,
      ]}
    >
      <View style={{ flexDirection: 'row', height: 200, backgroundColor: fixed.white }}>
        {shown.length === 0 ? (
          <Photo style={{ flex: 1, height: '100%' }} iconSize={44} />
        ) : (
          shown.map((it) => (
            <Photo
              key={`${it.type}-${it.id}`}
              uri={it.image_uri}
              fit="contain"
              style={{ flex: 1, height: '100%' }}
              iconSize={28}
            />
          ))
        )}
      </View>
      <View style={{ padding: 16 }}>
        <Txt heading size={24} numberOfLines={1} style={{ letterSpacing: -0.5 }}>{look.name}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Badge label={pill} tone="primary" style={{ backgroundColor: colors.primary }} textColor={colors.onPrimary} />
          <Txt muted size={12} numberOfLines={1} style={{ flex: 1 }}>
            {items.map((i) => i.name).join(' · ')}
          </Txt>
        </View>
        {children}
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
      <Txt heading size={20} style={{ marginTop: 8 }}>{title}</Txt>
      <Txt muted style={{ textAlign: 'center' }}>{text}</Txt>
      {button ? <Button title={button} onPress={onPress} style={{ marginTop: 12 }} /> : null}
    </View>
  );
}