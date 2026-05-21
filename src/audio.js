/* ═══════════════════════════════════════════════════════════════
   AUDIO — short notification rings via Web Audio API.

   No audio files; everything is synthesized inline. Each call
   creates a fresh AudioContext, schedules a few oscillators, then
   tears the context down after 4 seconds. iOS Safari requires a
   user gesture to resume audio, which the call sites guarantee
   (button taps in Match / Tournament).

   Wrapped in try/catch — audio is non-essential, never crash the
   UI if the browser refuses (private mode, blocked autoplay).
═══════════════════════════════════════════════════════════════ */

export const RINGS=[
  {id:'soft',label:'Sanft',desc:'Weiche Glockentöne'},
  {id:'alarm',label:'Alarm',desc:'Klassischer Wecker'},
  {id:'double',label:'Doppelton',desc:'Zwei absteigende Töne'},
  {id:'rising',label:'Aufsteigend',desc:'Vier steigende Töne'},
  {id:'whistle',label:'Schiedsrichter',desc:'Pfiff – lang kurz kurz'},
];

export function playRing(id){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const master=ctx.createGain();master.gain.value=0.65;master.connect(ctx.destination);
    const beep=(f,start,dur,vol=0.5,type='sine')=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=type;o.frequency.value=f;o.connect(g);g.connect(master);
      g.gain.setValueAtTime(0,start);
      g.gain.linearRampToValueAtTime(vol,start+0.015);
      g.gain.setValueAtTime(vol,start+dur-0.03);
      g.gain.linearRampToValueAtTime(0,start+dur);
      o.start(start);o.stop(start+dur+0.05);
    };
    if(id==='alarm') for(let i=0;i<6;i++) beep(880,i*0.18,0.12,0.5,'square');
    else if(id==='double') for(let i=0;i<3;i++){beep(880,i*0.4,0.16);beep(660,i*0.4+0.2,0.16);}
    else if(id==='rising') [523,659,784,1047].forEach((f,i)=>beep(f,i*0.2,0.18,0.5));
    else if(id==='whistle'){beep(1100,0,0.45,0.55);beep(1100,0.6,0.18,0.55);beep(1100,0.88,0.18,0.55);}
    else if(id==='soft') [0,0.65,1.3].forEach(t=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.value=528;o.connect(g);g.connect(master);
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(0.4,t+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.6);
      o.start(t);o.stop(t+0.65);
    });
    setTimeout(()=>ctx.close(),4000);
  }catch(e){console.warn('Audio:',e);}
}
