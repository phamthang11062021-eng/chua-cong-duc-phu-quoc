const socket=io();const $=id=>document.getElementById(id);let state=null,offset=0,lastRevision=-1;
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(x){return Number(x||0).toLocaleString('vi-VN');}
function podium(p,i){
 const titles=['ĐẠO TỔ PHÚ QUỐC','CHÂN NHÂN HỘ QUỐC','TIÊN TỬ GRAND WORLD'];
 const arts=['dao-to.svg','chan-nhan.svg','tien-tu.svg'];
 const tier=i+1;
 return `<article class="sky-winner sky-rank-${tier}"><span class="sky-crown">${['✦ HẠNG NHẤT ✦','HẠNG NHÌ','HẠNG BA'][i]}</span><div class="sky-aura"><img src="/assets/phong-than/${arts[i]}" alt="Nhân vật ${safe(p.title||titles[i])}"></div><div class="sky-rank-number">${tier}</div><div class="sky-name">${safe(p.name)}</div><div class="sky-title">${safe(p.title||titles[i])}</div><div class="sky-score">${fmt(p.score)} công đức</div><div class="sky-plinth"></div></article>`;
}
function trial(p,i){const imgs=['yeu-vuong.svg','hau-vuong.svg','pham-nhan.svg'];return `<div class="trial-card"><div class="trial-art"><img src="/assets/phong-than/${imgs[i]}" alt="Nhân vật kiếp nạn"></div><div><div class="rank-small">HẠNG #${p.rank} · ${fmt(p.score)} CÔNG ĐỨC</div><div class="rank-title">${safe(p.title)}</div><div class="rank-name">${safe(p.name)}</div><div class="task">${safe(p.task||'')}</div></div></div>`;}
function render(s){
  state=s;offset=s.now-Date.now();document.dispatchEvent(new CustomEvent('lobby:phase',{detail:{phase:s.phase}}));$('screen-people').textContent=`${s.onlineCount ?? (s.lobby?.people?.length ?? s.count)}/80`; const names={lobby:'SẢNH CHỜ',question:'THỬ THÁCH',reveal:'CÔNG BỐ ĐÁP ÁN',finished:'KẾT THÚC',ceremony:'ĐẠI HỘI PHONG THẦN'};$('screen-state').textContent=names[s.phase]||'ĐANG CHỜ';
  if(lastRevision===s.revision)return;lastRevision=s.revision;
  const stage=$('screen-content');stage.className='stage '+s.phase;
  if(s.phase==='lobby'){
    const lobby=s.lobby||{people:[],messages:[],chatLocked:false};
    const people=lobby.people||[];
    const rows=Array.from({length:80},(_,i)=>people[i]||null);
    // Show up to 3 recent speech bubbles at a time so the 80-seat view remains readable.
    const chatters=new Set((lobby.messages||[]).filter(m=>!m.system).slice(-3).map(m=>m.id));
    const visibleBubbles=new Set(people.filter(p=>p.bubble&&chatters.has(p.id)).map(p=>p.id));
    const seats=rows.map((p,i)=>{
      if(!p)return `<div class="projector-seat empty-seat"><span class="empty-cushion"></span></div>`;
      const gender=p.gender==='female'?'ni-co':'su-chu';
      const talk=visibleBubbles.has(p.id)?`<div class="projector-speech" title="${safe(p.bubble)}">${safe(p.bubble)}</div>`:'';
      return `<div class="projector-seat ${talk?'talking':''}" title="${safe(p.name)}${p.bubble?' — '+safe(p.bubble):''}">${talk}<img src="/assets/${gender}.svg" alt="" loading="eager"><div class="projector-name">${safe(p.name)}</div></div>`;
    }).join('');
    const recentChat=(lobby.messages||[]).filter(m=>!m.system).slice(-5);
    const chatItems=recentChat.length?recentChat.map(m=>`<div class="projector-chat-item"><b>${safe(m.name)}</b><span>${safe(m.text)}</span></div>`).join(''):'<p class="projector-empty-chat">Chưa có lời chào nào. Cùng thiền và chờ khai hội nha!</p>';
    stage.innerHTML=`<section class="projector-lobby"><div class="projector-aside"><div class="projector-aside-heading">✦ THIỀN ĐƯỜNG</div><h1>Chờ khai hội</h1><p class="projector-subtitle">Cùng ngồi thiền · Chờ MC mở thử thách</p><div class="projector-join"><img src="/join-qr.svg" alt="QR vào game"><span>Quét mã để vào chùa<small>${safe(location.host)}</small></span></div><div class="projector-count"><strong>${people.length}<small> / 80</small></strong><span>đang online<small>${s.count} người đã ghi danh</small></span></div><div class="projector-chat"><div class="projector-chat-title">💬 Chat chung <small>${lobby.chatLocked?'MC đang khóa chat':'Tin nhắn mới nhất'}</small></div><div class="projector-chat-feed">${chatItems}</div></div></div><div class="projector-hall"><div class="projector-hall-title"><span>✦ SÂN CHÙA PHÚ QUỐC</span><span>80 CHỖ NGỒI · 1 MÀN HÌNH</span></div><div class="projector-hall-backdrop"><div class="projector-altar" aria-hidden="true"></div><div class="projector-seats">${seats}</div></div><div class="projector-hall-caption">Mỗi ô là một thí chủ · Tin nhắn hiện trên đầu nhân vật và trong khung chat</div></div></section>`;
  } else if(s.question){
    const q=s.question;
    stage.innerHTML=`<section class="question-scene"><div class="question-header"><div class="kicker">CỬA ẢI ${s.round+1}/${s.totalRounds} · ${safe(q.place)} · SLIDE ${q.slide}</div><div class="clock" id="projector-clock">20</div></div><h1>${safe(q.prompt)}</h1><div class="options">${q.options.map((v,i)=>`<div class="option ${s.phase==='reveal' && i===q.correct?'correct':''} ${s.phase==='reveal' && i!==q.correct?'muted':''}"><span class="letter">${'ABCD'[i]}</span><span>${safe(v)}</span>${s.phase==='reveal'&&i===q.correct?'<b class="tick">✓</b>':''}</div>`).join('')}</div>${s.phase==='reveal'?`<div class="fact">📖 ${safe(q.fact)}</div>`:'<div class="answer-note">Hãy chọn đáp án trên điện thoại của bạn</div>'}</section>`;
  } else if(s.phase==='finished'){
    stage.innerHTML='<section class="waiting"><div class="meditation-symbol">🏆</div><div class="kicker">HỘI CÔNG ĐỨC ĐÃ KHÉP LẠI</div><h1>Chuẩn bị phong thần!</h1><p>MC bấm “ĐẠI HỘI PHONG THẦN” để công bố kết quả.</p></section>';
  } else if(s.phase==='ceremony'&&s.ceremony){
    const d=s.ceremony;
    stage.innerHTML=`<section class="ceremony-scene v8-ceremony"><div class="heavenly">✦ ☁ ✦</div><div class="kicker">BITI TOURIST · ĐẠI HỘI PHONG THẦN</div><h1>THIÊN ĐÌNH PHÚ QUỐC</h1><h2 class="sky-headline">TOP 3 PHI THĂNG TU TIÊN</h2><div class="sky-podium">${[1,0,2].filter(i=>d.best[i]).map(i=>podium(d.best[i],i)).join('')}</div><div class="sky-trials"><h2>☯ KIẾP NẠN CHƯA DỨT</h2><div class="sky-trial-grid">${d.worst.length?d.worst.map(trial).join(''):'<p>Chưa đủ 6 người để xếp Bottom 3.</p>'}</div><p>Thử thách chỉ để vui, hoàn toàn tự nguyện.</p></div></section>`;
  }
}
socket.on('state',render);socket.on('disconnect',()=>{$('screen-state').textContent='MẤT KẾT NỐI';});
setInterval(()=>{if(state?.phase==='question'&&state.deadline){const el=$('projector-clock');if(el)el.textContent=String(Math.ceil(Math.max(0,state.deadline-(Date.now()+offset))/1000));}},200);

socket.on('lobby:new-join',data=>document.dispatchEvent(new CustomEvent('lobby:new-join',{detail:data})));
