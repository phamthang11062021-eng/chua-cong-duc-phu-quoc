/* V9 - original meditative audio file and optional Vietnamese name announcements.
   Browser requires user click for both audio and speech; screen uses this only. */
(()=>{
 'use strict';
 const isScreen=location.pathname.replace(/\/$/,'')==='/screen';
 const music=document.createElement('button');
 music.type='button';music.className='meditation-audio-toggle';
 music.textContent=isScreen?'♫ Bật nhạc thiền + xướng tên':'♫ Bật nhạc thiền';
 music.setAttribute('aria-pressed','false');
 music.title='Bấm để cho phép trình duyệt phát âm thanh';
 document.body.append(music);
 const audio=new Audio('/meditation-original.mp3?v=9.0.0');
 audio.loop=true; audio.preload='auto'; audio.volume=.55;
 let on=false, voiceOn=false, speaking=false;
 const queue=[];
 let currentPhase='lobby';
 function cancelSpeech(){queue.length=0;speaking=false;if('speechSynthesis' in window)window.speechSynthesis.cancel();}
 function nextSpeech(){
   if(!isScreen||!on||!voiceOn||speaking||currentPhase!=='lobby'||!queue.length)return;
   if(!('speechSynthesis' in window))return;
   const name=queue.shift();
   const utterance=new SpeechSynthesisUtterance('Chào mừng thí chủ '+name+' đến với thiền đường!');
   utterance.lang='vi-VN'; utterance.rate=1.12; utterance.pitch=1.06;utterance.volume=.95;
   const voices=window.speechSynthesis.getVoices();
   const vi=voices.find(v=>v.lang.toLowerCase()==='vi-vn')||voices.find(v=>v.lang.toLowerCase().startsWith('vi'));
   if(vi)utterance.voice=vi;
   speaking=true;
   utterance.onend=utterance.onerror=()=>{speaking=false;setTimeout(nextSpeech,220);};
   try{window.speechSynthesis.speak(utterance);}catch(e){speaking=false;}
 }
 music.addEventListener('click',async()=>{
   if(on){on=false;voiceOn=false;audio.pause();cancelSpeech();music.textContent=isScreen?'♫ Bật nhạc thiền + xướng tên':'♫ Bật nhạc thiền';music.setAttribute('aria-pressed','false');return;}
   try {
     await audio.play();
     on=true;voiceOn=isScreen;
     music.setAttribute('aria-pressed','true');
     music.textContent=isScreen?'♫ Tắt nhạc và xướng tên':'♫ Tắt nhạc thiền';
     if(isScreen && !('speechSynthesis' in window))music.title='Trình duyệt không hỗ trợ đọc tên; nhạc thiền vẫn chạy';
     nextSpeech();
   }catch(err){music.textContent='⚠ Nhấn lại để bật nhạc';music.title='Trình duyệt đã chặn phát nhạc: '+err.message;}
 });
 audio.addEventListener('error',()=>{music.textContent='⚠ Không tải được nhạc';});
 if(isScreen){
   // Wait for main screen script to provide socket and lobby updates.
   document.addEventListener('lobby:new-join',e=>{
     if(!on||!voiceOn||currentPhase!=='lobby')return;
     const name=String(e.detail?.name||'').trim().slice(0,24);
     if(!name)return;
     queue.push(name);
     nextSpeech();
   });
   document.addEventListener('lobby:phase',e=>{
     const next=e.detail?.phase||'lobby';
     if(next!=='lobby'&&currentPhase==='lobby')cancelSpeech();
     currentPhase=next;
   });
 }
})();
