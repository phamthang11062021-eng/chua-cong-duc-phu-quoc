/* V8 original procedural meditation ambience: no third-party audio or copyrighted melody.
   Browser audio always starts only after a user's click. */
(()=>{
 'use strict';
 const button=document.createElement('button');
 button.type='button';button.className='meditation-audio-toggle';
 button.setAttribute('aria-label','Bật hoặc tắt nhạc thiền');
 button.setAttribute('aria-pressed','false');
 button.textContent='♪ Bật nhạc thiền';
 document.body.append(button);
 let context=null, master=null, running=false, scheduler=null, nextBell=0, nextFlute=0, phrase=0;
 const notes=[293.66,329.63,392,440,392,329.63,261.63,293.66,349.23,392,329.63,293.66]; // original quiet pentatonic-like phrase
 function softTone(freq,start,duration,volume,kind='sine'){
  if(!context||!master)return;
  const osc=context.createOscillator(), gain=context.createGain();
  osc.type=kind;osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+Math.min(.4,duration*.18));
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.05);
 }
 function bell(t,freq=523.25){
  softTone(freq,t,5.6,.042);
  softTone(freq*2.01,t,3.4,.009);
  softTone(freq*3.94,t,2,.003);
 }
 function schedule(){
  if(!running||!context)return;
  const now=context.currentTime;
  while(nextBell<now+1.8){bell(nextBell,phrase%4===0?392:523.25);nextBell+=16;}
  while(nextFlute<now+1.8){
   let f=notes[phrase%notes.length];
   softTone(f,nextFlute,3.6,.012,'sine');
   softTone(f*.5,nextFlute,4.4,.003,'triangle');
   phrase++;nextFlute+=5.2;
  }
 }
 async function start(){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx){button.textContent='Trình duyệt không hỗ trợ âm thanh';button.disabled=true;return;}
  try{
   if(!context){
    context=new Ctx();master=context.createGain();master.gain.value=.27;
    master.connect(context.destination);
   }
   await context.resume();
   running=true;nextBell=context.currentTime+.2;nextFlute=context.currentTime+1;
   scheduler=setInterval(schedule,450);schedule();
   button.textContent='♫ Tắt nhạc thiền';button.setAttribute('aria-pressed','true');
  }catch(e){button.textContent='♪ Bật nhạc thiền';}
 }
 async function stop(){
  running=false;clearInterval(scheduler);scheduler=null;
  if(context && context.state==='running')await context.suspend();
  button.textContent='♪ Bật nhạc thiền';button.setAttribute('aria-pressed','false');
 }
 button.addEventListener('click',()=>{if(running)stop();else start();});
 window.addEventListener('pagehide',()=>{if(context){running=false;clearInterval(scheduler);context.close().catch(()=>{});context=null;}});
})();
