import assert from 'node:assert/strict';
import { test } from 'node:test';
import { petPayload } from './petForm.mjs';
const form = {name:' Μαξ ',breed:'Golden Retriever',age:'0',weight:'12,5',chip_number:'',type:'Dog',gender:'Male'};
test('accepts newborns and Greek decimal input',()=>{assert.equal(petPayload(form).age,0);assert.equal(petPayload(form).weight,12.5);assert.equal(petPayload(form).name,'Μαξ');});
test('rejects invalid numbers and microchips before saving',()=>{for(const change of [{age:''},{age:'1.5'},{age:'51'},{weight:'0'},{weight:'201'},{weight:'Infinity'},{weight:'1x'},{chip_number:'123'}]) assert.throws(()=>petPayload({...form,...change}));});
test('preserves leading zeroes in microchip',()=>assert.equal(petPayload({...form,chip_number:'001234567890123'}).chip_number,'001234567890123'));
test('updates omit unsupported species/gender and blank optional fields',()=>{const result=petPayload({...form,age:'',weight:''},true);for(const key of ['type','gender','age','weight','chip_number'])assert.equal(key in result,false);});
