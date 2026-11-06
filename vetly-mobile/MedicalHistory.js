import PetPortrait from './PetPortrait';
import { ui } from './mobileTheme';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { request } from './api';
import { eventTypes, fetchMedicalHistory, medicalDate } from './medicalHistory.mjs';

function Button({ label, onPress, selected, disabled }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.button, selected && s.active, disabled && { opacity: .4 }]}><Text style={s.buttonText}>{label}</Text></Pressable>;
}
export default function MedicalHistory({ token, pets, initialPetId, onClose }) {
  const [petId,setPetId] = useState(initialPetId || 'all');
  const [type,setType] = useState(''), [page,setPage] = useState(1);
  const [selected,setSelected] = useState(null), [revision,setRevision] = useState(0);
  const [result,setResult] = useState(null), [failure,setFailure] = useState(null), [fetching,setFetching] = useState(true);
  const scroll = useRef(null);
  const ids = petId === 'all' ? pets.map(p=>p.id) : pets.filter(p=>p.id===petId).map(p=>p.id);
  const idsKey = JSON.stringify(ids);
  const key = JSON.stringify([idsKey,page,type,revision]);
  const data = result?.key === key ? result.data : null;
  const error = failure?.key === key ? failure.message : '';
  const loading = fetching || (!data && !error);
  useEffect(()=>{
    let active = true;
    setFetching(true); setFailure(null);
    fetchMedicalHistory({request,token,petIds:JSON.parse(idsKey),page,type})
      .then(data=>{if(active){if(page>data.pages)setPage(data.pages);else setResult({key,data});}})
      .catch(e=>{if(active)setFailure({key,message:e.status===401?'Η σύνδεσή σου έληξε. Κλείσε το ιστορικό και συνδέσου ξανά.':e.message});})
      .finally(()=>{if(active)setFetching(false);});
    return ()=>{active=false;};
  },[token,idsKey,page,type,revision,key]);
  const selectPet = value => {setPetId(value);setPage(1);setSelected(null);};
  const selectType = value => {setType(value);setPage(1);setSelected(null);};
  const changePage = value => {setPage(value);scroll.current?.scrollTo({y:0,animated:true});};
  const selectedPet = selected ? pets.find(p=>p.id===selected.pet_id) : null;
  const back = () => selected ? setSelected(null) : onClose();
  const refresh = () => setRevision(value=>value+1);
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={back}><SafeAreaView style={s.safe}>
    <View style={s.header}><View style={{flex:1}}><Text style={s.title}>{selected?'Λεπτομέρειες ιστορικού':'Ιατρικό ιστορικό'}</Text><Text style={s.small}>{selected?selectedPet?.name||'Κατοικίδιο':'Εξετάσεις, εμβόλια και οδηγίες'}</Text></View><Button label={selected?'← Πίσω':'Κλείσιμο'} onPress={back}/></View>
    {selected ? <ScrollView key={selected.id} contentContainerStyle={s.content}>
      <View style={s.panel}><Text style={s.badge}>{eventTypes[selected.event_type]||selected.event_type}</Text><Text style={s.small}>{medicalDate(selected.date)}</Text><Text style={s.eventTitle}>{selected.title}</Text></View>
      <View style={[s.panel,s.row]}><PetPortrait pet={selectedPet} size={52}/><View style={{flex:1,gap:5}}><Text style={s.heading}>{selectedPet?.name||'Κατοικίδιο'}</Text><Text style={s.body}>Κτηνίατρος: {selected.vet?.name||'Δεν έχει καταχωριστεί'}</Text>{!!selected.vet?.specialty&&<Text style={s.small}>{selected.vet.specialty}</Text>}</View></View>
      <View style={s.panel}><Text style={s.heading}>Σημειώσεις & οδηγίες κτηνιάτρου</Text><View style={s.divider}/><Text selectable style={s.notes}>{selected.notes?.trim()?selected.notes:'Δεν έχουν καταχωριστεί σημειώσεις ή οδηγίες για αυτή την επίσκεψη.'}</Text></View>
    </ScrollView> : <ScrollView key="list" ref={scroll} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#121212"/>}>
      <View style={s.panel}><Text style={s.heading}>Κατοικίδιο</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}><Button label="Όλα" selected={petId==='all'} onPress={()=>selectPet('all')}/>{pets.map(p=><Button key={p.id} label={p.name} selected={petId===p.id} onPress={()=>selectPet(p.id)}/>)}</ScrollView>
        <Text style={s.heading}>Τύπος καταχώρισης</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}><Button label="Όλα" selected={!type} onPress={()=>selectType('')}/>{Object.entries(eventTypes).map(([value,label])=><Button key={value} label={label} selected={type===value} onPress={()=>selectType(value)}/>)}</ScrollView>
      </View>
      <View style={s.section}><Text style={s.heading}>Καταγεγραμμένες επισκέψεις</Text>{data&&<Text style={s.small}>{data.total} καταχωρίσεις</Text>}</View>
      {loading ? <View style={s.panel}><ActivityIndicator color="#121212"/><Text style={s.small}>Φόρτωση ιστορικού…</Text></View> : error ? <View style={s.panel}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Button label="Δοκιμή ξανά" onPress={refresh}/></View> : !data?.items.length ? <View style={s.panel}><Ionicons name="document-text-outline" size={30} color="#858585"/><Text style={s.heading}>{pets.length?'Δεν υπάρχουν καταχωρίσεις':'Δεν υπάρχουν κατοικίδια'}</Text><Text style={s.body}>{pets.length?'Το ιστορικό που καταχωρίζει ο κτηνίατρος θα εμφανίζεται εδώ. Μπορείς να δοκιμάσεις άλλο φίλτρο.':'Πρόσθεσε κατοικίδιο από την ενότητα Κατοικίδια.'}</Text>{!!type&&<Button label="Όλοι οι τύποι καταχώρισης" onPress={()=>selectType('')}/>}</View> : data.items.map(event=>{
        const pet = pets.find(p=>p.id===event.pet_id);
        return <Pressable accessibilityRole="button" accessibilityLabel={`${event.title}, ${medicalDate(event.date)}, ${pet?.name||'Κατοικίδιο'}. Προβολή λεπτομερειών`} key={event.id} onPress={()=>setSelected(event)} style={s.panel}><View style={s.section}><Text style={s.small}>{medicalDate(event.date)}</Text><Ionicons name="chevron-forward" size={18} color="#121212"/></View><Text style={s.heading}>{event.title}</Text><Text style={s.badge}>{eventTypes[event.event_type]||event.event_type}</Text><View style={s.divider}/><Text style={s.body}>{pet?.name||'Κατοικίδιο'}</Text><Text style={s.small}>{event.vet?.name||'Δεν έχει καταχωριστεί κτηνίατρος'}</Text></Pressable>;
      })}
      {!loading&&!error&&data&&data.pages>1&&<View style={s.section}><Button label="Προηγούμενη" disabled={page<=1} onPress={()=>changePage(page-1)}/><Text style={s.small}>{page} / {data.pages}</Text><Button label="Επόμενη" disabled={page>=data.pages} onPress={()=>changePage(page+1)}/></View>}
      {petId==='all'&&!!data?.total&&<Text style={s.small}>Έως 10 καταχωρίσεις ανά κατοικίδιο σε κάθε σελίδα.</Text>}
    </ScrollView>}
  </SafeAreaView></Modal>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:ui.background},header:ui.header,title:{...ui.title,fontSize:21},small:{fontSize:12,color:ui.muted,lineHeight:19},content:{padding:16,paddingBottom:36,gap:16,maxWidth:680,width:'100%',alignSelf:'center'},panel:ui.card,heading:{fontSize:16,fontWeight:'600',color:ui.ink,lineHeight:23},eventTitle:{fontSize:25,fontWeight:'700',color:ui.ink,lineHeight:32,letterSpacing:-.5},body:{fontSize:14,color:'#666666',lineHeight:22},notes:{fontSize:15,color:'#333333',lineHeight:27},badge:{alignSelf:'flex-start',backgroundColor:ui.brandSoft,color:ui.brand,paddingHorizontal:11,paddingVertical:6,borderRadius:20,fontSize:11},button:ui.button,buttonText:{fontSize:12,fontWeight:'600',color:ui.ink},active:{backgroundColor:ui.accentSoft,borderColor:ui.accentSoft},filters:{gap:8,paddingVertical:2},section:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'},row:{flexDirection:'row',alignItems:'center',gap:12},avatar:{width:52,height:52,borderRadius:26},placeholder:{backgroundColor:ui.brandSoft,alignItems:'center',justifyContent:'center'},divider:{height:1,backgroundColor:ui.line},error:{fontSize:14,lineHeight:22,color:'#a32929'}});
