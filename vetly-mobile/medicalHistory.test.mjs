import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchMedicalHistory, medicalDate } from './medicalHistory.mjs';

test('calendar dates retain their exact day', () => {
  assert.equal(medicalDate('2026-10-23'), '23/10/2026');
  assert.equal(medicalDate(null), 'Δεν έχει καταχωριστεί ημερομηνία');
});
test('combined history preserves notes, sorts by date and uses per-pet page counts', async () => {
  const calls=[];
  const notes='Οδηγία κτηνιάτρου\nΔεύτερη γραμμή';
  const result=await fetchMedicalHistory({token:'session',petIds:['a','b'],page:2,type:'Lab Test',request:async(path,token)=>{
    calls.push({path,token});
    return path.includes('/a/')?{items:[{id:'1',date:'2026-01-01',notes}],total:21}:{items:[{id:'2',date:'2026-10-23',notes:null}],total:11};
  }});
  assert.equal(result.total,32);assert.equal(result.pages,3);
  assert.deepEqual(result.items.map(e=>e.id),['2','1']);
  assert.equal(result.items[1].notes,notes);
  for(const {path,token} of calls){const url=new URL(path,'https://test.invalid');assert.equal(url.searchParams.get('event_type'),'Lab Test');assert.equal(url.searchParams.get('page'),'2');assert.equal(token,'session');}
});
test('no pets requires no request', async()=>{
  const result=await fetchMedicalHistory({petIds:[],request:()=>assert.fail('No request expected')});
  assert.deepEqual(result,{items:[],total:0,pages:1});
});
test('one inaccessible pet is reported as failure, never as an empty history',async()=>{
  await assert.rejects(fetchMedicalHistory({petIds:['a'],page:1,request:async()=>{throw new Error('Unauthorized');}}),/Unauthorized/);
});
