const socket=io(),$=id=>document.getElementById(id);let state=null,auth=false,offset=0;
function fmt(n){return Number(n||0).toLocaleString('vi-VN');}
function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('pin-form').addEventListener('submit',e=>{e.preventDefault();socket.emit('mc:auth',$('pin').value,r=>{if(r?.ok){auth=true;$('mc-login').hidden=true;$('mc-dashboard').hidden=false;if(state)render(state);}else $('mc-error').textContent=r?.error||'Không thể đăng nhập';});});
const link=location.origin+'/';$('join-link').textContent=link;$('qr').src='/join-qr.svg';$('copy-link').onclick=()=>navigator.clipboard.writeText(link).then(()=>alert('Đã sao chép link!')).catch(()=>prompt('Copy link:',link));
function action(name){if(name==='reset'&&!confirm('Reset sẽ xóa hết điểm và người chơi. Chắc chắn?'))return;socket.emit('mc:action',name,r=>{if(!r?.ok)alert('Không thực hiện được thao tác này ở trạng thái hiện tại.');});}
['start','next','reveal','finish','ceremony','reset','chat:lock','chat:clear'].forEach(x=>$(x).onclick=()=>action(x));
function render(s){state=s;offset=s.now-Date.now();if(!auth)return;$('mc-count').textContent=s.count;$('mc-phase').textContent=({lobby:'CHỜ',question:'TRẢ LỜI',reveal:'ĐÁP ÁN',finished:'KẾT THÚC',ceremony:'PHONG THẦN'})[s.phase];$('mc-round').textContent=Math.max(s.round+1,0)+'/'+s.totalRounds;
$('mc-lobby-panel').hidden=s.phase!=='lobby';$('mc-lobby-info').textContent=(s.lobby?.people?.length||0)+' thí chủ đang ngồi thiền. '+(s.lobby?.chatLocked?'Chat đã khóa.':'Chat đang mở.');$('chat:lock').textContent=s.lobby?.chatLocked?'🔓 MỞ CHAT':'🔒 KHÓA CHAT';$('start').disabled=s.phase!=='lobby';$('next').disabled=s.phase!=='reveal';$('next').textContent=s.round+1>=s.totalRounds?'🏆 XEM KẾT QUẢ':'🧩 CÂU TIẾP THEO';$('reveal').disabled=s.phase!=='question';$('finish').disabled=['finished','ceremony'].includes(s.phase);$('ceremony').disabled=s.phase!=='finished';$('mc-ceremony-panel').hidden=s.phase!=='ceremony';
$('mc-question-name').textContent=s.question?s.question.title:(s.phase==='finished'?'Hội công đức đã kết thúc':'Chờ cả lớp vào phòng');
$('mc-question-prompt').textContent=s.question?s.question.prompt:('MC điều khiển tiến độ ngay bên dưới.');
renderMCPreview(s);
$('mc-leaderboard').innerHTML=s.leaderboard.map((p,i)=>`<li><span class="rank">${i+1}</span><span>${escapeHtml(p.name)}</span><span class="score">${fmt(p.score)} ✦</span></li>`).join('')||'<li class="empty">Chưa có người chơi</li>';
}
socket.on('state',render);socket.on('disconnect',()=>{$('mc-phase').textContent='MẤT MẠNG';});socket.on('connect',()=>{if(auth){auth=false;$('mc-dashboard').hidden=true;$('mc-login').hidden=false;$('mc-error').textContent='Đã kết nối lại, nhập mã MC để xác thực lại.';}});
setInterval(()=>{if(state?.phase==='question'&&state.deadline){$('mc-deadline').textContent=Math.ceil(Math.max(0,state.deadline-(Date.now()+offset))/1000)+' giây';}else $('mc-deadline').textContent='—';},250);

function renderMCPreview(s){
 const c=$('mc-preview'),label=$('mc-preview-phase');
 label.textContent=({lobby:'SẢNH CHỜ',question:'ĐANG TRẢ LỜI',reveal:'ĐÃ CÔNG BỐ',finished:'KẾT THÚC',ceremony:'PHONG THẦN'})[s.phase]||'—';
 if(s.question){
   const q=s.question;
   c.innerHTML=`<div class="preview-kicker">CÂU ${s.round+1}/${s.totalRounds} · ${escapeHtml(q.place)}</div><h3>${escapeHtml(q.prompt)}</h3><div class="preview-options">${q.options.map((x,i)=>`<div class="preview-option ${s.phase==='reveal' && i===q.correct?'correct':''}"><b>${'ABCD'[i]}</b>${escapeHtml(x)}</div>`).join('')}</div>${s.phase==='reveal'?`<p class="preview-fact">📖 ${escapeHtml(q.fact)}</p>`:''}`;
 } else if(s.phase==='ceremony' && s.ceremony){
   c.innerHTML=`<div class="preview-kicker">✨ ĐẠI HỘI PHONG THẦN</div><h3>☁️ TOP 3 PHI THĂNG ☁️</h3><div class="preview-rank">${s.ceremony.best.map((x,i)=>`<div>${['🥇','🥈','🥉'][i]} ${escapeHtml(x.name)} · ${escapeHtml(x.title)} · ${fmt(x.score)} điểm</div>`).join('')}</div><h3>💀 KIẾP NẠN CHƯA DỨT</h3><div class="preview-rank">${s.ceremony.worst.map(x=>`<div>${escapeHtml(x.name)} · ${escapeHtml(x.title)}</div>`).join('')||'Chưa đủ người'}</div>`;
 } else c.innerHTML=`<div class="preview-kicker">${s.phase==='lobby'?'🪷 THIỀN ĐƯỜNG CHỜ KHAI HỘI':'🏆 KẾT THÚC TRÒ CHƠI'}</div><h3>${s.phase==='lobby'?`${s.lobby?.people?.length||0}/80 thí chủ đã vào phòng`:'Sẵn sàng công bố Đại Hội Phong Thần'}</h3>`;
}
