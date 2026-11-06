import {useEffect, useRef, useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {View, Text} from 'react-native';
import {coordinates} from './vetGeography.mjs';
import {ui} from './mobileTheme';

export default function VetMap({vets, location, onSelect}) {
  const map = useRef(null);
  const [ready, setReady] = useState(false);
  const points = vets.map(vet => ({vet, point: coordinates(vet)})).filter(v => v.point);
  const fitKey = JSON.stringify([points.map(v => v.point), location]);
  useEffect(() => {
    if (!ready) return;
    const all = [...points.map(v => v.point), ...(location ? [location] : [])];
    if (all.length === 1) map.current?.animateToRegion({...all[0], latitudeDelta:.04, longitudeDelta:.04}, 300);
    else if (all.length) map.current?.fitToCoordinates(all, {edgePadding:{top:45,right:45,bottom:45,left:45}, animated:true});
  }, [ready, fitKey]);
  return <View style={{height:310,borderRadius:20,overflow:'hidden'}}>
    <MapView ref={map} style={{flex:1}} onMapReady={()=>setReady(true)} initialRegion={{latitude:39,longitude:23,latitudeDelta:8,longitudeDelta:8}} toolbarEnabled={false}>
      {points.map(({vet,point})=><Marker key={vet.id} coordinate={point} title={vet.name} description={vet.specialty} pinColor={ui.brand} onPress={()=>onSelect(vet.id)}/>)}
      {location&&<Marker coordinate={location} title="Η τοποθεσία σου" pinColor="#2675D8"/>}
    </MapView>
    <Text style={{position:'absolute',top:10,left:10,backgroundColor:'white',padding:8,borderRadius:10,fontSize:11}}>Πάτησε έναν δείκτη για στοιχεία</Text>
  </View>;
}
