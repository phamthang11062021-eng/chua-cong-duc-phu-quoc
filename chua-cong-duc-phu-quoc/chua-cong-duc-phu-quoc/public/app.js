const socket = io();
const $ = id => document.getElementById(id);
const storedIdKey = 'biti-congduc-player-v1';
const storedProfileKey = 'biti-congduc-profile-v2';
let id = localStorage.getItem(storedIdKey);
if(!id){
  id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'player-' + Math.random().toString(36).slice(2) + Date.now();
  localStorage.setItem(storedIdKey,id);
}
let profile = {};
try { profile = JSON.parse(localStorage.getItem(storedProfileKey) || '{}'); } catch { profile = {}; }
let current = null, me = null, offset = 0, toastTimer = null, lobbyMessageCount = -1;

function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(n){return Number(n||0).toLocaleString('vi-VN');}
function toast(msg){ $('toast').textContent = msg; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').classList.remove('show'), 2200); }
function renderBoard(el, items){
  el.innerHTML = '';
  if(!items.length){ el.innerHTML = '<li class="empty">Đang chờ thí chủ đầu tiên...</li>'; return; }
  items.forEach((p,i)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span class="rank">${['🥇','🥈','🥉'][i]||'#'+(i+1)}</span><span>${escapeHtml(p.name)}</span><span class="score">${fmt(p.score)} ✦</span>`;
    el.append(li);
  });
}
function applyMe(p){
  me = p;
  $('my-name').textContent = p.name;
  $('my-score').textContent = fmt(p.score);
  $('my-rank').textContent = '#' + p.rank;
  if(current) renderQuestion(current);
}
function renderQuestion(s){
  if(!s.question) return;
  const q = s.question;
  $('quiz-place').textContent = q.place + ' · SLIDE ' + q.slide;
  $('quiz-title').textContent = q.title;
  $('quiz-prompt').textContent = q.prompt;
  const answers = $('answers');
  answers.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const b = document.createElement('button');
    b.className = 'answer';
    b.type = 'button';
    b.textContent = String.fromCharCode(65+i) + '. ' + opt;
    if(me && me.answered && me.selected === i) b.classList.add('selected');
    if(s.phase === 'reveal'){
      if(i === q.correct) b.classList.add('correct');
      else if(me && me.selected === i) b.classList.add('wrong');
    }
    b.disabled = s.phase !== 'question' || (me && me.answered);
    b.onclick = ()=>socket.emit('answer', i, r=>{
      if(r?.ok) toast('Đã ghi nhận! Cầu may mắn nha ✨');
      else toast('Hết giờ hoặc đã trả lời.');
    });
    answers.append(b);
  });
  $('reveal-fact').hidden = s.phase !== 'reveal';
  $('reveal-fact').textContent = s.phase === 'reveal' ? '📖 ' + q.fact : '';
  $('quiz-hint').textContent = s.phase === 'question'
    ? (me?.answered ? 'Đã khóa đáp án. Chờ MC công bố!' : 'Đúng: +200 đến +300 công đức. Sai: −100 công đức (không âm điểm)!')
    : 'MC sẽ dẫn sang thử thách kế tiếp.';
}
// 12 seats per page: readable even at 80 connected players, no overlapping labels.
const LOBBY_PAGE_SIZE=12;
let lobbyPage=0;
let pageChosen=false;
function createAvatar(person){
  const item=document.createElement('div');
  item.className='seated-player'+(person.id===id?' own-seat':'');
  const src='/assets/'+(person.gender==='female'?'ni-co':'su-chu')+'.svg';
  item.innerHTML=`<div class="seat-bubble${person.bubble?' active':''}">${escapeHtml(person.bubble||'')}</div><img src="${src}" alt="" loading="lazy"><div class="seat-name" title="${escapeHtml(person.name)}">${escapeHtml(person.name)}</div>`;
  return item;
}
function switchLobbyPage(direction){
 if(!current?.lobby)return;
 const total=Math.max(1,Math.ceil(current.lobby.people.length/LOBBY_PAGE_SIZE));
 lobbyPage=Math.max(0,Math.min(total-1,lobbyPage+direction));
 pageChosen=true;
 renderLobby(current.lobby);
}
function addChatMessage(m){
  const line = document.createElement('div');
  line.className = 'chat-line' + (m.system ? ' system' : '');
  if(m.system){
    line.innerHTML = `<span>🪷 ${escapeHtml(m.text)}</span>`;
  } else {
    const name = document.createElement('strong');
    name.textContent = m.name + ': ';
    const content = document.createElement('span');
    content.textContent = m.text;
    line.append(name, content);
  }
  $('chat-messages').append(line);
}
function renderLobby(lobby){
  if(!lobby)return;
  const total=lobby.people.length;
  const pages=Math.max(1,Math.ceil(total/LOBBY_PAGE_SIZE));
  // On first join, navigate to the page containing the current player's avatar.
  if(!pageChosen){
    const myIndex=lobby.people.findIndex(p=>p.id===id);
    if(myIndex>=0)lobbyPage=Math.floor(myIndex/LOBBY_PAGE_SIZE);
  }
  lobbyPage=Math.max(0,Math.min(pages-1,lobbyPage));
  const stage=$('avatar-stage');
  stage.replaceChildren(...lobby.people.slice(lobbyPage*LOBBY_PAGE_SIZE,(lobbyPage+1)*LOBBY_PAGE_SIZE).map(createAvatar));
  $('seat-page-label').textContent=`Dãy ${lobbyPage+1}/${pages} · ${Math.min(total,LOBBY_PAGE_SIZE)} chỗ đang hiển thị`;
  $('seat-prev').disabled=lobbyPage===0;
  $('seat-next').disabled=lobbyPage===pages-1;
  $('lobby-count').textContent=total+' thí chủ đang thiền · '+pages+' dãy ghế';
  $('scene-online').textContent=total+'/80';
  const roster=$('all-lobby-players');
  roster.replaceChildren(...lobby.people.map(p=>{
    const name=document.createElement('span');name.className='roster-name'+(p.id===id?' self':'');name.textContent=p.name;return name;
  }));
  const messages=$('chat-messages');
  const last=lobby.messages[lobby.messages.length-1];
  const signature=lobby.messages.length+'-'+(last?.at||0)+'-'+(last?.text||'');
  if(signature!==lobbyMessageCount){
    lobbyMessageCount=signature;
    messages.replaceChildren();
    if(!lobby.messages.length){const empty=document.createElement('div');empty.className='chat-empty';empty.textContent='Chưa ai lên tiếng. Chào cả lớp đi nè 👋';messages.append(empty);}
    lobby.messages.forEach(addChatMessage);
    messages.scrollTop=messages.scrollHeight;
  }
  $('chat-input').disabled=!!lobby.chatLocked;
  $('chat-send').disabled=!!lobby.chatLocked;
  $('chat-input').placeholder=lobby.chatLocked?'MC đã khóa chat':'Nhắn gì đó với cả lớp...';
}
function ceremonyArt(kind,i){
 const art=kind==='winner'?['dao-to.svg','chan-nhan.svg','tien-tu.svg']:['yeu-vuong.svg','hau-vuong.svg','pham-nhan.svg'];
 return '/assets/phong-than/'+art[i];
}
function renderCeremony(data){
 const win=$('ceremony-winners'),lose=$('ceremony-trials');if(!data)return;
 const card=(p,i,kind)=>`<article class="ascension-card ${kind} tier-${i+1}"><div class="ascension-portrait"><img src="${ceremonyArt(kind,i)}" alt="Tranh nhân vật ${escapeHtml(p.title)}"><span class="portrait-spark">✦</span></div><div class="ascension-body"><div class="ascension-rank">HẠNG #${p.rank} · ${fmt(p.score)} CÔNG ĐỨC</div><strong>${escapeHtml(p.title)}</strong><div class="ascension-player">${escapeHtml(p.name)}</div>${kind==='trial'?`<p>${escapeHtml(p.task||'')}</p>`:'<p>✨ Phi thăng thành công!</p>'}</div></article>`;
 win.innerHTML=data.best.map((p,i)=>card(p,i,'winner')).join('');
 lose.innerHTML=data.worst.length?data.worst.map((p,i)=>card(p,i,'trial')).join(''):'<div class="ceremony-card"><strong>Chưa đủ 6 người để xếp Bottom 3.</strong></div>';
}
function renderState(s){
  current = s;
  offset = s.now - Date.now();
  $('player-count').textContent = `${s.count} thí chủ`;
  $('phase-label').textContent = ({lobby:'Thiền đường đang chờ khai hội',question:'Đang vượt ải câu hỏi',reveal:'MC đang công bố đáp án',finished:'Đã khép lại hội công đức',ceremony:'Đang phong thần cuối game'})[s.phase];
  $('phase-round').textContent = s.phase === 'question' || s.phase === 'reveal' ? `Câu ${s.round+1}/${s.totalRounds}` : `${s.totalRounds} thử thách`;
  $('online').textContent = `${s.count} người đang online`;
  renderBoard($('leaderboard'), s.leaderboard || []);
  $('lobby-panel').hidden = s.phase !== 'lobby';
  $('quiz-panel').hidden = !(s.phase === 'question' || s.phase === 'reveal');
  $('final-panel').hidden = s.phase !== 'finished';
  $('ceremony-panel').hidden = s.phase !== 'ceremony';
  if(s.phase === 'lobby') renderLobby(s.lobby);
  if(s.phase === 'question' || s.phase === 'reveal') renderQuestion(s);
  if(s.phase === 'finished') $('final-summary').textContent = `MC đã kết thúc. Tổng cộng ${s.count} thí chủ đã tham gia cuộc đua công đức.`;
  if(s.phase === 'ceremony') renderCeremony(s.ceremony);
}

$('seat-prev').addEventListener('click',()=>switchLobbyPage(-1));
$('seat-next').addEventListener('click',()=>switchLobbyPage(1));
$('join-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('nickname').value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
  $('join-error').textContent = '';
  socket.emit('join', {id,name,gender}, res => {
    if(res?.ok){
      profile = {name, gender};
      localStorage.setItem(storedProfileKey, JSON.stringify(profile));
      $('join-view').hidden = true;
      $('play-view').hidden = false;
      toast('Đã bước vào thiền đường 🪷');
    } else $('join-error').textContent = res?.error || 'Không thể tham gia';
  });
});
$('chat-form').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('chat-input').value.trim();
  if(!text) return;
  socket.emit('lobby:chat', text, res => {
    if(res?.ok){ $('chat-input').value = ''; }
    else toast(res?.error || 'Không gửi được tin nhắn');
  });
});

socket.on('state', s => {
  renderState(s);
  if(!$('play-view').hidden || (profile.name && !($('join-view').hidden))){
    // allow page refresh to auto-rejoin with saved profile
  }
});
socket.on('me', applyMe);
// Chat history and bubbles are rendered from authoritative state updates.
// Avoid also appending lobby:message, which previously duplicated chat messages.
socket.on('connect', () => {
  $('online').textContent = 'Đã kết nối';
  if(profile.name){
    socket.emit('join', {id, name:profile.name, gender:profile.gender || 'male'}, res => {
      if(res?.ok){ $('join-view').hidden = true; $('play-view').hidden = false; }
    });
  }
});
socket.on('disconnect', () => $('online').textContent = 'Mất kết nối...');
setInterval(()=>{
  if(current?.phase === 'question' && current.deadline){
    $('countdown').textContent = Math.ceil(Math.max(0,current.deadline-(Date.now()+offset))/1000)+'s';
  } else $('countdown').textContent = '—';
}, 250);
if(profile.name){ $('nickname').value = profile.name; const el = document.querySelector(`input[name="gender"][value="${profile.gender || 'male'}"]`); if(el) el.checked = true; }
