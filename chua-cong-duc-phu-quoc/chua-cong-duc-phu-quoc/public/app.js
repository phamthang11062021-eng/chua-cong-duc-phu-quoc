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
function getSeatLayout(total){
  const capacities = [6,8,10,12,14,16,18];
  const positions = [];
  let left = total;
  let row = 0;
  while(left > 0 && row < capacities.length){
    const count = Math.min(left, capacities[row]);
    positions.push(count);
    left -= count;
    row++;
  }
  while(left > 0){
    positions.push(Math.min(left, 18));
    left -= 18;
  }
  const result = [];
  const rows = positions.length;
  positions.forEach((count, rowIndex)=>{
    const progress = rowIndex / Math.max(1, rows - 1 || 1);
    const y = 24 + progress * 54;
    const scale = 0.56 + progress * 0.58;
    for(let i=0;i<count;i++){
      const x = 8 + ((i+0.5)/count) * 84;
      const jitter = ((i%2)?1:-1) * (rowIndex%2?0.8:0.2);
      result.push({x: Math.max(6, Math.min(94, x + jitter)), y, scale});
    }
  });
  return result;
}
function createAvatar(person, pos, idx){
  const wrap = document.createElement('div');
  wrap.className = 'avatar-wrap' + (person.id === id ? ' me' : '');
  wrap.style.setProperty('--x', pos.x + '%');
  wrap.style.setProperty('--y', pos.y + '%');
  wrap.style.setProperty('--scale', pos.scale);
  wrap.style.zIndex = String(Math.round(pos.y * 10));
  wrap.innerHTML = `
    <div class="avatar-name">${escapeHtml(person.name)}</div>
    <div class="chat-bubble${person.bubble ? ' show' : ''}">${escapeHtml(person.bubble || '')}</div>
    <div class="chibi ${person.gender === 'female' ? 'nun' : 'monk'}">
      <div class="avatar-head"></div>
      <div class="avatar-body"></div>
      <div class="avatar-arms"></div>
      <div class="avatar-seat"></div>
    </div>`;
  return wrap;
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
  if(!lobby) return;
  const stage = $('avatar-stage');
  stage.innerHTML = '';
  const layout = getSeatLayout(lobby.people.length);
  lobby.people.forEach((p,i)=> stage.append(createAvatar(p, layout[i] || {x:50,y:60,scale:1}, i)));
  $('lobby-count').textContent = lobby.people.length + ' thí chủ đang ngồi thiền';

  const messages = $('chat-messages');
  if(lobby.messages.length !== lobbyMessageCount){
    lobbyMessageCount = lobby.messages.length;
    messages.innerHTML = '';
    if(!lobby.messages.length){
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.textContent = 'Chưa ai lên tiếng. Chào cả lớp đi nè 👋';
      messages.append(empty);
    }
    lobby.messages.forEach(addChatMessage);
    messages.scrollTop = messages.scrollHeight;
  }
  $('chat-input').disabled = !!lobby.chatLocked;
  $('chat-send').disabled = !!lobby.chatLocked;
  $('chat-input').placeholder = lobby.chatLocked ? 'MC đã tạm khóa chat' : 'Gửi lời nhắn cho cả thiền đường...';
}
function renderCeremony(data){
  const win = $('ceremony-winners'), lose = $('ceremony-trials');
  if(!data) return;
  const rewards = ['🥇','🥈','🥉'], trials = ['👻','🐒','🥲'];
  const row = (p,emoji,detail)=>`<div class="ceremony-card"><div class="ceremony-emoji">${emoji}</div><div class="ceremony-info"><div class="ceremony-rank">HẠNG #${p.rank} · ${fmt(p.score)} CÔNG ĐỨC</div><strong>${escapeHtml(p.title)}</strong><div class="ceremony-player">${escapeHtml(p.name)}</div>${detail ? `<p>${escapeHtml(detail)}</p>` : ''}</div></div>`;
  win.innerHTML = data.best.map((p,i)=>row(p,rewards[i],'Công đức vô lượng, xứng đáng phi thăng!')).join('');
  lose.innerHTML = data.worst.length ? data.worst.map((p,i)=>row(p,trials[i],p.task)).join('') : '<div class="ceremony-card"><div class="ceremony-info"><strong>Chưa đủ người để xếp Bottom 3.</strong></div></div>';
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
socket.on('lobby:message', m => {
  if(current?.phase !== 'lobby') return;
  const messages = $('chat-messages');
  if(messages.querySelector('.chat-empty')) messages.innerHTML = '';
  addChatMessage(m); lobbyMessageCount += 1; messages.scrollTop = messages.scrollHeight;
});
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
