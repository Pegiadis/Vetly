import { ui } from './mobileTheme';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { petImage, request } from './api';
import { petPayload, petTypes } from './petForm.mjs';

function Action({ label, onPress, disabled, primary }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.action, primary && s.primary, disabled && { opacity: .45 }]}><Text style={{ color: primary ? 'white' : '#121212', fontWeight: '600' }}>{label}</Text></Pressable>;
}
export default function PetEditor({ pet, token, onSaved, onClose }) {
  const [form, setForm] = useState({ name: pet?.name || '', type: pet?.type || 'Dog', breed: pet?.breed || '', age: pet?.age == null ? '' : String(pet.age), weight: pet?.weight == null ? '' : String(pet.weight), gender: pet?.gender || 'Male', chip_number: pet?.chip_number || '' });
  const [photo, setPhoto] = useState(null), [busy, setBusy] = useState(false), [picking, setPicking] = useState(false), [error, setError] = useState(''), [partial, setPartial] = useState(null);
  // Retain the created record after an upload failure: retry updates it instead of creating a duplicate.
  const saved = useRef(pet || null), lock = useRef(false), pickerLock = useRef(false);
  const changed = useRef(false);
  const disabled = busy || picking;
  const setField = (key, value) => { changed.current = true; setForm(old => ({ ...old, [key]: value })); };
  function close() {
    if (lock.current || pickerLock.current) return;
    const finish = () => saved.current && partial ? onSaved(saved.current) : onClose();
    if (!changed.current && !photo) return finish();
    Alert.alert('Κλείσιμο φόρμας;', partial ? 'Τα στοιχεία αποθηκεύτηκαν. Η νέα φωτογραφία δεν έχει ανέβει.' : 'Οι αλλαγές που δεν αποθηκεύτηκαν θα χαθούν.', [{ text: 'Συνέχεια επεξεργασίας', style: 'cancel' }, { text: 'Κλείσιμο', style: 'destructive', onPress: finish }]);
  }
  async function choose(camera) {
    if (pickerLock.current || lock.current) return;
    pickerLock.current = true; setPicking(true); setError('');
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Πρόσβαση στην κάμερα', 'Επίτρεψε την κάμερα από τις ρυθμίσεις για να φωτογραφίσεις το κατοικίδιό σου.', [{ text: 'Άκυρο', style: 'cancel' }, { text: 'Ρυθμίσεις', onPress: () => Linking.openSettings() }]);
          return;
        }
      }
      const options = { mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1600 || asset.height > 1600) context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: .8, base64: true });
      if (!image.base64 || Math.ceil(image.base64.length * .75) > 5 * 1024 * 1024) throw new Error('Η φωτογραφία είναι πολύ μεγάλη. Επίλεξε άλλη φωτογραφία.');
      setPhoto({ uri: image.uri });
    } catch (e) { setError(e.message || 'Δεν ήταν δυνατή η επιλογή φωτογραφίας. Δοκίμασε ξανά.'); }
    finally { pickerLock.current = false; setPicking(false); }
  }
  async function save() {
    if (lock.current || pickerLock.current) return;
    let payload;
    try { payload = petPayload(form, !!saved.current); } catch (e) { setError(e.message); return; }
    lock.current = true; setBusy(true); setError('');
    let record = saved.current;
    let detailsSaved = false;
    try {
      record = await request(record ? `/owner/pets/${record.id}` : '/owner/pets', token, payload, record ? 'PUT' : 'POST');
      saved.current = record; setPartial(record); changed.current = false; detailsSaved = true;
      if (photo) {
        const body = new FormData();
        if (Platform.OS === 'web') body.append('file', await (await fetch(photo.uri)).blob(), 'pet.jpg');
        else body.append('file', { uri: photo.uri, name: 'pet.jpg', type: 'image/jpeg' });
        const uploaded = await request(`/uploads/pet/${record.id}/photo`, token, body);
        record = { ...record, image_url: uploaded.url }; saved.current = record;
      }
      onSaved(record);
    } catch (e) {
      setError(`${detailsSaved && photo ? 'Τα στοιχεία αποθηκεύτηκαν, αλλά η φωτογραφία δεν ανέβηκε. Πάτησε αποθήκευση για νέα προσπάθεια.\n' : ''}${e.message}`);
    } finally { lock.current = false; setBusy(false); }
  }
  const preview = photo?.uri || petImage(saved.current?.image_url);
  return <Modal visible animationType="slide" onRequestClose={close} presentationStyle="fullScreen"><SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><Text style={s.title}>{pet ? 'Επεξεργασία κατοικιδίου' : 'Νέο κατοικίδιο'}</Text><Action label="Κλείσιμο" disabled={disabled} onPress={close}/></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <View style={s.panel}><Text style={s.label}>Φωτογραφία κατοικιδίου</Text>{preview ? <Image accessibilityLabel="Προεπισκόπηση φωτογραφίας κατοικιδίου" source={{ uri: preview }} style={s.photo}/> : <View style={[s.photo, s.empty]}><Text style={s.hint}>Πρόσθεσε τη φωτογραφία του</Text></View>}
        <View style={s.choices}><Action label="Κάμερα" disabled={disabled} onPress={()=>choose(true)}/><Action label="Συλλογή" disabled={disabled} onPress={()=>choose(false)}/></View>
        {picking && <ActivityIndicator accessibilityLabel="Προετοιμασία φωτογραφίας" color="#121212"/>}
        {photo && <Action label="Ακύρωση νέας φωτογραφίας" disabled={disabled} onPress={()=>setPhoto(null)}/>}
        <Text style={s.hint}>Η φωτογραφία ανεβαίνει όταν πατήσεις αποθήκευση.</Text>
      </View>
      <View style={s.panel}>
        {[['name','Όνομα',30,'default'],['breed','Ράτσα',100,'default'],['age','Ηλικία (έτη)',2,'number-pad'],['weight','Βάρος (kg)',10,'decimal-pad'],['chip_number','Microchip (προαιρετικό)',15,'number-pad']].map(([key,label,maxLength,keyboardType])=><View key={key} style={{gap:7}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!disabled} style={s.input} value={form[key]} onChangeText={value=>setField(key,value)} maxLength={maxLength} keyboardType={keyboardType} autoCorrect={keyboardType==='default'}/></View>)}
        {!saved.current ? <><Text style={s.label}>Είδος</Text><View style={s.choices}>{Object.entries(petTypes).map(([value,label])=><Pressable accessibilityRole="button" accessibilityState={{selected:form.type===value}} disabled={disabled} key={value} onPress={()=>setField('type',value)} style={[s.action,form.type===value&&s.selected]}><Text>{label}</Text></Pressable>)}</View><Text style={s.label}>Φύλο</Text><View style={s.choices}>{[['Male','Αρσενικό'],['Female','Θηλυκό']].map(([value,label])=><Pressable accessibilityRole="button" accessibilityState={{selected:form.gender===value}} disabled={disabled} key={value} onPress={()=>setField('gender',value)} style={[s.action,form.gender===value&&s.selected]}><Text>{label}</Text></Pressable>)}</View></> : <Text style={s.hint}>{petTypes[form.type]||form.type} · {form.gender==='Female'?'Θηλυκό':'Αρσενικό'}</Text>}
      </View>
      {!!saved.current && <Text style={s.hint}>Κενά πεδία ηλικίας, βάρους ή microchip διατηρούν τις υπάρχουσες τιμές.</Text>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Action primary disabled={disabled} label={busy?'Αποθήκευση…':'Αποθήκευση κατοικιδίου'} onPress={save}/>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView></Modal>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:ui.background},header:{...ui.header,justifyContent:'space-between'},title:{...ui.title,flex:1,fontSize:21},content:{padding:16,gap:20,width:'100%',maxWidth:680,alignSelf:'center',paddingBottom:40},panel:{...ui.card,gap:18},label:{fontSize:14,fontWeight:'600',color:ui.ink},hint:{fontSize:12,lineHeight:20,color:ui.muted},input:ui.input,photo:{width:'100%',height:240,borderRadius:18,backgroundColor:ui.brandSoft},empty:{justifyContent:'center',alignItems:'center'},choices:{flexDirection:'row',flexWrap:'wrap',gap:8},action:ui.button,primary:{backgroundColor:ui.brand,borderColor:ui.brand},selected:{backgroundColor:ui.accentSoft,borderColor:ui.accentSoft},error:{padding:14,borderRadius:16,backgroundColor:'#fff0ed',color:'#a32929',lineHeight:22}});
