'use client';
import { useEffect, useRef, useState } from 'react';
import { useOwnerProfile, updateOwnerProfile, uploadOwnerPhoto } from '@/hooks/useOwnerData';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { ClinicButton, ClinicInput, ClinicLoading } from '@/components/vet/ClinicUI';
type Preferences = {email_appointments:boolean;email_reminders:boolean};
type Panel = 'profile'|'password'|'sessions'|'delete'|null;
export default function SettingsPage() {
  const {profile,loading,error,refetch} = useOwnerProfile();
  const {refreshUser,logout} = useAuth();
  const [panel,setPanel] = useState<Panel>(null);
  const [form,setForm] = useState({name:'',phone:'',address:''});
  const [prefs,setPrefs] = useState<Preferences|null>(null);
  const [prefsError,setPrefsError] = useState('');
  const [current,setCurrent] = useState('');
  const [password,setPassword] = useState('');
  const [repeat,setRepeat] = useState('');
  const [confirmation,setConfirmation] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [actionError,setActionError] = useState('');
  const pending = useRef(false);
  const file = useRef<HTMLInputElement>(null);
  async function loadPrefs() {try {setPrefsError('');setPrefs(await api.get<Preferences>('/owner/settings'));}catch {setPrefsError('Δεν φορτώθηκαν οι προτιμήσεις email.');}}
  useEffect(()=>{void loadPrefs();},[]);
  function open(value:Panel) {setPanel(value);setActionError('');setMessage('');setCurrent('');setPassword('');setRepeat('');setConfirmation('');setForm({name:profile?.name||'',phone:profile?.phone||'',address:profile?.address||''});}
  async function perform(task:()=>Promise<void>) {if(pending.current)return;pending.current=true;setBusy(true);setActionError('');setMessage('');try{await task();}catch(e){setActionError(e instanceof Error ? e.message : 'Η ενέργεια δεν ολοκληρώθηκε. Δοκιμάστε ξανά.');}finally{pending.current=false;setBusy(false);}}
  async function saveProfile() {if(form.name.trim().length<2){setActionError('Το όνομα χρειάζεται τουλάχιστον 2 χαρακτήρες.');return;}await perform(async()=>{await updateOwnerProfile({...form,name:form.name.trim()});await refreshUser();void refetch();setPanel(null);setMessage('Τα στοιχεία αποθηκεύτηκαν.');});}
  async function securityAction() {
    if(panel==='password' && (password!==repeat || password.length<10 || new TextEncoder().encode(password).length>72 || !/\p{L}/u.test(password) || !/\d/.test(password))){setActionError('Ο νέος κωδικός χρειάζεται τουλάχιστον 10 χαρακτήρες, γράμματα και αριθμούς, και πρέπει να συμφωνεί με την επιβεβαίωση.');return;}
    await perform(async()=>{const endpoint=panel==='password'?'password':panel==='sessions'?'logout-all':'delete-account';await api.post(`/owner/settings/${endpoint}`,{current_password:current,...(panel==='password'?{new_password:password}:{}),...(panel==='delete'?{confirmation}:{})});logout();});
  }
  async function upload(selected:File|undefined) {if(!selected)return;if(!['image/jpeg','image/png'].includes(selected.type)||selected.size>5*1024*1024){setActionError('Επιλέξτε JPG ή PNG έως 5 MB.');return;}await perform(async()=>{await uploadOwnerPhoto(selected);await refreshUser();void refetch();setMessage('Η φωτογραφία ενημερώθηκε.');});if(file.current)file.current.value='';}
  if(loading)return <ClinicLoading/>;
  if(error||!profile)return <div role="alert" className="p-5 text-red-700">Δεν φορτώθηκε το προφίλ.<ClinicButton onClick={refetch}>Επανάληψη</ClinicButton></div>;
  return <div className="mx-auto max-w-[1120px]">
    <header className="mb-6"><h1 className="text-xl font-semibold text-ink-900">Ρυθμίσεις</h1><p className="mt-1 text-sm text-ink-500">Τα στοιχεία σας, η επικοινωνία και η ασφάλεια του λογαριασμού.</p></header>
    {message&&<p role="status" className="mb-4 rounded-lg bg-clinic-50 p-3 text-sm text-clinic-800">{message}</p>}
    {actionError&&!panel&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <div className="space-y-6">
      <section className="grid gap-3 lg:grid-cols-[240px_1fr]"><div><h2 className="text-sm font-semibold">Προσωπικά στοιχεία</h2><p className="mt-2 text-sm leading-6 text-ink-500">Τα στοιχεία επικοινωνίας που χρησιμοποιείτε στο Vetly.</p></div><div className="min-w-0 rounded-xl border border-ink-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 p-5"><ClinicAvatar large name={profile.name} imageUrl={profile.image_url}/><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{profile.name}</h3><p className="break-all text-xs text-ink-500">{profile.email}</p></div><ClinicButton disabled={busy} onClick={()=>file.current?.click()}>Αλλαγή φωτογραφίας</ClinicButton><input ref={file} type="file" accept="image/jpeg,image/png" aria-label="Φωτογραφία προφίλ" className="hidden" onChange={e=>void upload(e.target.files?.[0])}/></div>
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2"><div><dt className="text-ink-500">Τηλέφωνο</dt><dd className="mt-1 break-words">{profile.phone||'Δεν έχει προστεθεί'}</dd></div><div><dt className="text-ink-500">Διεύθυνση</dt><dd className="mt-1 break-words">{profile.address||'Δεν έχει προστεθεί'}</dd></div></dl><div className="border-t border-ink-100 px-5 py-3"><ClinicButton disabled={busy} onClick={()=>open('profile')}>Επεξεργασία στοιχείων</ClinicButton></div>
      </div></section>
      <section className="grid gap-3 lg:grid-cols-[240px_1fr]"><div><h2 className="text-sm font-semibold">Επικοινωνία μέσω email</h2><p className="mt-2 text-sm leading-6 text-ink-500">Οι επιλογές αποθηκεύονται στον λογαριασμό σας. Οι ειδοποιήσεις μέσα στην εφαρμογή παραμένουν ενεργές.</p></div><div className="min-w-0 rounded-xl border border-ink-200 bg-white p-5 shadow-xs">
        {prefsError?<div role="alert" className="text-sm text-red-700">{prefsError}<ClinicButton onClick={loadPrefs}>Επανάληψη</ClinicButton></div>:!prefs?<ClinicLoading/>:<><div className="space-y-5">{([{key:'email_appointments',label:'Ενημερώσεις ραντεβού',description:'Επιβεβαίωση, ακύρωση, αλλαγή ώρας και ολοκλήρωση επίσκεψης.'},{key:'email_reminders',label:'Υπενθυμίσεις κτηνιάτρου',description:'Email όταν ο κτηνίατρος δημιουργεί νέα υπενθύμιση.'}] as const).map(item=><label key={item.key} className="flex items-start justify-between gap-4"><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs leading-5 text-ink-500">{item.description}</span></span><input className="mt-1 h-5 w-5 shrink-0 accent-clinic-600" type="checkbox" checked={prefs[item.key]} disabled={busy} onChange={e=>setPrefs({...prefs,[item.key]:e.target.checked})}/></label>)}</div><p className="mt-4 text-xs leading-5 text-ink-500">Τα email επιβεβαίωσης λογαριασμού και επαναφοράς κωδικού δεν απενεργοποιούνται.</p><div className="mt-5 border-t border-ink-100 pt-4"><ClinicButton disabled={busy} onClick={()=>perform(async()=>{setPrefs(await api.put<Preferences>('/owner/settings',prefs));setMessage('Οι προτιμήσεις email αποθηκεύτηκαν.');})}>Αποθήκευση προτιμήσεων</ClinicButton></div></>}
      </div></section>
      <section className="grid gap-3 lg:grid-cols-[240px_1fr]"><div><h2 className="text-sm font-semibold">Ασφάλεια</h2><p className="mt-2 text-sm leading-6 text-ink-500">Ελέγξτε την πρόσβαση στον λογαριασμό σας.</p></div><div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">{[{key:'password',title:'Αλλαγή κωδικού',text:'Ορίστε νέο κωδικό. Θα χρειαστεί νέα σύνδεση σε όλες τις συσκευές.'},{key:'sessions',title:'Αποσύνδεση από όλες τις συσκευές',text:'Ακυρώνει όλες τις υπάρχουσες συνδέσεις, μαζί με την τρέχουσα.'}].map(item=><button key={item.key} disabled={busy} onClick={()=>open(item.key as Panel)} className="flex w-full items-center justify-between gap-3 border-b border-ink-100 p-5 text-left last:border-0 hover:bg-ink-50"><span><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs leading-5 text-ink-500">{item.text}</span></span><span aria-hidden="true">↗</span></button>)}</div></section>
      <section className="grid gap-3 lg:grid-cols-[240px_1fr]"><div><h2 className="text-sm font-semibold">Λογαριασμός</h2></div><div className="rounded-xl border border-ink-200 bg-white p-5"><h3 className="text-sm font-semibold">Οριστική διαγραφή</h3><p className="mt-2 text-sm leading-6 text-ink-500">Διαγράφει τον λογαριασμό και τα συνδεδεμένα κατοικίδια, ιστορικά, αγωγές, αξιολογήσεις και συνομιλίες του. Ανεξάρτητα αρχεία που τηρούν τα κτηνιατρεία παραμένουν· για αυτά επικοινωνήστε με το ιατρείο.</p><ClinicButton className="mt-4" variant="danger" disabled={busy} onClick={()=>open('delete')}>Διαγραφή λογαριασμού</ClinicButton></div></section>
    </div>
    {panel&&<ClinicDrawer label={panel==='profile'?'Επεξεργασία στοιχείων':panel==='password'?'Αλλαγή κωδικού':panel==='sessions'?'Αποσύνδεση συσκευών':'Διαγραφή λογαριασμού'} busy={busy} onClose={()=>setPanel(null)}><form className="space-y-5 p-5" onSubmit={e=>{e.preventDefault();void(panel==='profile'?saveProfile():securityAction());}}>
      <div className="flex justify-end"><ClinicButton disabled={busy} onClick={()=>setPanel(null)} type="button">Κλείσιμο ×</ClinicButton></div>
      <h2 className="text-lg font-semibold">{panel==='profile'?'Στοιχεία επικοινωνίας':panel==='password'?'Αλλαγή κωδικού':panel==='sessions'?'Αποσύνδεση από όλες τις συσκευές':'Οριστική διαγραφή λογαριασμού'}</h2>
      {panel==='profile'?<>{([{key:'name',label:'Ονοματεπώνυμο',max:255},{key:'phone',label:'Τηλέφωνο',max:50},{key:'address',label:'Διεύθυνση',max:500}] as const).map(field=><label key={field.key} className="block text-sm text-ink-600">{field.label}<ClinicInput className="mt-2 w-full" required={field.key==='name'} minLength={field.key==='name'?2:undefined} maxLength={field.max} type={field.key==='phone'?'tel':'text'} disabled={busy} value={form[field.key]} onChange={e=>setForm({...form,[field.key]:e.target.value})}/></label>)}<p className="text-xs text-ink-500">Το email σύνδεσης παραμένει {profile.email}.</p></>:<>
        <p className="text-sm leading-6 text-ink-600">{panel==='delete'?'Η ενέργεια δεν αναιρείται. Δεν επιτρέπεται όσο έχετε εκκρεμή ή επιβεβαιωμένα ραντεβού. Μετά τη διαγραφή θα αποσυνδεθείτε.':'Για την προστασία του λογαριασμού, επιβεβαιώστε τον τρέχοντα κωδικό. Μετά την ενέργεια θα αποσυνδεθείτε από όλες τις συσκευές.'}</p>
        <label className="block text-sm">Τρέχων κωδικός<ClinicInput className="mt-2 w-full" type="password" autoComplete="current-password" required maxLength={128} value={current} disabled={busy} onChange={e=>setCurrent(e.target.value)}/></label>
        {panel==='password'&&<><label className="block text-sm">Νέος κωδικός<ClinicInput className="mt-2 w-full" type="password" aria-label="Νέος κωδικός" autoComplete="new-password" required minLength={10} maxLength={72} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/><span className="mt-1 block text-xs text-ink-500">Τουλάχιστον 10 χαρακτήρες, με γράμματα και αριθμούς.</span></label><label className="block text-sm">Επιβεβαίωση νέου κωδικού<ClinicInput className="mt-2 w-full" type="password" autoComplete="new-password" required value={repeat} disabled={busy} onChange={e=>setRepeat(e.target.value)}/></label></>}
        {panel==='delete'&&<label className="block text-sm">Πληκτρολογήστε ΔΙΑΓΡΑΦΗ<ClinicInput className="mt-2 w-full" required value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/></label>}
      </>}
      {actionError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4"><ClinicButton disabled={busy} type="button" onClick={()=>setPanel(null)}>Ακύρωση</ClinicButton><ClinicButton type="submit" variant={panel==='delete'?'danger':'primary'} disabled={busy||(panel==='delete'&&confirmation!=='ΔΙΑΓΡΑΦΗ')}>{busy?'Αποθήκευση…':panel==='profile'?'Αποθήκευση στοιχείων':panel==='password'?'Ενημέρωση κωδικού':panel==='sessions'?'Αποσύνδεση όλων':'Οριστική διαγραφή'}</ClinicButton></div>
    </form></ClinicDrawer>}
  </div>;
}

