const socket=io();const $=id=>document.getElementById(id);let state=null,offset=0,lastRevision=-1;
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(x){return Number(x||0).toLocaleString('vi-VN');}
function reward(p,i){const imgs=['dao-to.svg','chan-nhan.svg','tien-tu.svg'];return `<div class="rank-card ${i===0?'champion':''}"><div class="rank-illustration"><img src="/assets/phong-than/${imgs[i]}" alt="Nhân vật tu tiên"></div><div><div class="rank-small">HẠNG #${i+1} · ${fmt(p.score)} CÔNG ĐỨC</div><div class="rank-title">${safe(p.title)}</div><div class="rank-name">${safe(p.name)}</div></div></div>`;}
function trial(p,i){const imgs=['yeu-vuong.svg','hau-vuong.svg','pham-nhan.svg'];return `<div class="trial-card"><div class="trial-art"><img src="/assets/phong-than/${imgs[i]}" alt="Nhân vật kiếp nạn"></div><div><div class="rank-small">HẠNG #${p.rank} · ${fmt(p.score)} CÔNG ĐỨC</div><div class="rank-title">${safe(p.title)}</div><div class="rank-name">${safe(p.name)}</div><div class="task">${safe(p.task)}</div></div></div>`;}
function render(s){
  state=s;offset=s.now-Date.now();$('screen-people').textContent=`${s.phase==='lobby'?(s.lobby?.people?.length||0):s.count}/80`;const names={lobby:'SẢNH CHỜ',question:'THỬ THÁCH',reveal:'CÔNG BỐ ĐÁP ÁN',finished:'KẾT THÚC',ceremony:'ĐẠI HỘI PHONG THẦN'};$('screen-state').textContent=names[s.phase]||'ĐANG CHỜ';
  if(lastRevision===s.revision)return;lastRevision=s.revision;
  const stage=$('screen-content');stage.className='stage '+s.phase;
  if(s.phase==='lobby'){
    stage.innerHTML=`<section class="waiting"><div class="meditation-symbol">🪷</div><div class="kicker">THIỀN ĐƯỜNG ĐANG CHỜ KHAI HỘI</div><h1>Cả lớp đã sẵn sàng?</h1><p><strong>${s.lobby?.people?.length||0}/80</strong> thí chủ đã bước vào thiền đường</p><img class="joinqr" src="/join-qr.svg" alt="Mã QR tham gia"><div class="joinurl">${safe(location.origin)}</div><p class="waiting-note">Quét QR để vào thiền đường · MC sẽ mở thử thách</p></section>`;
  } else if(s.question){
    const q=s.question;
    stage.innerHTML=`<section class="question-scene"><div class="question-header"><div class="kicker">CỬA ẢI ${s.round+1}/${s.totalRounds} · ${safe(q.place)} · SLIDE ${q.slide}</div><div class="clock" id="projector-clock">20</div></div><h1>${safe(q.prompt)}</h1><div class="options">${q.options.map((v,i)=>`<div class="option ${s.phase==='reveal' && i===q.correct?'correct':''} ${s.phase==='reveal' && i!==q.correct?'muted':''}"><span class="letter">${'ABCD'[i]}</span><span>${safe(v)}</span>${s.phase==='reveal'&&i===q.correct?'<b class="tick">✓</b>':''}</div>`).join('')}</div>${s.phase==='reveal'?`<div class="fact">📖 ${safe(q.fact)}</div>`:'<div class="answer-note">Hãy chọn đáp án trên điện thoại của bạn</div>'}</section>`;
  } else if(s.phase==='finished'){
    stage.innerHTML='<section class="waiting"><div class="meditation-symbol">🏆</div><div class="kicker">HỘI CÔNG ĐỨC ĐÃ KHÉP LẠI</div><h1>Chuẩn bị phong thần!</h1><p>MC bấm “ĐẠI HỘI PHONG THẦN” để công bố kết quả.</p></section>';
  } else if(s.phase==='ceremony'&&s.ceremony){
    const d=s.ceremony;
    stage.innerHTML=`<section class="ceremony-scene"><div class="heavenly">✦ ✨ ✦</div><div class="kicker">BITI TOURIST · ĐẠI HỘI PHONG THẦN</div><h1>THIÊN ĐÌNH PHÚ QUỐC</h1><div class="ceremony-columns"><div class="ceremony-section"><h2>☁️ TOP 3 PHI THĂNG TU TIÊN ☁️</h2>${d.best.map(reward).join('')}</div><div class="ceremony-section shadow"><h2>💀 KIẾP NẠN CHƯA DỨT 💀</h2>${d.worst.length?d.worst.map(trial).join(''):'<p>Chưa đủ 6 người để xếp Bottom 3.</p>'}<div class="voluntary">Thử thách vui, hoàn toàn tự nguyện.</div></div></div></section>`;
  }
}
socket.on('state',render);socket.on('disconnect',()=>{$('screen-state').textContent='MẤT KẾT NỐI';});
setInterval(()=>{if(state?.phase==='question'&&state.deadline){const el=$('projector-clock');if(el)el.textContent=String(Math.ceil(Math.max(0,state.deadline-(Date.now()+offset))/1000));}},200);
