'use client';

import { useEffect, useRef, useState } from 'react';
import ClinicAvatar from './ClinicAvatar';
import type { VetAppointment } from '@/hooks/useVetData';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const minutes = (value: string) => { const d = new Date(value); return d.getHours()*60+d.getMinutes(); };
const clock = (value: string) => new Date(value).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const statuses: Record<string,string> = {pending:'Αναμονή',confirmed:'Επιβεβαιωμένο',completed:'Ολοκληρωμένο',cancelled:'Ακυρωμένο',rejected:'Απορρίφθηκε'};

// Pack overlapping visible blocks into lanes, including the minimum readable height.
function layout(items: VetAppointment[]) {
  const sorted = [...items].sort((a,b)=>minutes(a.scheduled_at)-minutes(b.scheduled_at)||a.id.localeCompare(b.id));
  const result: {appointment:VetAppointment;start:number;end:number;lane:number;lanes:number}[] = [];
  let cluster: typeof result = [], ends: number[] = [];
  const flush = () => { cluster.forEach(item=>{item.lanes=ends.length;result.push(item)});cluster=[];ends=[]; };
  for(const appointment of sorted) {
    const start=minutes(appointment.scheduled_at),end=start+Math.max(36,appointment.duration_minutes);
    if(cluster.length && start>=Math.max(...ends))flush();
    let lane=ends.findIndex(value=>value<=start);if(lane<0)lane=ends.length;
    ends[lane]=end;cluster.push({appointment,start,end,lane,lanes:1});
  }
  flush();return result;
}

export default function ScheduleTimeline({dates,appointments,selectedId,onSelect,onDay,onCreate,onMove}: {dates:Date[];appointments:VetAppointment[];selectedId:string|null;onSelect:(a:VetAppointment)=>void;onDay:(d:Date)=>void;onCreate?:(date:string,time:string)=>void;onMove?:(a:VetAppointment,date:string,time:string)=>void}) {
  const scroll=useRef<HTMLDivElement>(null);
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
  const blocks=dates.map(date=>layout(appointments.filter(a=>key(new Date(a.scheduled_at))===key(date))));
  const all=blocks.flat();
  const first=Math.min(8, ...all.map(b=>Math.floor(b.start/60)));
  const last=Math.max(20, ...all.map(b=>Math.ceil(b.end/60)));
  const height=(last-first)*120;
  const dateKey=dates.map(key).join(',');
  useEffect(()=>{if(scroll.current)scroll.current.scrollTop=Math.max(0,(8-first)*120)},[dateKey,first]);
  const columns=`48px repeat(${dates.length}, minmax(0, 1fr))`;
  return <div ref={scroll} role="region" aria-label="Ώρες ημερολογίου" tabIndex={0} className="max-h-[68dvh] min-h-80 overflow-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-clinic-600">
    <div className={dates.length>1 ? 'min-w-[980px]' : 'min-w-0'}>
      <div className="sticky top-0 z-20 grid border-b border-ink-200 bg-white" style={{gridTemplateColumns:columns}}><div className="self-center text-center text-[10px] text-ink-400">Ώρα</div>{dates.map(date=><button key={key(date)} onClick={()=>onDay(date)} className="border-l border-ink-100 py-3 text-xs"><span className="text-ink-500">{date.toLocaleDateString('el-GR',{weekday:'short'})}</span><span className={`mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full font-semibold ${key(date)===key(now)?'bg-clinic-600 text-white':'text-ink-800'}`}>{date.getDate()}</span></button>)}</div>
      <div className="grid" style={{gridTemplateColumns:columns}}><div className="relative bg-white" style={{height}}>{Array.from({length:last-first},(_,i)=><span key={i} className="absolute right-2 text-[11px] tabular-nums text-ink-500" style={{top:i*120+4}}>{String(first+i).padStart(2,'0')}:00</span>)}</div>
        {dates.map((date,index)=><div key={key(date)} className={`relative border-l border-ink-200 ${key(date)===key(now)?'bg-clinic-50/30':'bg-white'}`} style={{height,backgroundImage:'repeating-linear-gradient(to bottom, transparent 0, transparent 59px, #edf0ee 59px, #edf0ee 60px, transparent 60px, transparent 119px, #dce3df 119px, #dce3df 120px)'}}>
          {onCreate && Array.from({length:(last-first)*4},(_,i)=>{const minute=first*60+i*15;if(minute>=1440)return null;const slot=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;return <button key={slot} type="button" aria-label={`Νέο ραντεβού, ${key(date)}, ${slot}`} data-calendar-slot={`${key(date)}T${slot}`} onClick={()=>onCreate(key(date),slot)} onDragOver={e=>{if(e.dataTransfer.types.includes('application/vetly-appointment')){e.preventDefault();e.dataTransfer.dropEffect='move';}}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/vetly-appointment');const a=appointments.find(item=>item.id===id);if(a?.status==='confirmed')onMove?.(a,key(date),slot);}} className="absolute inset-x-0 h-[30px] text-left text-[10px] text-transparent hover:bg-clinic-100/60 hover:text-clinic-800 focus-visible:z-10 focus-visible:bg-clinic-100 focus-visible:text-clinic-800 focus-visible:outline-2 focus-visible:outline-clinic-600" style={{top:i*30}}><span className="px-2">+ {slot}</span></button>})}
          {blocks[index].map(({appointment:a,start,end,lane,lanes})=>{
            const name=a.pet?.name || 'Ασθενής';
            const selected=selectedId===a.id;
            const off=a.status==='cancelled'||a.status==='rejected';
            // Status reads from the left stripe and tint; pending and finished also say so in words.
            const tone=selected?'border-clinic-600 border-l-clinic-600 bg-clinic-100 ring-1 ring-clinic-600'
              :a.status==='pending'?'border-[#f6c9a3] border-l-[#e9690b] bg-[#fff4ea]'
              :off?'border-ink-200 border-l-ink-300 bg-ink-50 text-ink-500'
              :a.status==='completed'?'border-ink-200 border-l-ink-400 bg-ink-50 text-ink-600'
              :'border-clinic-200 border-l-clinic-600 bg-clinic-50';
            const detail=a.status==='pending'?`Αναμονή · ${a.type}`:a.status==='completed'?`Ολοκληρώθηκε · ${a.type}`:off?statuses[a.status]:a.type;
            return <button key={a.id} data-appointment-id={a.id} draggable={a.status==='confirmed' && !!onMove} onDragStart={e=>{if(a.status!=='confirmed'){e.preventDefault();return;}e.dataTransfer.setData('application/vetly-appointment',a.id);e.dataTransfer.effectAllowed='move';}} aria-label={`${name}, ${clock(a.scheduled_at)}, ${a.type}, ${statuses[a.status] || a.status}`} aria-pressed={selected} onClick={()=>onSelect(a)} title={`${name} · ${clock(a.scheduled_at)} · ${a.duration_minutes} λεπτά · ${a.type} · ${statuses[a.status] || a.status}`} className={`absolute flex items-start gap-2 overflow-hidden rounded-lg border border-l-[3px] px-2 py-1.5 text-left text-ink-900 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-clinic-600 ${tone}`} style={{top:(start-first*60)*2+2,height:(end-start)*2-4,left:`calc(${lane/lanes*100}% + 3px)`,width:`calc(${100/lanes}% - 6px)`}}>
              {dates.length===1 && <span className="shrink-0 [&>span]:h-8 [&>span]:w-8 [&>span]:text-[11px]"><ClinicAvatar name={name} imageUrl={a.pet?.image_url} /></span>}
              <span className="min-w-0 flex-1">
                <strong className={`block truncate text-[13px] font-semibold leading-[18px] ${off?'line-through':''}`}>{name}</strong>
                <span className="block truncate text-[11px] leading-4 tabular-nums"><span className="font-medium">{clock(a.scheduled_at)}</span>{lanes===1 || dates.length===1 ? ` · ${a.duration_minutes}′` : ''}</span>
                <span className="block truncate text-[11px] leading-4 opacity-75">{detail}{dates.length===1 && a.pet_owner?.name ? ` · ${a.pet_owner.name}` : ''}</span>
              </span>
            </button>;
          })}
          {key(date)===key(now)&&now.getHours()*60+now.getMinutes()>=first*60&&now.getHours()*60+now.getMinutes()<last*60&&<div aria-label="Τρέχουσα ώρα" className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-400" style={{top:(now.getHours()*60+now.getMinutes()-first*60)*2}}><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" /></div>}
        </div>)}
      </div>
    </div>
  </div>;
}
