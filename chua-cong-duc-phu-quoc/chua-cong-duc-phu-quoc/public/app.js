/* Players: server is the authority for time, score and correct answers. */
const socket=io();
const $=id=>document.getElementById(id);
const storedKey='biti-congduc-player-v1';
let id=localStorage.getItem(storedKey);
if(!id){id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'player-'+Math.random().toString(36).slice(2)+Date.now();localStorage.setItem(storedKey,id);}
let current=null,me=null,offset=0,toastTimer=null,audio=null;
function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(n){return Number(n||0).toLocaleString('vi-VN');}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2000);}
function sound(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(460,t);o.frequency.exponentialRampToValueAtTime(200,t+.11);g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.19);}catch(e){}}
function renderBoard(el,items){el.innerHTML='';if(!items.length){el.innerHTML='<li class="empty">Đang chờ thí chủ đầu tiên...</li>';return;}items.forEach((p,i)=>{const li=document.createElement('li');li.innerHTML=`<span class="rank">${['🥇','🥈','🥉'][i]||'#'+(i+1)}</span><span>${escapeHtml(p.name)}</span><span class="score">${fmt(p.score)} ✦</span>`;el.append(li);});}
function applyMe(p){me=p;$('my-name').textContent=p.name;$('my-score').textContent=fmt(p.score);$('my-rank').textContent='#'+p.rank;$('tap-count').textContent=p.taps+'/200';if(current)renderQuestion(current);}
function renderQuestion(s){
 if(!s.question)return;
 const q=s.question;$('quiz-place').textContent=q.place+' · SLIDE '+q.slide;$('quiz-title').textContent=q.title;$('quiz-prompt').textContent=q.prompt;
 const answers=$('answers');answers.innerHTML='';q.options.forEach((opt,i)=>{
 const b=document.createElement('button');b.className='answer';b.type='button';b.textContent=String.fromCharCode(65+i)+'. '+opt;
 if(me&&me.answered&&me.selected===i)b.classList.add('selected');
 if(s.phase==='reveal'){if(i===q.correct)b.classList.add('correct');else if(me&&me.selected===i)b.classList.add('wrong');}
 b.disabled=s.phase!=='question'||(me&&me.answered);
 b.onclick=()=>socket.emit('answer',i,r=>{if(r?.ok)toast('Đã ghi nhận! Cầu may mắn nha ✨');else toast('Hết giờ hoặc đã trả lời.');});answers.append(b);
 });
 $('reveal-fact').hidden=s.phase!=='reveal';$('reveal-fact').textContent=s.phase==='reveal'?'📖 '+q.fact:'';
 $('quiz-hint').textContent=s.phase==='question'?(me?.answered?'Đã khóa đáp án. Chờ MC công bố!':'Chọn đáp án đúng và nhanh để nhận tối đa 300 công đức!'):'MC sẽ dẫn sang thử thách kế tiếp.';
}
function render(s){
 const previous=current;current=s;offset=s.now-Date.now();
 $('online').textContent=s.count+' thí chủ trong chùa';$('phase-round').textContent=s.round>=0?`Câu ${s.round+1}/${s.totalRounds}`:`${s.totalRounds} thử thách`;
 const status={lobby:'Cổng chùa đang mở • Chờ MC',tapping:'🔔 ĐANG MỞ GÕ MÕ',question:'🧩 THỬ THÁCH KIẾN THỨC',reveal:'💡 CÔNG BỐ ĐÁP ÁN',finished:'🏆 HỘI CÔNG ĐỨC KẾT THÚC'};
 $('phase-label').textContent=status[s.phase];$('total-taps').textContent=fmt(s.globalTaps);$('player-count').textContent=s.count+' thí chủ';renderBoard($('leaderboard'),s.leaderboard);
 const playing=!$('play-view').hidden;if(!playing)return;
 $('tap-panel').hidden=s.phase==='question'||s.phase==='reveal'||s.phase==='finished';$('quiz-panel').hidden=!['question','reveal'].includes(s.phase);$('final-panel').hidden=s.phase!=='finished';
 $('woodblock').disabled=s.phase!=='tapping'||(me&&me.taps>=200);
 $('tap-heading').textContent=s.phase==='lobby'?'Chờ MC khai hội':'Gõ mõ, gom phước, vượt deadline!';
 $('tap-help').textContent=s.phase==='lobby'?'MC sẽ mở vòng gõ mõ khi mọi người đã vào đủ.':'Mỗi lần gõ +1 công đức; tối đa 200 lần, giới hạn 5 lần/giây.';
 if(s.question)renderQuestion(s);
 if(s.phase==='finished')$('final-summary').textContent=`Bạn tích được ${fmt(me?.score)} công đức, hạng #${me?.rank||'—'}. Cảm ơn đã đồng hành cùng BITI TOURIST!`;
 if(previous&&previous.phase!==s.phase&&s.phase==='question')toast('🔔 Nhiệm vụ mới đã mở!');
}
function tick(){if(!current||current.phase!=='question'||!current.deadline)return;const ms=Math.max(0,current.deadline-(Date.now()+offset));$('countdown').textContent=Math.ceil(ms/1000)+'s';}
setInterval(tick,200);
function join(name){socket.emit('join',{name,id},r=>{if(!r?.ok){$('join-error').textContent=r?.error||'Không thể vào phòng';return;}localStorage.setItem('biti-congduc-name',name);$('join-view').hidden=true;$('play-view').hidden=false;if(current)render(current);});}
$('join-form').addEventListener('submit',e=>{e.preventDefault();join($('nickname').value.trim());});
$('nickname').value=localStorage.getItem('biti-congduc-name')||'';
socket.on('connect',()=>{const name=localStorage.getItem('biti-congduc-name');if(name&&$('join-view').hidden)join(name);});
socket.on('state',render);socket.on('me',applyMe);
socket.on('disconnect',()=>{$('online').textContent='Mất kết nối • Đang thử lại...';});
$('woodblock').addEventListener('click',()=>{if(!current||current.phase!=='tapping'||me?.taps>=200)return;sound();$('woodblock').classList.remove('hit');void $('woodblock').offsetWidth;$('woodblock').classList.add('hit');socket.emit('tap');});
