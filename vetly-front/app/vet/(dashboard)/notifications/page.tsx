'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicFilterTabs, ClinicLoading, ClinicEmptyState, ClinicPagination } from '@/components/vet/ClinicUI';
import { useVetNotifications, markVetNotificationRead, markAllVetNotificationsRead, getVetUnreadCount, type VetNotification, type VetAppointment } from '@/hooks/useVetData';
import { api } from '@/lib/api';

export default function VetNotificationsPage() {
  const router = useRouter();
  const [page,setPage] = useState(1);
  const [filter,setFilter] = useState<''|'unread'|'read'>('');
  const [unread,setUnread] = useState<number|null>(null);
  const [version,setVersion] = useState(0);
  const [busy,setBusy] = useState(false);
  const lock = useRef(false);
  const [actionError,setActionError] = useState('');
  const {notifications,total,totalPages,loading,error,refetch} = useVetNotifications(page,10,filter);
  useEffect(()=>{let active=true;getVetUnreadCount().then(data=>{if(active)setUnread(data.count)}).catch(()=>{if(active)setUnread(null)});return()=>{active=false}},[version]);
  const updated = async () => {window.dispatchEvent(new Event('vetly:notifications-updated'));setVersion(v=>v+1);if(filter==='unread'&&page>1)setPage(1);else await refetch();};
  const act = async (work:()=>Promise<void>) => {if(lock.current)return;lock.current=true;setBusy(true);setActionError('');try{await work()}catch(e){setActionError(e instanceof Error?e.message:'Η ενέργεια δεν ολοκληρώθηκε.')}finally{lock.current=false;setBusy(false)}};
  const open = (n:VetNotification) => act(async()=>{
    if(!n.appointment_id)return;
    let appointment:VetAppointment;
    try{appointment=await api.get<VetAppointment>(`/vet/appointments/${encodeURIComponent(n.appointment_id)}`)}catch{throw new Error('Το συνδεδεμένο ραντεβού δεν είναι διαθέσιμο. Δοκιμάστε ξανά αργότερα.');}
    if(!n.is_read){await markVetNotificationRead(n.id);window.dispatchEvent(new Event('vetly:notifications-updated'));}
    router.push(`/vet/${appointment.status==='pending'?'pending':'appointments'}?appointmentId=${encodeURIComponent(appointment.id)}`);
  });
  return <div>
    <ClinicPageHeader title="Ειδοποιήσεις" description={unread===null?'Ενημερώσεις για τη δραστηριότητα του κτηνιατρείου.':unread?`${unread} νέες ειδοποιήσεις συνολικά`:'Δεν υπάρχουν αδιάβαστες ειδοποιήσεις.'} actions={<ClinicButton disabled={busy||unread===0} onClick={()=>void act(async()=>{await markAllVetNotificationsRead();await updated()})}>Σήμανση όλων ως διαβασμένες</ClinicButton>} />
    {actionError&&<p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <ClinicPanel className="overflow-hidden"><div inert={busy}><ClinicFilterTabs label="Κατάσταση ειδοποιήσεων" value={filter} options={[{value:'',label:'Όλες'},{value:'unread',label:'Νέες'},{value:'read',label:'Διαβασμένες'}]} onChange={value=>{setFilter(value as typeof filter);setPage(1)}} /></div><div className="border-b border-ink-200 px-4 py-3 text-xs text-ink-500">{loading?'Φόρτωση…':`${total} ειδοποιήσεις`}</div>
      {loading?<ClinicLoading label="Φόρτωση ειδοποιήσεων…"/>:error?<div role="alert" className="p-5"><p className="mb-3 text-sm text-red-700">{error}</p><ClinicButton onClick={()=>void refetch()}>Δοκιμή ξανά</ClinicButton></div>:!notifications.length?<ClinicEmptyState title={filter==='unread'?'Δεν υπάρχουν νέες ειδοποιήσεις':'Δεν υπάρχουν ειδοποιήσεις'} description="Οι ενημερώσεις του κτηνιατρείου θα εμφανίζονται εδώ."/>:<ul>{notifications.map(n=><li key={n.id} className={`border-b border-ink-200 p-4 last:border-0 sm:p-5 ${n.is_read?'bg-white':'bg-clinic-50/50 shadow-[inset_3px_0_0_var(--color-clinic-600)]'}`}>
        <div className="flex flex-wrap items-start justify-between gap-2"><h2 className={`min-w-0 break-words text-sm ${n.is_read?'font-medium text-ink-700':'font-semibold text-ink-900'}`}>{n.title}</h2><span className={`rounded-md px-2 py-1 text-xs ${n.is_read?'bg-ink-100 text-ink-500':'bg-clinic-100 font-medium text-clinic-800'}`}>{n.is_read?'Διαβασμένη':'Νέα'}</span></div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{n.message}</p><time dateTime={n.created_at} className="mt-2 block text-xs text-ink-500">{new Date(n.created_at).toLocaleString('el-GR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}</time>
        <div className="mt-3 flex flex-wrap gap-2">{n.appointment_id&&<ClinicButton disabled={busy} onClick={()=>void open(n)}>Άνοιγμα ραντεβού / αιτήματος</ClinicButton>}{!n.is_read&&<ClinicButton variant="ghost" disabled={busy} onClick={()=>void act(async()=>{await markVetNotificationRead(n.id);await updated()})}>Σήμανση ως διαβασμένη</ClinicButton>}</div>
        {!n.appointment_id&&n.type.startsWith('appointment')&&<p className="mt-2 text-xs text-ink-500">Αυτή η ειδοποίηση δεν διαθέτει σύνδεσμο προς συγκεκριμένο ραντεβού.</p>}
      </li>)}</ul>}
    </ClinicPanel><div inert={busy}><ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage}/></div>
  </div>;
}
