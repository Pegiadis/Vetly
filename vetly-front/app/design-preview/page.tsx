'use client'

import { useRef, useState } from 'react'
import { ActivityIcon, ArrowRightIcon, CalendarIcon, HeartIcon, LogoIcon, UserIcon } from '@/components/Icons'
import './preview.css'

const photo = 'https://images.unsplash.com/photo-1693615775129-f2004d6e3e0b?auto=format&fit=crop&w=1000&q=85'
const navigation = [
  { label: 'Σήμερα', icon: ActivityIcon },
  { label: 'Ημερολόγιο', icon: CalendarIcon },
  { label: 'Υγεία', icon: HeartIcon },
  { label: 'Προφίλ', icon: UserIcon },
]

export default function DesignPreview() {
  const [mobile, setMobile] = useState(false)
  const [tab, setTab] = useState('Σήμερα')
  const [tasks, setTasks] = useState([false, false, true])
  const [notes, setNotes] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState('')
  const appointment = useRef<HTMLDialogElement>(null)
  const journal = useRef<HTMLDialogElement>(null)
  const done = tasks.filter(Boolean).length
  function nav() {
    return navigation.map(({label, icon: Icon}) => <button key={label} onClick={() => setTab(label)} aria-current={tab === label ? 'page' : undefined}><Icon className="v-icon"/><span>{label}</span>{tab === label && <span className="v-nav-dot"/>}</button>)
  }
  return <div className="vetly-concept">
    <div className="v-previewbar"><span><b>VETLY</b> / Νέα εμφάνιση <span className="v-demo-label">· Δοκιμαστικά δεδομένα</span></span><div><button aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button><button aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button></div></div>
    <div className={`v-app ${mobile ? 'v-mobile' : ''}`}>
      <aside className="v-sidebar"><a className="v-wordmark" href="/design-preview"><LogoIcon className="v-brand-icon"/>vetly<span>®</span></a><div className="v-sidebar-label">Ο ΚΟΣΜΟΣ ΤΟΥ ΜΑΞ</div><nav aria-label="Κύρια πλοήγηση">{nav()}</nav><div className="v-sidebar-bottom"><div className="v-small-mark">Μ</div><div><b>Μαξ</b><small>Golden Retriever</small></div><span>↗</span></div></aside>
      <div className="v-workspace">
        <header className="v-header"><div className="v-breadcrumb">Ο χώρος μου <span>/</span> <b>{tab}</b></div><a className="v-mobile-logo" href="/design-preview">vetly<span>®</span></a><div className="v-account"><span>Γιάννης</span><button aria-label="Άνοιγμα προφίλ" onClick={()=>setTab('Προφίλ')}>Γ</button></div></header>
        <main className="v-main">
          <div className="v-heading"><div><p className="v-eyebrow">ΤΡΙΤΗ, 29 ΣΕΠΤΕΜΒΡΙΟΥ</p><h1>{tab === 'Σήμερα' ? <>Η μέρα σας, <span>μαζί.</span></> : tab}</h1></div><button className="v-outline v-new-note" aria-label="Νέα σημείωση" onClick={()=>journal.current?.showModal()}>＋ <span>Νέα σημείωση</span></button></div>
          {tab === 'Σήμερα' && <>
            <div className="v-top-grid">
              <section className="v-pet" aria-label="Προφίλ Μαξ"><div className="v-pet-photo"><img src={photo} alt="Golden Retriever με χρυσαφένιο τρίχωμα"/><span className="v-photo-tag">Ο καλύτερός σου φίλος.</span></div><div className="v-pet-caption"><div><p>GOLDEN RETRIEVER · 3 ΕΤΩΝ</p><h2>Μαξ<span>♂</span></h2></div><button onClick={()=>setTab('Προφίλ')} aria-label="Προβολή προφίλ Μαξ"><ArrowRightIcon className="v-icon"/></button></div></section>
              <section className="v-care"><div className="v-section-head"><h2>Λίγη φροντίδα, κάθε μέρα.</h2><span className="v-count">{done}/3</span></div><p className="v-muted">Τα μικρά που κάνουν τη διαφορά.</p><div className="v-task-list">{[
                ['Βόλτα στη γειτονιά', '15 λεπτά · Μαζί, έξω', '01'],
                ['Έλεγχος μετά τη βόλτα', 'Τρίχωμα & πατούσες', '02'],
                ['Φρέσκο νερό', 'Μια μικρή καθημερινή συνήθεια', '03'],
              ].map(([title,description,number],i)=><button key={title} className={`v-task ${tasks[i]?'v-done':''}`} aria-pressed={tasks[i]} onClick={()=>{setTasks(previous=>previous.map((v,j)=>j===i?!v:v));setFeedback(tasks[i]?'Η ενέργεια είναι ξανά σε εκκρεμότητα.':'Η φροντίδα καταγράφηκε.')}}><span className="v-task-number">{number}</span><span className="v-task-copy"><b>{title}</b><small>{description}</small></span><span className="v-checkbox">{tasks[i]?'✓':''}</span></button>)}</div><div className="v-care-footer"><span className="v-tiny-dot"/><span>{done===3?'Όλα έτοιμα. Ώρα για λίγη παρέα.':done===2?'Μία μικρή κίνηση ακόμα για σήμερα.':`${3-done} μικρές κινήσεις ακόμα για σήμερα.`}</span></div></section>
            </div>
            <div className="v-bottom-grid"><section className="v-appointment"><div className="v-section-head"><p className="v-eyebrow">ΣΤΗΝ ΑΤΖΕΝΤΑ</p><CalendarIcon className="v-icon"/></div><div className="v-appointment-body"><div className="v-date"><strong>02</strong><span>ΟΚΤ</span></div><div><h2>Ετήσιος έλεγχος</h2><p>Παρασκευή, 10:30</p><small>Δρ. Ελένη Παππά</small></div></div><button className="v-text-link" onClick={()=>appointment.current?.showModal()}>Το ραντεβού μου <ArrowRightIcon className="v-icon"/></button></section><section className="v-journal"><div><p className="v-eyebrow">ΤΟ ΗΜΕΡΟΛΟΓΙΟ ΜΑΣ</p><h2>Οι μέρες περνούν.<br/>Οι στιγμές μένουν.</h2><p>Κράτησε κάτι από τη σημερινή.</p></div><button className="v-dark-button" onClick={()=>journal.current?.showModal()}>Πρόσθεσε μια στιγμή <span>＋</span></button></section></div>
          </>}
          {tab === 'Ημερολόγιο' && <section className="v-detail"><div className="v-section-head"><h2>Οι στιγμές σας</h2><button className="v-dark-button" onClick={()=>journal.current?.showModal()}>＋ Νέα στιγμή</button></div>{notes.length?notes.map((text,i)=><article className="v-note" key={i}><p className="v-eyebrow">ΣΗΜΕΡΑ</p><p>{text}</p></article>):<div className="v-empty"><CalendarIcon className="v-icon"/><h2>Η πρώτη σας σελίδα.</h2><p>Μια βόλτα, ένα παιχνίδι, κάτι που θέλεις να θυμάσαι.</p><button className="v-outline" onClick={()=>journal.current?.showModal()}>Γράψε την πρώτη σημείωση</button></div>}</section>}
          {tab === 'Υγεία' && <section className="v-detail"><p className="v-eyebrow">ΤΟ ΒΙΒΛΙΑΡΙΟ ΤΟΥ ΜΑΞ</p><h2>Το επόμενο βήμα στη φροντίδα του.</h2><div className="v-health-row"><CalendarIcon className="v-icon"/><div><b>Ετήσιος έλεγχος</b><p>02 Οκτωβρίου · 10:30 · Δρ. Ελένη Παππά</p></div><button className="v-outline" onClick={()=>appointment.current?.showModal()}>Προβολή</button></div><p className="v-muted">Δεν έχουν προστεθεί ιατρικά έγγραφα σε αυτή την προεπισκόπηση.</p></section>}
          {tab === 'Προφίλ' && <section className="v-detail v-profile"><img src={photo} alt="Πορτρέτο του Μαξ"/><div><p className="v-eyebrow">ΤΟ ΚΑΤΟΙΚΙΔΙΟ ΜΟΥ</p><h2>Μαξ</h2><dl><dt>Φυλή</dt><dd>Golden Retriever</dd><dt>Ηλικία</dt><dd>3 ετών</dd><dt>Φύλο</dt><dd>Αρσενικό</dd><dt>Πόλη</dt><dd>Αθήνα</dd></dl></div></section>}
          <footer className="v-page-footer"><span>Μια καλή μέρα ξεκινά με λίγη φροντίδα.</span><a href="https://unsplash.com/photos/a-golden-retriever-is-sitting-and-smiling-for-the-camera-CLhFS67ni1c" target="_blank" rel="noreferrer">Φωτογραφία: Faber Leonardo / Unsplash ↗</a></footer>
          <p className="v-sr-only" role="status">{feedback}</p>
        </main>
        <nav className="v-mobile-nav" aria-label="Πλοήγηση κινητού">{nav()}</nav>
      </div>
    </div>
    <dialog ref={appointment} className="v-dialog" aria-label="Λεπτομέρειες ραντεβού"><form method="dialog"><button className="v-dialog-close" aria-label="Κλείσιμο">×</button></form><p className="v-eyebrow">ΤΟ ΡΑΝΤΕΒΟΥ ΤΟΥ ΜΑΞ</p><h2>Ετήσιος έλεγχος</h2><p>Παρασκευή, 2 Οκτωβρίου 2026<br/>10:30 · Δρ. Ελένη Παππά</p><div className="v-dialog-info">Δοκιμαστικό ραντεβού για την προεπισκόπηση. Δεν έχει γίνει πραγματική κράτηση.</div><button className="v-dark-button" onClick={()=>appointment.current?.close()}>Εντάξει</button></dialog>
    <dialog ref={journal} className="v-dialog" aria-label="Νέα σημείωση ημερολογίου"><form onSubmit={e=>{e.preventDefault();if(!note.trim())return;setNotes(previous=>[note.trim(),...previous]);setNote('');journal.current?.close();setTab('Ημερολόγιο');setFeedback('Η σημείωση προστέθηκε.')}}><button type="button" className="v-dialog-close" aria-label="Κλείσιμο" onClick={()=>journal.current?.close()}>×</button><p className="v-eyebrow">ΜΙΑ ΣΤΙΓΜΗ ΜΕ ΤΟΝ ΜΑΞ</p><h2>Τι κάνατε σήμερα;</h2><label htmlFor="moment">Η σημείωσή σου</label><textarea id="moment" required maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Σήμερα στη βόλτα…"/><p className="v-muted">Οι σημειώσεις μένουν μόνο σε αυτή τη δοκιμή και χάνονται με την ανανέωση.</p><button className="v-dark-button" type="submit">Προσθήκη στο ημερολόγιο <ArrowRightIcon className="v-icon"/></button></form></dialog>
  </div>
}
