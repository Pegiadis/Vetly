import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { petImage } from './api';
import { ui } from './mobileTheme';

function illustration(pet) {
  if (pet?.type === 'Cat') return require('./assets/pets/bengal.png');
  if (pet?.type === 'Dog') return require('./assets/pets/golden.png');
  if (/hedgehog|σκαντζόχοιρ/i.test(pet?.breed || '')) return require('./assets/pets/hedgehog.png');
  return null;
}

// Generated artwork is a local placeholder, never written into the pet's record.
export default function PetPortrait({ pet, size = 48, cover = false, style }) {
  const uri = (cover && petImage(pet?.cover_image_url)) || petImage(pet?.image_url);
  const [failedUri, setFailedUri] = useState(null);
  useEffect(() => setFailedUri(null), [uri]);
  const custom = uri && uri !== failedUri;
  const source = custom ? { uri } : illustration(pet);
  const dimensions = cover ? { width: '100%', height: 280 } : { width: size, height: size, borderRadius: size / 2 };
  return <View style={[s.frame, dimensions, style]}>
    {source ? <Image source={source} resizeMode="cover" accessibilityLabel={custom ? pet?.name || 'Κατοικίδιο' : `Ενδεικτική εικόνα για ${pet?.name || 'κατοικίδιο'}`} style={[StyleSheet.absoluteFillObject,{width:'100%',height:'100%'}]} onError={() => { if (custom) setFailedUri(uri); }}/>
      : <Ionicons name="paw" size={cover ? 64 : size * .44} color={ui.brand}/>}
    {cover && source && !custom && <Text style={s.caption}>Ενδεικτική εικόνα</Text>}
  </View>;
}
const s = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  caption: { position: 'absolute', bottom: 10, right: 10, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#FFFFFFE8', color: ui.brand, fontSize: 10 },
});

