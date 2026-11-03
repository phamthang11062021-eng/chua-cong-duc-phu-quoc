const socket=io(),$=id=>document.getElementById(id);let state=null,auth=false,offset=0;
function fmt(n){return Number(n||0).toLocaleString('vi-VN');}
function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('pin-form').addEventListener('submit',e=>{e.preventDefault();socket.emit('mc:auth',$('pin').value,r=>{if(r?.ok){auth=true;$('mc-login').hidden=true;$('mc-dashboard').hidden=false;if(state)render(state);}else $('mc-error').textContent=r?.error||'Không thể đăng nhập';});});
const link=location.origin+'/';$('join-link').textContent=link;$('qr').src='/join-qr.svg';$('copy-link').onclick=()=>navigator.clipboard.writeText(link).then(()=>alert('Đã sao chép link!')).catch(()=>prompt('Copy link:',link));
function action(name){if(name==='reset'&&!confirm('Reset sẽ xóa hết điểm và người chơi. Chắc chắn?'))return;socket.emit('mc:action',name,r=>{if(!r?.ok)alert('Không thực hiện được thao tác này ở trạng thái hiện tại.');});}
['start','next','reveal','finish','reset'].forEach(x=>$(x).onclick=()=>action(x));
function render(s){state=s;offset=s.now-Date.now();if(!auth)return;$('mc-count').textContent=s.count;$('mc-phase').textContent=({lobby:'CHỜ',tapping:'GÕ MÕ',question:'TRẢ LỜI',reveal:'ĐÁP ÁN',finished:'KẾT THÚC'})[s.phase];$('mc-round').textContent=Math.max(s.round+1,0)+'/'+s.totalRounds;
$('start').disabled=s.phase!=='lobby';$('next').disabled=!['tapping','reveal'].includes(s.phase);$('next').textContent=s.round+1>=s.totalRounds?'🏆 XEM KẾT QUẢ':'🧩 CÂU TIẾP THEO';$('reveal').disabled=s.phase!=='question';$('finish').disabled=s.phase==='finished';
$('mc-question-name').textContent=s.question?s.question.title:(s.phase==='finished'?'Hội công đức đã kết thúc':s.phase==='tapping'?'Đang gõ mõ tích điểm':'Chờ cả lớp vào phòng');
$('mc-question-prompt').textContent=s.question?s.question.prompt:(s.phase==='tapping'?'Khi sẵn sàng, bấm “Câu tiếp theo” để bắt đầu quiz.':'MC điều khiển tiến độ ngay bên dưới.');
$('mc-leaderboard').innerHTML=s.leaderboard.map((p,i)=>`<li><span class="rank">${i+1}</span><span>${escapeHtml(p.name)}</span><span class="score">${fmt(p.score)} ✦</span></li>`).join('')||'<li class="empty">Chưa có người chơi</li>';
}
socket.on('state',render);socket.on('disconnect',()=>{$('mc-phase').textContent='MẤT MẠNG';});socket.on('connect',()=>{if(auth){auth=false;$('mc-dashboard').hidden=true;$('mc-login').hidden=false;$('mc-error').textContent='Đã kết nối lại, nhập mã MC để xác thực lại.';}});
setInterval(()=>{if(state?.phase==='question'&&state.deadline){$('mc-deadline').textContent=Math.ceil(Math.max(0,state.deadline-(Date.now()+offset))/1000)+' giây';}else $('mc-deadline').textContent='—';},250);
