/* Players: server is the authority for time, score and correct answers. */
const socket=io();
const $=id=>document.getElementById(id);
const storedKey='biti-congduc-player-v1';
let id=localStorage.getItem(storedKey);
if(!id){id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'player-'+Math.random().toString(36).slice(2)+Date.now();localStorage.setItem(storedKey,id);}
let current=null,me=null,offset=0,toastTimer=null,audio=null;
let lobbyMessageCount=-1;
function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(n){return Number(n||0).toLocaleString('vi-VN');}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2000);}
function renderBoard(el,items){el.innerHTML='';if(!items.length){el.innerHTML='<li class="empty">Đang chờ thí chủ đầu tiên...</li>';return;}items.forEach((p,i)=>{const li=document.createElement('li');li.innerHTML=`<span class="rank">${['🥇','🥈','🥉'][i]||'#'+(i+1)}</span><span>${escapeHtml(p.name)}</span><span class="score">${fmt(p.score)} ✦</span>`;el.append(li);});}
function applyMe(p){me=p;$('my-name').textContent=p.name;$('my-score').textContent=fmt(p.score);$('my-rank').textContent='#'+p.rank;if(current)renderQuestion(current);}
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
 $('quiz-hint').textContent=s.phase==='question'?(me?.answered?'Đã khóa đáp án. Chờ MC công bố!':'Đúng: +200 đến +300 công đức. Sai: −100 công đức (không âm điểm)!'):'MC sẽ dẫn sang thử thách kế tiếp.';
}
function renderLobby(lobby){
 if(!lobby)return;
 const people=$('meditators');people.innerHTML='';
 lobby.people.forEach((p,i)=>{
  const item=document.createElement('div');item.className='meditator';item.style.setProperty('--delay',(i%12)*.07+'s');
  const icon=document.createElement('span');icon.className='meditator-icon';icon.textContent=['🧘','🧘🏻','🧘🏽','🧘🏾','🧘🏼','🧘🏿','🧘','🧘'][p.seat]||'🧘';
  const name=document.createElement('span');name.className='meditator-name';name.textContent=p.name;
  item.append(icon,name);people.append(item);
 });
 $('lobby-count').textContent=lobby.people.length+' thí chủ đang ngồi thiền';
 const messages=$('chat-messages');
 if(lobby.messages.length!==lobbyMessageCount){
  lobbyMessageCount=lobby.messages.length;messages.innerHTML='';
  if(!lobby.messages.length){const empty=document.createElement('div');empty.className='chat-empty';empty.textContent='Chưa có lời chào nào. Mở hàng đi thí chủ ơi! 👋';messages.append(empty);}
  lobby.messages.forEach(addChatMessage);
  messages.scrollTop=messages.scrollHeight;
 }
 $('chat-input').disabled=!!lobby.chatLocked;
 $('chat-send').disabled=!!lobby.chatLocked;
 $('chat-input').placeholder=lobby.chatLocked?'MC đã tạm khóa chat':'Nói gì đó với cả lớp...';
}
function addChatMessage(m){
 const line=document.createElement('div');line.className='chat-line';
 const name=document.createElement('strong');name.textContent=m.name+': ';
 const content=document.createElement('span');content.textContent=m.text;
 line.append(name,content);$('chat-messages').append(line);
}
function renderCeremony(data){
 const win=$('ceremony-winners'),lose=$('ceremony-trials');if(!data)return;
 const rewards=['🥇','🥈','🥉'],trials=['👻','🐒','🥲'];
 const row=(p,emoji,detail)=>`<div class="ceremony-card"><div class="ceremony-emoji">${emoji}</div><div class="ceremony-info"><div class="ceremony-rank">HẠNG #${p.rank} · ${fmt(p.score)} CÔNG ĐỨC</div><strong>${escapeHtml(p.title)}</strong><div class="ceremony-player">${escapeHtml(p.name)}</div>${detail?`<p>${escapeHtml(detail)}</p>`:''}</div></div>`;
 win.innerHTML=data.best.map((p,i)=>row(p,rewards[i],'')).join('');
 lose.innerHTML=data.worst.length?data.worst.map((p,i)=>row(p,trials[i],p.task)).join(''):'<p>Ít hơn 6 thí chủ tham gia, không công bố bảng cuối để tránh trùng Top 3.</p>';
}
function render(s){
 const previous=current;current=s;offset=s.now-Date.now();
 $('online').textContent=s.count+' thí chủ trong chùa';$('phase-round').textContent=s.round>=0?`Câu ${s.round+1}/${s.totalRounds}`:`${s.totalRounds} thử thách`;
 const status={lobby:'Cổng chùa đang mở • Chờ MC',question:'🧩 THỬ THÁCH KIẾN THỨC',reveal:'💡 CÔNG BỐ ĐÁP ÁN',finished:'🏆 HỘI CÔNG ĐỨC KẾT THÚC',ceremony:'✨ ĐẠI HỘI PHONG THẦN'};
 $('phase-label').textContent=status[s.phase];$('player-count').textContent=s.count+' thí chủ';renderBoard($('leaderboard'),s.leaderboard);
 const playing=!$('play-view').hidden;if(!playing)return;
 $('lobby-panel').hidden=s.phase!=='lobby';if(s.phase==='lobby')renderLobby(s.lobby); $('quiz-panel').hidden=!['question','reveal'].includes(s.phase);$('final-panel').hidden=!['finished','ceremony'].includes(s.phase);$('ceremony-panel').hidden=s.phase!=='ceremony';if(s.phase==='ceremony')renderCeremony(s.ceremony);
 if(s.question)renderQuestion(s);
 if(['finished','ceremony'].includes(s.phase))$('final-summary').textContent=`Bạn tích được ${fmt(me?.score)} công đức, hạng #${me?.rank||'—'}. Cảm ơn đã đồng hành cùng BITI TOURIST!`;
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

$('chat-form').addEventListener('submit',e=>{
 e.preventDefault();const input=$('chat-input'),msg=input.value.trim();if(!msg)return;
 socket.emit('lobby:chat',msg,r=>{if(r?.ok){input.value='';input.focus();}else toast(r?.error||'Không gửi được tin nhắn');});
});
socket.on('lobby:message',m=>{
 if(current?.phase!=='lobby'||$('play-view').hidden)return;
 addChatMessage(m);lobbyMessageCount++;
 const chat=$('chat-messages');while(chat.children.length>50)chat.firstElementChild.remove();chat.scrollTop=chat.scrollHeight;
});
