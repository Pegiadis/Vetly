import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinates,distanceKm,nearbyVets,distanceLabel} from './vetGeography.mjs';

test('API decimal strings work, missing coordinates never become zero',()=>{
  assert.deepEqual(coordinates({coordinates_lat:'40.63',coordinates_lng:'22.94'}),{latitude:40.63,longitude:22.94});
  assert.deepEqual(coordinates({coordinates_lat:0,coordinates_lng:0}),{latitude:0,longitude:0});
  for(const value of [null,'',false,'Infinity',91])assert.equal(coordinates({coordinates_lat:value,coordinates_lng:0}),null);
});
test('distance uses kilometers and handles the date line',()=>{
  assert.ok(Math.abs(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:1})-111.195)<.01);
  assert.ok(distanceKm({latitude:0,longitude:179.99},{latitude:0,longitude:-179.99})<3);
});
test('nearby results sort, respect radius, retain unknown locations only in all distances',()=>{
  const origin={latitude:0,longitude:0};
  const vets=[{id:'unknown'},{id:'far',coordinates_lat:'0',coordinates_lng:'1'},{id:'near',coordinates_lat:'0',coordinates_lng:'0.01'}];
  assert.deepEqual(nearbyVets(vets,origin).map(v=>v.id),['near','far','unknown']);
  assert.deepEqual(nearbyVets(vets,origin,5).map(v=>v.id),['near']);
  assert.deepEqual(nearbyVets(vets,null,5).map(v=>v.id),['unknown','far','near']);
  assert.equal(vets[0].distance,undefined);
});
test('distance labels distinguish unknown from a zero distance',()=>{
  assert.equal(distanceLabel(null),'Άγνωστη απόσταση');
  assert.equal(distanceLabel(0),'0 μ.');
  assert.equal(distanceLabel(2.35),'2.4 χλμ.');
});
