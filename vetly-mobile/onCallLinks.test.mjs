import assert from 'node:assert/strict';
import {test} from 'node:test';
import {phoneUrl,mapDestination,directionsUrl,filterOnCallVets} from './onCallLinks.mjs';
test('phone supports formatted international and domestic numbers',()=>{
 assert.equal(phoneUrl('+30 (210) 123-4567'),'tel:+302101234567');
 assert.equal(phoneUrl('0030 210 1234567'),'tel:+302101234567');
 assert.equal(phoneUrl('2101234567'),'tel:2101234567');
});
test('phone rejects missing, ambiguous and dial-control values',()=>{
 for(const value of ['',null,'+','123','2101234567;123','*123#','2101234567 / 2107654321','tel:+302101234567','30+2101234567'])assert.equal(phoneUrl(value),null);
});
test('coordinates are preferred, including valid zero coordinates',()=>{
 assert.equal(mapDestination({coordinates_lat:0,coordinates_lng:0,address:'Elsewhere'}),'0,0');
 assert.equal(mapDestination({coordinates_lat:37.98,coordinates_lng:23.72}),'37.98,23.72');
 assert.equal(mapDestination({coordinates_lat:'37.98000000',coordinates_lng:'23.72000000'}),'37.98,23.72');
});
test('missing and invalid coordinates fall back only to a street address',()=>{
 assert.equal(mapDestination({coordinates_lat:null,coordinates_lng:null,city:'Αθήνα'}),null);
 assert.equal(mapDestination({coordinates_lat:NaN,coordinates_lng:200,address:'Σόλωνος 10',city:'Αθήνα'}),'Σόλωνος 10, Αθήνα');
 assert.equal(mapDestination({coordinates_lat:91,coordinates_lng:20}),null);
 for(const value of ['', ' ', false, 'NaN', 'Infinity'])assert.equal(mapDestination({coordinates_lat:value,coordinates_lng:'23.72'}),null);
});
test('directions encode Greek addresses and use directions mode on both platforms',()=>{
 const vet={address:'Οδός Α & Β 10',city:'Αθήνα'};
 const apple=new URL(directionsUrl(vet,'ios')),google=new URL(directionsUrl(vet,'android'));
 assert.equal(apple.hostname,'maps.apple.com');assert.equal(apple.searchParams.get('daddr'),'Οδός Α & Β 10, Αθήνα');
 assert.equal(google.pathname,'/maps/dir/');assert.equal(google.searchParams.get('api'),'1');assert.equal(google.searchParams.get('destination'),'Οδός Α & Β 10, Αθήνα');
 assert.equal(directionsUrl({},'ios'),null);
});
test('search ignores Greek accents and combines with city filter',()=>{
 const vets=[{id:'1',name:'Νίκος',city:'Αθήνα',address:'Σόλωνος'},{id:'2',name:'Νίκος',city:'Πάτρα'}];
 assert.deepEqual(filterOnCallVets(vets,'ΝΙΚΟΣ','Αθήνα').map(v=>v.id),['1']);
 assert.equal(filterOnCallVets(vets,'σολωνοσ','').length,1);
 assert.equal(filterOnCallVets(vets,'','').length,2);
});
