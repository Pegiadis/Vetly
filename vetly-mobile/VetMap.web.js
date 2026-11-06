import {useEffect, useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {coordinates} from './vetGeography.mjs';

export default function VetMap({vets, location, onSelect}) {
  const container = useRef(null), map = useRef(null), layer = useRef(null), select = useRef(onSelect);
  select.current = onSelect;
  useEffect(() => {
    const instance = L.map(container.current, {scrollWheelZoom:false}).setView([39,23],6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(instance);
    map.current = instance;
    layer.current = L.layerGroup().addTo(instance);
    const resize = new ResizeObserver(()=>instance.invalidateSize());
    resize.observe(container.current);
    return ()=>{resize.disconnect();instance.remove();map.current=null;};
  }, []);
  const key = JSON.stringify([vets.map(v=>[v.id,v.name,v.coordinates_lat,v.coordinates_lng]),location]);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    const all = [];
    for (const vet of vets) {
      const point = coordinates(vet);
      if (!point) continue;
      const latlng = [point.latitude, point.longitude]; all.push(latlng);
      const label = document.createElement('span'); label.textContent = vet.name;
      const icon = L.divIcon({className:'',html:'<div style="background:#006064;color:white;border:3px solid white;border-radius:50%;width:30px;height:30px;box-shadow:0 2px 7px #0005;display:grid;place-items:center;font-size:20px">+</div>',iconSize:[30,30],iconAnchor:[15,15]});
      L.marker(latlng,{icon,title:vet.name,alt:vet.name}).bindTooltip(label).on('click',()=>select.current(vet.id)).addTo(layer.current);
    }
    if(location) {
      const latlng=[location.latitude,location.longitude]; all.push(latlng);
      L.circleMarker(latlng,{radius:8,color:'white',weight:3,fillColor:'#2675D8',fillOpacity:1}).bindTooltip('Η τοποθεσία σου').addTo(layer.current);
    }
    if(all.length) map.current.fitBounds(all,{padding:[35,35],maxZoom:14});
  },[key]);
  return <div ref={container} aria-label="Χάρτης κτηνιάτρων" style={{height:310,width:'100%',borderRadius:20,overflow:'hidden',zIndex:0}}/>;
}
