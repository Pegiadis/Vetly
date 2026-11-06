import {useEffect,useRef,useState} from 'react';
import * as Location from 'expo-location';
import {Platform} from 'react-native';

export default function useVetLocation() {
  const [location,setLocation]=useState(null),[locating,setLocating]=useState(false),[locationError,setError]=useState('');
  const mounted=useRef(true),pending=useRef(false),version=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;version.current++;};},[]);
  async function locate() {
    if(pending.current)return;
    pending.current=true;setLocating(true);setError('');
    const current=++version.current;
    let timer;
    try {
      let coords;
      if(Platform.OS==='web') {
        if(!navigator.geolocation)throw new Error('Η τοποθεσία δεν υποστηρίζεται εδώ. Επίλεξε πόλη.');
        coords=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve(p.coords),e=>reject(new Error(e.code===1?'Δεν δόθηκε άδεια τοποθεσίας. Μπορείς να την επιτρέψεις από τις ρυθμίσεις ή να επιλέξεις πόλη.':'Δεν εντοπίστηκε η θέση σου. Δοκίμασε ξανά ή επίλεξε πόλη.')),{timeout:15000,maximumAge:60000,enableHighAccuracy:false}));
      } else {
        const permission=await Location.requestForegroundPermissionsAsync();
        if(!permission.granted)throw new Error('Δεν δόθηκε άδεια τοποθεσίας. Ενεργοποίησέ την στις ρυθμίσεις του κινητού ή επίλεξε πόλη.');
        if(!await Location.hasServicesEnabledAsync())throw new Error('Ενεργοποίησε τις υπηρεσίες τοποθεσίας του κινητού και δοκίμασε ξανά.');
        const result=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Η τοποθεσία άργησε να απαντήσει. Δοκίμασε ξανά ή επίλεξε πόλη.')),20000);})]);
        coords=result.coords;
      }
      if(mounted.current&&current===version.current)setLocation({latitude:coords.latitude,longitude:coords.longitude});
    } catch(e) {if(mounted.current&&current===version.current)setError(e.message||'Δεν εντοπίστηκε η θέση σου. Επίλεξε πόλη.');}
    finally {clearTimeout(timer);pending.current=false;if(mounted.current)setLocating(false);}
  }
  return {location,locating,locationError,locate,clearLocation:()=>{version.current++;setLocation(null);setError('');}};
}
