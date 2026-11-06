import VetMap from './VetMap';
import useVetLocation from './useVetLocation';
import {nearbyVets,distanceLabel} from './vetGeography.mjs';
import { ui } from './mobileTheme';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { request, petImage } from './api';
import { directionsUrl, filterOnCallVets, phoneUrl } from './onCallLinks.mjs';

function Button({label,icon,primary,disabled,onPress,accessibilityLabel}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel||label} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={[s.button,primary&&s.primary,disabled&&{opacity:.4}]}>{icon&&<Ionicons name={icon} size={18} color={primary?'white':'#121212'}/>}<Text style={[s.buttonText,primary&&{color:'white'}]}>{label}</Text></Pressable>;
}
function Avatar({vet}) {
  const [failed,setFailed]=useState(false);
  const uri=petImage(vet.image_url);
  useEffect(()=>setFailed(false),[uri]);
  return uri&&!failed ? <Image accessibilityLabel={vet.name} source={{uri}} style={s.avatar} onError={()=>setFailed(true)}/> : <View style={[s.avatar,s.placeholder]}><Ionicons name="medical-outline" size={26} color="#121212"/></View>;
}
const weekdays={monday:'Δευτέρα',tuesday:'Τρίτη',wednesday:'Τετάρτη',thursday:'Πέμπτη',friday:'Παρασκευή',saturday:'Σάββατο',sunday:'Κυριακή'};
function hoursText(hours) {
  if (!hours) return 'Δεν έχει καταχωριστεί';
  if (hours.closed) return 'Κλειστά';
  const shifts=[hours.morning,hours.afternoon].filter(shift=>shift?.open&&shift?.close).map(shift=>`${shift.open}–${shift.close}`);
  return shifts.join(' / ') || (hours.open&&hours.close ? `${hours.open}–${hours.close}` : 'Δεν έχει καταχωριστεί');
}
export default function VetDirectory({token,onClose,onBook,onCall=false}) {
  const [vets,setVets]=useState([]),[search,setSearch]=useState(''),[city,setCity]=useState(''),[specialty,setSpecialty]=useState(''),[selectedId,setSelectedId]=useState(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[updated,setUpdated]=useState(null),[opening,setOpening]=useState(false);
  const [mapVisible,setMapVisible]=useState(true),[radius,setRadius]=useState(null),[serviceState,setServiceState]=useState({}),[checking,setChecking]=useState(null);
  const {location,locating,locationError,locate,clearLocation}=useVetLocation();
  const serviceRequests=useRef(new Map()),bookingLock=useRef(false);
  const alive=useRef(false),fetching=useRef(false),openingRef=useRef(false);
  async function load() {
    if (fetching.current) return;
    fetching.current=true;setLoading(true);
    try {
      let items=[];
      if(onCall) {
        const result=await request('/vets/on-call',token);
        items=result.items.filter(v=>v.is_on_call===true);
      } else {
        let page=1,result;
        do {
          result=await request(`/vets?page=${page}&page_size=100`,token);
          items.push(...result.items);page++;
        } while(alive.current&&items.length<result.total&&result.items.length);
      }
      if(!alive.current)return;
      serviceRequests.current.clear();setServiceState({});setVets(items);setUpdated(new Date());setError('');
    }catch(e){if(alive.current){setError(e.message);setVets([]);}}
    finally{fetching.current=false;if(alive.current)setLoading(false);}
  }
  useEffect(()=>{
    alive.current=true;load();
    const timer=onCall?setInterval(()=>{if(AppState.currentState==='active')load();},30000):null;
    const sub=AppState.addEventListener('change',state=>{if(state==='active')load();});
    return()=>{alive.current=false;clearInterval(timer);sub.remove();};
  },[token,onCall]);
  const filtered=nearbyVets(filterOnCallVets(vets,search,city).filter(v=>!specialty||v.specialty===specialty),location,radius);
  const mapped=filtered.filter(v=>v.point);
  async function servicesFor(vet) {
    if(!serviceRequests.current.has(vet.id)) {
      setServiceState(old=>({...old,[vet.id]:{loading:true}}));
      const promise=request(`/public/vets/${vet.id}/services`,token).then(result=>{
        if(alive.current)setServiceState(old=>({...old,[vet.id]:{items:result.items}}));
        return result.items;
      }).catch(e=>{serviceRequests.current.delete(vet.id);if(alive.current)setServiceState(old=>({...old,[vet.id]:{error:e.message}}));return null;});
      serviceRequests.current.set(vet.id,promise);
    }
    return serviceRequests.current.get(vet.id);
  }
  useEffect(()=>{const vet=vets.find(v=>v.id===selectedId);if(vet&&!onCall)servicesFor(vet);},[selectedId,onCall,updated]);
  async function book(vet) {
    if(bookingLock.current)return;
    bookingLock.current=true;setChecking(vet.id);
    try {const services=await servicesFor(vet);if(!alive.current)return;if(services?.length)onBook(vet);else setSelectedId(vet.id);}
    finally {bookingLock.current=false;if(alive.current)setChecking(null);}
  }
  function bookingAction(vet) {
    const state=serviceState[vet.id];
    return <>{state?.items?.length===0?<Text style={s.body}>Δεν έχουν καταχωριστεί υπηρεσίες για online κράτηση. Επικοινώνησε τηλεφωνικά με το κτηνιατρείο.</Text>:null}{state?.error&&<Text accessibilityRole="alert" style={s.error}>{state.error}</Text>}<Button primary disabled={!!checking||state?.loading||(state?.items?.length===0&&selectedId===vet.id&&!phoneUrl(vet.phone))} label={checking===vet.id||state?.loading?'Έλεγχος υπηρεσιών…':state?.items?.length===0?'Ραντεβού τηλεφωνικά':state?.error?'Δοκιμή κράτησης ξανά':'Κλείσε ραντεβού'} icon={state?.items?.length===0?'call-outline':'calendar-outline'} onPress={()=>state?.items?.length===0?(selectedId===vet.id?open(vet,'call'):setSelectedId(vet.id)):book(vet)}/></>;
  }
  const cities=[...new Set(vets.map(v=>v.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'));
  const specialties=[...new Set(vets.map(v=>v.specialty).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'));
  const selected=vets.find(v=>v.id===selectedId);
  async function open(vet,kind) {
    if(openingRef.current)return;
    const url=kind==='call'?phoneUrl(vet.phone):directionsUrl(vet,Platform.OS);
    if(!url)return;
    openingRef.current=true;setOpening(true);
    try {await Linking.openURL(url);}
    catch {
      if(kind==='map'&&Platform.OS==='ios') {
        try {await Linking.openURL(directionsUrl(vet,'android'));return;} catch {}
      }
      Alert.alert(kind==='call'?'Δεν άνοιξε η εφαρμογή τηλεφώνου':'Δεν άνοιξε ο χάρτης',kind==='call'?`Μπορείς να καλέσεις στο ${vet.phone}.`:`Διεύθυνση: ${[vet.address,vet.city].filter(Boolean).join(', ') || 'Επικοινώνησε με το κτηνιατρείο.'}`);
    }finally{openingRef.current=false;if(alive.current)setOpening(false);}
  }
  function actions(vet) {return <><View style={s.actions}><Button icon="call-outline" primary label="Κλήση" disabled={opening||!phoneUrl(vet.phone)} onPress={()=>open(vet,'call')}/><Button icon="navigate-outline" label="Διαδρομή" disabled={opening||!directionsUrl(vet,Platform.OS)} onPress={()=>open(vet,'map')}/></View>{!phoneUrl(vet.phone)&&<Text style={s.small}>Δεν έχει καταχωριστεί έγκυρο τηλέφωνο.</Text>}{!directionsUrl(vet,Platform.OS)&&<Text style={s.small}>Δεν έχει καταχωριστεί ακριβής τοποθεσία για διαδρομή.</Text>}</>;}
  const back=()=>selectedId?setSelectedId(null):onClose();
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={back}><SafeAreaView style={s.safe}>
    <View style={s.header}>{selectedId&&<Button icon="chevron-back" accessibilityLabel="Πίσω στη λίστα" onPress={()=>setSelectedId(null)}/>}<Text style={s.title}>{selectedId?'Στοιχεία κτηνιάτρου':onCall?'Εφημερεύοντες':'Βρες κτηνίατρο'}</Text><Button icon="close" accessibilityLabel="Κλείσιμο αναζήτησης" onPress={onClose}/></View>
    <ScrollView key={selectedId||'list'} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#121212"/>}>
      {onCall&&<View style={s.notice}><Ionicons name="call-outline" size={20} color="#92400e"/><Text style={s.noticeText}>Καλέστε πριν μεταβείτε. Η εφημερία δηλώνεται από το κτηνιατρείο.</Text></View>}
      {error ? <View style={s.card}><Text accessibilityRole="alert" style={s.error}>Δεν φορτώθηκαν οι κτηνίατροι. {error}</Text><Button label="Δοκιμή ξανά" onPress={load} disabled={loading}/></View> : <>
        
        {selectedId ? selected ? <View style={s.card}>
          <Avatar vet={selected}/><Text style={s.name}>{selected.name}</Text><Text style={s.body}>{selected.specialty}</Text>{onCall&&<Text style={s.badge}>Δηλωμένη εφημερία</Text>}{!!selected.description&&<Text style={s.body}>{selected.description}</Text>}{!onCall&&bookingAction(selected)}
          <View style={s.divider}/><Text style={s.label}>Διεύθυνση</Text><Text selectable style={s.body}>{[selected.address,selected.city].filter(Boolean).join(', ')||'Δεν έχει καταχωριστεί'}</Text>
          <Text style={s.label}>Τηλέφωνο</Text><Text selectable style={s.body}>{selected.phone||'Δεν έχει καταχωριστεί'}</Text>{actions(selected)}
          {selected.hours&&<><View style={s.divider}/><Text style={s.label}>Τακτικό ωράριο κτηνιατρείου</Text>{onCall&&<Text style={s.small}>Το ωράριο εφημερίας επιβεβαιώνεται τηλεφωνικά.</Text>}{Object.entries(weekdays).map(([day,label])=><View key={day} style={s.hours}><Text style={s.body}>{label}</Text><Text style={s.small}>{hoursText(selected.hours[day])}</Text></View>)}</>}
        </View> : <View style={s.card}><Text style={s.label}>Το κτηνιατρείο δεν εμφανίζεται πλέον στη λίστα.</Text><Text style={s.body}>Δες τις τρέχουσες επιλογές.</Text><Button label="Όλοι οι κτηνίατροι" onPress={()=>setSelectedId(null)}/></View> : <>
          <View style={{gap:12}}><View style={s.actions}><Button label={locating?'Εντοπισμός…':location?'Ανανέωση τοποθεσίας':'Η τοποθεσία μου'} icon="locate-outline" primary disabled={locating} onPress={async()=>{setCity('');setRadius(null);await locate();}}/><Button label={mapVisible?'Λίστα':'Χάρτης'} icon={mapVisible?'list-outline':'map-outline'} onPress={()=>setMapVisible(v=>!v)}/></View>{!!locationError&&<Text accessibilityRole="alert" style={s.error}>{locationError}</Text>}{location&&<><Text style={s.small}>Πρώτα οι κοντινότεροι · απόσταση σε ευθεία γραμμή</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:'row',gap:8}}>{[null,5,10,25].map(km=><Button key={km||'all'} label={km?`Έως ${km} χλμ.`:'Όλες οι αποστάσεις'} primary={radius===km} onPress={()=>setRadius(km)}/>)}</ScrollView><Button label="Χωρίς την τοποθεσία μου" onPress={()=>{clearLocation();setRadius(null);}}/></>}<TextInput accessibilityLabel="Αναζήτηση με όνομα, περιοχή ή ειδικότητα" placeholder="Όνομα, περιοχή ή ειδικότητα…" value={search} onChangeText={setSearch} style={s.input}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:'row',gap:8}}><Button label={city?'Όλες οι πόλεις':'✓ Όλες οι πόλεις'} onPress={()=>setCity('')}/>{cities.map(value=><Button key={value} primary={city===value} label={value} onPress={()=>setCity(value)}/>)}</ScrollView>{!onCall&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:'row',gap:8}}><Button label={specialty?'Όλες οι ειδικότητες':'✓ Όλες οι ειδικότητες'} onPress={()=>setSpecialty('')}/>{specialties.map(value=><Button key={value} primary={specialty===value} label={value} onPress={()=>setSpecialty(value)}/>)}</ScrollView>}{!!(search||city||specialty)&&<Button label="Καθαρισμός φίλτρων" onPress={()=>{setSearch('');setCity('');setSpecialty('');}}/>}</View>
          {loading&&!updated ? <ActivityIndicator color="#121212"/> : <><>{mapVisible&&<><VetMap vets={mapped} location={location} onSelect={setSelectedId}/><Text style={s.small}>Πάτησε έναν δείκτη για στοιχεία.{filtered.length>mapped.length?` ${filtered.length-mapped.length} κτηνιατρεία χωρίς συντεταγμένες εμφανίζονται μόνο στη λίστα.`:''}</Text></>}</><View style={s.hours}><Text style={s.label}>{filtered.length===1?"1 κτηνιατρείο":`${filtered.length} κτηνιατρεία`}</Text>{updated&&<Text style={s.small}>{updated.toLocaleTimeString("el-GR",{hour:"2-digit",minute:"2-digit"})}</Text>}</View>{filtered.map(vet=><View key={vet.id} style={s.card}><View style={s.row}><Avatar vet={vet}/><View style={{flex:1,gap:6}}><Text style={s.name}>{vet.name}</Text><Text style={s.small}>{vet.specialty}</Text>{onCall&&<Text style={s.badge}>Εφημερία</Text>}</View></View>{location&&<Text style={[s.label,{color:ui.brand}]}>{distanceLabel(vet.distance)}</Text>}<Text style={s.body}>{[vet.address,vet.city].filter(Boolean).join(', ')||'Δεν έχει καταχωριστεί διεύθυνση'}</Text><Text style={s.small}>{vet.reviews_count>0?`★ ${Number(vet.rating_average).toFixed(1)} · ${vet.reviews_count} αξιολογήσεις`:'Χωρίς αξιολογήσεις ακόμη'}</Text>{onCall&&actions(vet)}{!onCall&&bookingAction(vet)}<Button label="Στοιχεία & ωράριο →" onPress={()=>setSelectedId(vet.id)}/></View>)}{!filtered.length&&<View style={s.card}><Text style={s.label}>{vets.length?'Δεν βρέθηκαν κτηνίατροι με αυτά τα φίλτρα.':onCall?'Δεν εμφανίζονται εφημερεύοντα κτηνιατρεία.':'Δεν υπάρχουν διαθέσιμα κτηνιατρεία.'}</Text><Text style={s.body}>{vets.length?radius?'Αύξησε την απόσταση ή άλλαξε τα φίλτρα.':'Δοκίμασε άλλη πόλη ή αναζήτηση.':'Επικοινώνησε τηλεφωνικά με κτηνιατρείο της περιοχής σου.'}</Text><Button label="Ανανέωση αποτελεσμάτων" onPress={load} disabled={loading}/></View>}</>}
        </>}
      </>}
    </ScrollView>
  </SafeAreaView></Modal>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:ui.background},header:{...ui.header,justifyContent:'space-between'},title:{...ui.title,flex:1,fontSize:22},content:{padding:16,gap:16,paddingBottom:36,width:'100%',maxWidth:680,alignSelf:'center'},card:ui.card,notice:{padding:14,flexDirection:'row',gap:10,backgroundColor:ui.peach,borderRadius:16},noticeText:{flex:1,fontSize:12,lineHeight:19,color:'#805820'},row:{flexDirection:'row',alignItems:'flex-start',gap:12},avatar:{width:56,height:56,borderRadius:28},placeholder:{backgroundColor:ui.brandSoft,alignItems:'center',justifyContent:'center'},name:{fontSize:18,fontWeight:'700',lineHeight:25,letterSpacing:-.3,color:ui.ink},label:{fontSize:14,fontWeight:'600',color:ui.ink},body:{fontSize:14,lineHeight:22,color:'#666666'},small:{fontSize:12,lineHeight:20,color:ui.muted},badge:{alignSelf:'flex-start',fontSize:10,color:ui.green,backgroundColor:ui.greenSoft,paddingHorizontal:9,paddingVertical:5,borderRadius:20},actions:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{...ui.button,flexDirection:'row',gap:8},primary:{backgroundColor:ui.brand,borderColor:ui.brand},buttonText:{fontSize:12,fontWeight:'600',color:ui.ink},input:ui.input,divider:{height:1,backgroundColor:ui.line},hours:{flexDirection:'row',justifyContent:'space-between',gap:10,flexWrap:'wrap'},error:{color:'#a32929',fontSize:14,lineHeight:22}});
