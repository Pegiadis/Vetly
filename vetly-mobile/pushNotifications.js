import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { request } from './api';
const key = 'vetly_push_registration';
let notificationsPromise;
export async function notifications() {
  if (Platform.OS === 'web') return null;
  if (!notificationsPromise) notificationsPromise = import('expo-notifications').then(N => {
    N.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
    return N;
  });
  return notificationsPromise;
}
export async function savedRegistration() {
  if (Platform.OS==='web') return null;
  const raw=await SecureStore.getItemAsync(key);
  return raw ? JSON.parse(raw) : null;
}
export async function enablePush(auth, ownerId) {
  if (Platform.OS==='web') throw new Error('Ενεργοποίησε τις ειδοποιήσεις από το κινητό σου.');
  if (Constants.appOwnership==='expo') throw new Error('Για ειδοποιήσεις με κλειστή εφαρμογή χρειάζεται η δοκιμαστική εγκατάσταση Vetly. Στο Expo Go μπορείς να δοκιμάσεις την τοπική ειδοποίηση.');
  if (!Device.isDevice) throw new Error('Άνοιξε την εφαρμογή σε πραγματικό κινητό για ενεργοποίηση.');
  const projectId=Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Η εγκατάσταση δεν έχει ακόμη ρυθμιστεί για ειδοποιήσεις.');
  const N=await notifications();
  if (Platform.OS==='android') await N.setNotificationChannelAsync('vetly-care',{name:'Ραντεβού & φροντίδα',importance:N.AndroidImportance.HIGH});
  const permission=await N.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Επίτρεψε τις ειδοποιήσεις από τις ρυθμίσεις του κινητού.');
  const pushToken=(await N.getExpoPushTokenAsync({projectId})).data;
  // Save before registration so a failed response can still be unregistered safely.
  await SecureStore.setItemAsync(key,JSON.stringify({token:pushToken,ownerId}));
  const result=await request('/owner/push-devices',auth,{token:pushToken,platform:Platform.OS});
  return result.delivery_enabled ? 'Οι ειδοποιήσεις ενεργοποιήθηκαν σε αυτή τη συσκευή.' : 'Η συσκευή καταχωρίστηκε. Απομένει η ενεργοποίηση αποστολής στον server.';
}
export async function disablePush(auth) {
  const saved=await savedRegistration();
  if (!saved) return;
  await request('/owner/push-devices',auth,{token:saved.token},'DELETE');
  await SecureStore.deleteItemAsync(key);
}
export async function testNotification() {
  const N=await notifications();
  if (!N) throw new Error('Η δοκιμή γίνεται από το κινητό.');
  if (Platform.OS==='android') await N.setNotificationChannelAsync('vetly-care',{name:'Ραντεβού & φροντίδα',importance:N.AndroidImportance.HIGH});
  if (!(await N.requestPermissionsAsync()).granted) throw new Error('Επίτρεψε τις ειδοποιήσεις από τις ρυθμίσεις του κινητού.');
  await N.scheduleNotificationAsync({content:{title:'Vetly · Δοκιμή',body:'Η δοκιμαστική ειδοποίηση λειτουργεί.',sound:'default'},trigger:{type:N.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:5,channelId:'vetly-care'}});
}
