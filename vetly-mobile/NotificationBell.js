import { ui } from './mobileTheme';
import { useEffect, useRef, useState } from 'react';
import { AppState, ActivityIndicator, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { request } from './api';
import { disablePush, enablePush, notifications, savedRegistration, testNotification } from './pushNotifications';
function Button({label,onPress,disabled}) {return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.5}]}><Text style={s.link}>{label}</Text></Pressable>;}
export default function NotificationBell({token,ownerId,onNavigate}) {
 const [open,setOpen]=useState(false),[count,setCount]=useState(0),[items,setItems]=useState([]),[page,setPage]=useState(1),[total,setTotal]=useState(0),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [settings,setSettings]=useState(false);
 const requestVersion=useRef(0), actionLock=useRef(false), navigate=useRef(onNavigate); navigate.current=onNavigate;
 async function unread(){try{const data=await request('/owner/notifications/unread-count',token);setCount(data.count);}catch{}}
 async function load(){const version=++requestVersion.current;setLoading(true);setError('');try{const data=await request(`/owner/notifications?page=${page}&page_size=20`,token);if(version===requestVersion.current){setItems(data.items);setTotal(data.total);await unread();}}catch(e){if(version===requestVersion.current)setError(e.message);}finally{if(version===requestVersion.current)setLoading(false);}}
 useEffect(()=>{unread();const timer=setInterval(()=>{if(AppState.currentState==='active')unread();},30000);const sub=AppState.addEventListener('change',state=>{if(state==='active')unread();});return()=>{clearInterval(timer);sub.remove();};},[token]);
 useEffect(()=>{if(open)load();return()=>{requestVersion.current++;};},[open,page,token]);
 useEffect(()=>{
  if(!ownerId)return;
  let active=true,sub,received;
  const handle=response=>{const data=response?.notification?.request?.content?.data;if(!active||data?.ownerId!==ownerId)return;setOpen(true);unread();};
  notifications().then(async N=>{if(!N||!active)return;sub=N.addNotificationResponseReceivedListener(handle);received=N.addNotificationReceivedListener(()=>{if(active)unread();});const last=await N.getLastNotificationResponseAsync();if(active&&last){handle(last);await N.clearLastNotificationResponseAsync();}}).catch(()=>{});
  savedRegistration().then(async saved=>{if(!active||saved?.ownerId!==ownerId)return;const N=await notifications();if(!active||!N)return;const permission=await N.getPermissionsAsync();if(permission.granted)await request('/owner/push-devices',token,{token:saved.token,platform:Platform.OS});else await disablePush(token);}).catch(()=>{});
  return()=>{active=false;sub?.remove();received?.remove();};
 },[token,ownerId]);
 async function action(fn){if(actionLock.current)return;actionLock.current=true;setBusy(true);setError('');setMessage('');try{const result=await fn();setMessage(result||'Ολοκληρώθηκε.');}catch(e){setError(e.message);}finally{actionLock.current=false;setBusy(false);}}
 async function read(item){await action(async()=>{if(!item.is_read)await request(`/owner/notifications/${item.id}/read`,token,{},'PATCH');await unread();setOpen(false);navigate.current(item.type.startsWith('appointment')?'visits':'care');return '';});}
 return <><Pressable accessibilityRole="button" accessibilityLabel={`Ειδοποιήσεις, ${count} αδιάβαστες`} onPress={()=>{setPage(1);setOpen(true);}} style={s.bell}><Ionicons name="notifications-outline" size={24} color="#121212"/>{count>0&&<Text style={s.badge}>{count>99?'99+':count}</Text>}</Pressable>
 {open&&<Modal visible animationType="slide" onRequestClose={()=>setOpen(false)}><SafeAreaView style={s.safe}><View style={s.header}><Text style={s.title}>Ειδοποιήσεις</Text><Button label="Κλείσιμο" onPress={()=>setOpen(false)}/></View><ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>}>
  <Button label={settings?"Κλείσιμο ρυθμίσεων":"Ρυθμίσεις ειδοποιήσεων"} onPress={()=>setSettings(v=>!v)}/>{settings&&<View style={s.panel}><Text style={s.heading}>Ειδοποιήσεις σε αυτό το κινητό</Text><Text style={s.body}>Επιβεβαιώσεις ραντεβού και υπενθυμίσεις στις ώρες που έχει καταχωρίσει ο κτηνίατρος. Οι ώρες φαρμάκων ακολουθούν την ώρα Ελλάδας.</Text><Button disabled={busy} label="Ενεργοποίηση ειδοποιήσεων" onPress={()=>action(()=>enablePush(token,ownerId))}/><Button disabled={busy} label="Δοκιμαστική ειδοποίηση" onPress={()=>action(async()=>{await testNotification();return 'Η δοκιμή θα εμφανιστεί σε 5 δευτερόλεπτα.';})}/><Button disabled={busy} label="Απενεργοποίηση σε αυτή τη συσκευή" onPress={()=>action(async()=>{await disablePush(token);return 'Οι ειδοποιήσεις απενεργοποιήθηκαν για αυτή τη συσκευή.';})}/>{Platform.OS!=='web'&&<Button label="Ρυθμίσεις κινητού" onPress={()=>Linking.openSettings()}/>}</View>}
  {!!message&&<Text style={s.body}>{message}</Text>}{!!error&&<View style={s.panel}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Button label="Ανανέωση λίστας" onPress={load}/></View>}
  <Button disabled={busy||!count} label="Σήμανση όλων ως διαβασμένων" onPress={()=>action(async()=>{await request('/owner/notifications/mark-all-read',token,{},'POST');await load();return 'Όλες οι ειδοποιήσεις σημειώθηκαν ως διαβασμένες.';})}/>
  {loading?<ActivityIndicator color="#121212"/>:items.map(item=><Pressable accessibilityRole="button" disabled={busy} key={item.id} onPress={()=>read(item)} style={[s.panel,!item.is_read&&{borderColor:'#121212'}]}><Text style={s.heading}>{!item.is_read?'● ':''}{item.title}</Text><Text style={s.body}>{item.message}</Text><Text style={s.link}>Προβολή {item.type.startsWith('appointment')?'ραντεβού':'φροντίδας'} →</Text></Pressable>)}
  {!loading&&!error&&!items.length&&<Text style={s.body}>Δεν υπάρχουν ειδοποιήσεις.</Text>}
  {total>20&&<View style={s.header}><Button disabled={page===1||loading} label="Πίσω" onPress={()=>setPage(p=>p-1)}/><Text>{page} / {Math.ceil(total/20)}</Text><Button disabled={page*20>=total||loading} label="Επόμενη" onPress={()=>setPage(p=>p+1)}/></View>}
 </ScrollView></SafeAreaView></Modal>}</>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:ui.background},header:{...ui.header,justifyContent:'space-between'},title:ui.title,content:{padding:16,paddingBottom:32,gap:16,maxWidth:680,width:'100%',alignSelf:'center'},panel:ui.card,heading:{fontSize:16,fontWeight:'600',color:ui.ink},body:{fontSize:13,lineHeight:22,color:ui.muted},link:{color:ui.ink,fontSize:12,fontWeight:'600'},button:ui.button,error:{color:'#a32929',lineHeight:22},bell:{padding:10,minWidth:44,minHeight:44},badge:{position:'absolute',right:0,top:0,borderRadius:12,backgroundColor:ui.accentSoft,color:ui.ink,fontSize:10,padding:3,minWidth:18,textAlign:'center'}});
