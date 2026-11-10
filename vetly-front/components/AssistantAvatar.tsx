/**
 * Vetly's assistant mascot, from the brand avatar pack (public/branding/assistant):
 * a floppy dog ear, a pointed cat ear and a clinic tag. The four pack states are
 * layered here so the parts can move on their own: it breathes, blinks, glances
 * and twitches an ear (keyframes in globals.css, off under prefers-reduced-motion).
 * `mood="thinking"` looks up and talks while a reply is written; `animated={false}`
 * keeps it still; `framed` sits it inside a pale round badge for small sizes.
 */
export function AssistantAvatar({ size = 36, className = '', mood = 'idle', animated = true, framed = true }: { size?: number; className?: string; mood?: 'idle' | 'thinking'; animated?: boolean; framed?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 1024 1024" data-mood={mood} className={`${animated ? 'assistant-avatar' : ''} shrink-0 ${className}`} aria-hidden="true">
    {framed && <circle cx="512" cy="512" r="512" fill="#def5ed" />}
    <g transform={framed ? 'translate(512 530) scale(0.8) translate(-512 -512)' : undefined}>
      <path fill="#006064" d="M205 940 Q235 830 350 803 H674 Q789 830 819 940 Q825 962 802 962 H222 Q199 962 205 940Z" />
      <path fill="#004E52" d="M340 750 H684 V838 Q512 891 340 838Z" />
      <g className="aa-head">
        <path className="aa-ear-cat" fill="#004E52" d="M640 219 L867 82 Q902 61 916 103 Q945 232 867 428Z" />
        <ellipse cx="512" cy="492" rx="350" ry="325" fill="#006064" />
        <path className="aa-ear-dog" fill="#004E52" d="M386 199 Q331 141 250 175 Q151 220 83 345 Q17 472 39 529 Q61 578 114 562 Q175 539 208 455 L268 327 Q300 255 365 243 Q407 235 386 199Z" />
        <path fill="#DEF5ED" d="M411 524 Q512 459 613 524 C788 509 814 671 729 742 C635 828 393 828 295 742 C209 671 235 509 411 524Z" />
        <path fill="#002E32" d="M463 537 Q512 518 561 537 Q583 547 565 572 L537 603 Q512 628 487 603 L459 572 Q441 547 463 537Z" />
        <g className="aa-eyes-open" fill="#002E32">
          <ellipse cx="363" cy="437" rx="55" ry="58" />
          <ellipse cx="661" cy="437" rx="55" ry="58" />
          <g className="aa-highlights" fill="#fff"><circle cx="380" cy="415" r="15" /><circle cx="678" cy="415" r="15" /></g>
        </g>
        <g className="aa-eyes-closed" opacity="0" fill="none" stroke="#002E32" strokeWidth="24" strokeLinecap="round">
          <path d="M318 437 Q363 488 408 437" />
          <path d="M616 437 Q661 488 706 437" />
        </g>
        <path className="aa-mouth-smile" d="M425 651 Q512 733 599 651" fill="none" stroke="#002E32" strokeWidth="27" strokeLinecap="round" />
        <path className="aa-mouth-open" opacity="0" fill="#002E32" d="M434 642 H590 Q608 642 601 665 Q581 729 512 729 Q443 729 423 665 Q416 642 434 642Z" />
      </g>
      <g className="aa-tag">
        <circle cx="512" cy="886" r="70" fill="#4CC9A6" />
        <path fill="#fff" d="M500 848 H524 V874 H550 V898 H524 V924 H500 V898 H474 V874 H500Z" />
      </g>
    </g>
  </svg>;
}
