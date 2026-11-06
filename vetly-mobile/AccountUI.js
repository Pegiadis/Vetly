import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ui } from './mobileTheme';

export function Field({ label, ...props }) {
  return <View style={{ gap: 7 }}><Text style={a.label}>{label}</Text><TextInput accessibilityLabel={label} style={ui.input} {...props}/></View>;
}
export function AccountButton({ title, onPress, disabled, secondary, danger }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[ui.button, { backgroundColor: secondary ? 'white' : danger ? '#a32929' : ui.brand, borderColor: secondary ? ui.line : 'transparent' }, disabled && { opacity: .5 }]}><Text style={{ color: secondary ? ui.brand : 'white', fontWeight: '700', textAlign: 'center', fontSize: 14 }}>{title}</Text></Pressable>;
}
export function Notice({ text, error }) {
  return text ? <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[a.notice, error && { backgroundColor: '#fff0ed', color: '#a32929' }]}>{text}</Text> : null;
}
export const a = StyleSheet.create({
  title: { ...ui.title, fontSize: 26 }, label: { fontSize: 13, fontWeight: '600', color: ui.ink },
  body: { fontSize: 14, lineHeight: 22, color: ui.muted },
  notice: { padding: 16, borderRadius: 16, backgroundColor: ui.brandSoft, color: ui.brand, lineHeight: 22 },
  card: { ...ui.card, gap: 18 },
});
