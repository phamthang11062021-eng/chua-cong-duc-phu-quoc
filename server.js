require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ['websocket', 'polling'], pingTimeout: 25000 });
const PORT = Number(process.env.PORT || 3000);
const PIN = process.env.MC_PIN || '482916'; // demo only; change this in Render env vars
const players = new Map();
const lobbyChat = [];
const chatLastSent = new Map();
let chatLocked = false;
const MAX_CHAT_HISTORY = 50;
let phase = 'lobby'; // lobby | question | reveal | finished | ceremony
let round = -1;
let deadline = null;
let timer = null;
let revision = 0;

const questions = [
 { place: 'Hà Tiên • Ngày 1', slide: 12, title: 'Cửa ải Chùa Phù Dung', prompt: 'Trong ngày 1, đoàn ghé ngôi chùa nào ở Hà Tiên?', options: ['Chùa Phù Dung', 'Chùa Hộ Quốc', 'Chùa Thiên Mụ', 'Chùa Bái Đính'], correct: 0, fact: 'Slide 12: Ngày 1 tham quan Chùa Phù Dung, Lăng Mạc Cửu và Thạch Động.' },
 { place: 'Grand World • Ngày 1', slide: 13, title: 'Phố không ngủ', prompt: 'Địa điểm nào sau đây thuộc Grand World trong tour?', options: ['Đài phun nước Trevi', 'Nhà Tre', 'Thạch Động', 'Chùa Phù Dung'], correct: 1, fact: 'Slide 13: Grand World gồm Nhà Tre, sông Venice và Urban Park.' },
 { place: 'Chùa Hộ Quốc • Ngày 2', slide: 14, title: 'Thỉnh chuông Hộ Quốc', prompt: 'Theo lịch trình, đoàn tham quan Chùa Hộ Quốc vào ngày nào?', options: ['Đêm khởi hành', 'Ngày 1', 'Ngày 2', 'Ngày 3'], correct: 2, fact: 'Slide 14: Ngày 2 tham quan Thiền viện Trúc Lâm Hộ Quốc với cảnh quan núi – biển.' },
 { place: 'Biển đảo • Ngày 2', slide: 15, title: 'Nghiệp vụ biển đảo', prompt: 'Hoạt động nào trong tour chỉ thực hiện khi điều kiện an toàn cho phép?', options: ['Ngắm san hô', 'Trả phòng', 'Tập trung khởi hành', 'Lên xe về TP.HCM'], correct: 0, fact: 'Slide 15: Ngắm san hô chỉ thực hiện khi điều kiện an toàn cho phép.' },
 { place: 'Sunset Town • Ngày 2', slide: 16, title: 'Hoàng hôn đang gọi', prompt: 'Địa điểm nào nằm trong chương trình tham quan Sunset Town?', options: ['Lăng Mạc Cửu', 'Nhà Tre', 'Quảng trường Con Sò', 'Thạch Động'], correct: 2, fact: 'Slide 16: Sunset Town có Quảng trường Con Sò, đài phun nước Trevi và cảnh quan hoàng hôn.' },
 { place: 'Đoàn tour • Tổng quan', slide: 9, title: 'Trưởng đoàn kiểm tra', prompt: 'Tour Hà Tiên – Phú Quốc 3 ngày 2 đêm dự kiến phục vụ bao nhiêu khách?', options: ['19 khách', '30 khách', '40 khách', '80 khách'], correct: 2, fact: 'Slide 9: Quy mô dự kiến 40 khách, sử dụng xe và tàu cao tốc.' },
 { place: 'Tài chính • Dự toán', slide: 19, title: 'Thần tài du lịch', prompt: 'Tổng chi phí dự toán cho đoàn 40 khách là bao nhiêu?', options: ['25.350.000đ', '55.000.000đ', '132.550.000đ', '181.593.500đ'], correct: 2, fact: 'Slide 19: Tổng chi phí dự toán 132.550.000đ cho đoàn 40 khách.' },
 { place: 'Tài chính • Hòa vốn', slide: 22, title: 'Cửa ải cuối: Hòa vốn', prompt: 'Theo mô hình dự toán trên slide, tour đạt điểm hòa vốn ở khoảng bao nhiêu khách?', options: ['10 khách', '19 khách', '30 khách', '40 khách'], correct: 1, fact: 'Slide 22: Điểm hòa vốn dự kiến xấp xỉ 18,60 khách, làm tròn 19 khách.' }
];

function cleanName(v) { return String(v || '').replace(/[<>\\\r\n]/g, '').trim().slice(0, 24); }
function cleanGender(v){ return v === 'female' ? 'female' : 'male'; }
function standings() { return [...players.values()].sort((a,b)=>b.score-a.score || a.joined-b.joined); }
function ceremonyResult() {
 const ordered = standings();
 const rewardTitles = ['ĐẠO TỔ PHÚ QUỐC','CHÂN NHÂN HỘ QUỐC','TIÊN TỬ GRAND WORLD'];
 const trialTitles = ['YÊU VƯƠNG DEADLINE','HẦU VƯƠNG LẠC ĐẠO','PHÀM NHÂN LẠC TOUR'];
 const trialTasks = ['Tự nguyện đọc một câu hứa chống deadline','Tự nguyện tạo dáng thiền 5 giây','Tự nguyện quảng cáo tour BITI TOURIST trong 10 giây'];
 const best = ordered.slice(0,3).map((p,i)=>({name:p.name,score:p.score,title:rewardTitles[i],rank:i+1}));
 const worst = ordered.length >= 6 ? ordered.slice(-3).reverse().map((p,i)=>({name:p.name,score:p.score,title:trialTitles[i],task:trialTasks[i],rank:ordered.length-i})) : [];
 return {best,worst,total:ordered.length};
}
function lobbyPeople() {
 const online = new Set();
 for (const sock of io.sockets.sockets.values()) if(sock.data.playerId) online.add(sock.data.playerId);
 return [...players.values()]
   .filter(p=>online.has(p.id))
   .sort((a,b)=>a.joined-b.joined)
   .map(p=>({
     id:p.id,
     name:p.name,
     gender:p.gender || 'male',
     bubble:(p.chatUntil && p.chatUntil > Date.now()) ? p.lastChat : ''
   }));
}
function top() {
 return standings().slice(0,10).map(p=>({name:p.name,score:p.score}));
}
function onlineCount() {
 const ids = new Set();
 for (const sock of io.sockets.sockets.values()) {
   if (sock.data.playerId && players.has(sock.data.playerId)) ids.add(sock.data.playerId);
 }
 return ids.size;
}
function publicState() {
 return {
   phase,
   round,
   totalRounds: questions.length,
   deadline,
   now: Date.now(),
   count: players.size,
   onlineCount: onlineCount(),
   leaderboard: top(),
   question: (round >= 0 && (phase === 'question' || phase === 'reveal')) ? {
     place: questions[round].place,
     title: questions[round].title,
     prompt: questions[round].prompt,
     options: questions[round].options,
     slide: questions[round].slide,
     ...(phase === 'reveal' ? {correct: questions[round].correct, fact: questions[round].fact} : {})
   } : null,
   ceremony: phase === 'ceremony' ? ceremonyResult() : null,
   lobby: phase === 'lobby' ? {people:lobbyPeople(),messages:lobbyChat,chatLocked} : null,
   revision
 };
}
function personal(p) {
 const ordered = standings();
 return {name:p.name,gender:p.gender || 'male',score:p.score,rank:ordered.findIndex(x=>x.id===p.id)+1,answered: p.answeredRound===round,selected: p.selected};
}
function broadcast() {
 revision++;
 io.emit('state', publicState());
 for (const s of io.sockets.sockets.values()) {
   if (s.data.playerId && players.has(s.data.playerId)) s.emit('me', personal(players.get(s.data.playerId)));
 }
}
function stopTimer(){ if(timer) clearTimeout(timer); timer = null; deadline = null; }
function reveal(){ if(phase !== 'question') return; stopTimer(); phase = 'reveal'; broadcast(); }
function nextQuestion(){
 if(!['lobby','reveal'].includes(phase)) return false;
 stopTimer();
 if(round + 1 >= questions.length){ phase = 'finished'; broadcast(); return true; }
 round++;
 phase = 'question';
 deadline = Date.now() + 20000;
 for(const p of players.values()){ p.selected = null; p.answeredRound = -1; }
 timer = setTimeout(reveal, 20050);
 broadcast();
 return true;
}
function finish(){ stopTimer(); phase = 'finished'; broadcast(); }
function openCeremony(){ if(phase !== 'finished') return false; phase = 'ceremony'; broadcast(); return true; }
function reset(){ stopTimer(); players.clear(); chatLastSent.clear(); lobbyChat.length = 0; chatLocked = false; round = -1; phase = 'lobby'; broadcast(); }

app.use(express.static(path.join(__dirname, 'public')));
app.get('/mc',(req,res)=>res.sendFile(path.join(__dirname,'public','mc.html')));
app.get('/screen',(req,res)=>res.sendFile(path.join(__dirname,'public','screen.html')));
app.get('/health',(req,res)=>res.json({ok:true,players:players.size,phase}));
app.get('/join-qr.svg', async(req,res)=>{
 try {
  const origin = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const svg = await QRCode.toString(origin.replace(/\/$/,'')+'/', {type:'svg',margin:2,color:{dark:'#123e61',light:'#ffffff'}});
  res.type('image/svg+xml').send(svg);
 } catch(e) { res.status(500).send('QR unavailable'); }
});

io.on('connection', socket => {
 socket.emit('state', publicState());
 socket.on('join',(payload,ack)=>{
  const name = cleanName(payload?.name);
  const gender = cleanGender(payload?.gender);
  const id = String(payload?.id || '').slice(0,100);
  if(!name || name.length < 2) return ack?.({ok:false,error:'Tên cần ít nhất 2 ký tự.'});
  if(!/^[a-zA-Z0-9-]{15,100}$/.test(id)) return ack?.({ok:false,error:'Mã phiên không hợp lệ, hãy tải lại trang.'});
  if(phase === 'finished' || phase === 'ceremony') return ack?.({ok:false,error:'Vòng chơi đã kết thúc. Hãy chờ MC mở vòng mới.'});
  if(!players.has(id) && players.size >= 80) return ack?.({ok:false,error:'Thiền đường đã đủ 80 người.'});
  let p = players.get(id);
  const isNew = !p;
  if(!p){
   p = {id,name,gender,score:0,joined:Date.now(),answeredRound:-1,selected:null,lastChat:'',chatUntil:0};
   players.set(id,p);
   lobbyChat.push({id,name:'Hệ thống',text:`${name} vừa bước vào thiền đường.`,at:Date.now(),system:true});
   if(lobbyChat.length > MAX_CHAT_HISTORY) lobbyChat.shift();
  } else {
   p.name = name;
   p.gender = gender;
  }
  socket.data.playerId = id;
  socket.emit('me', personal(p));
  ack?.({ok:true});
  if(isNew && phase === 'lobby') io.emit('lobby:new-join', {name:p.name});
  broadcast();
 });
 socket.on('lobby:chat',(raw,ack)=>{
  const id = socket.data.playerId, p = players.get(id);
  if(phase !== 'lobby' || chatLocked || !p) return ack?.({ok:false,error:'Chat hiện không mở.'});
  const msg = String(raw || '').replace(/[<>\r\n\x00-\x1f]/g,'').trim().slice(0,120);
  if(!msg) return ack?.({ok:false,error:'Hãy nhập tin nhắn.'});
  const now = Date.now();
  if(now - (chatLastSent.get(id)||0) < 1800) return ack?.({ok:false,error:'Nhắn chậm lại chút nha!'});
  chatLastSent.set(id, now);
  p.lastChat = msg;
  p.chatUntil = now + 6000;
  lobbyChat.push({id,name:p.name,text:msg,at:now,system:false});
  if(lobbyChat.length > MAX_CHAT_HISTORY) lobbyChat.shift();
  io.emit('lobby:message', lobbyChat[lobbyChat.length - 1]);
  ack?.({ok:true});
  broadcast();
  // Remove the speech bubble after 6 seconds for everyone, including idle clients.
  setTimeout(() => {
    if (phase === 'lobby' && p.chatUntil <= Date.now() && p.lastChat === msg) {
      p.lastChat = '';
      p.chatUntil = 0;
      broadcast();
    }
  }, 6100);
 });
 socket.on('disconnect',()=>{ if(phase === 'lobby') broadcast(); });
 socket.on('answer',(choice,ack)=>{
  const p = players.get(socket.data.playerId); const q = questions[round];
  if(!p || phase !== 'question' || !q || Date.now() > deadline || p.answeredRound === round) return ack?.({ok:false});
  if(!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return ack?.({ok:false});
  p.answeredRound = round; p.selected = choice;
  if(choice === q.correct){
   const remaining = Math.max(0, deadline - Date.now());
   p.score += 200 + Math.floor(remaining / 200);
  } else {
   p.score -= 100; // Points can be negative after wrong answers.
  }
  ack?.({ok:true});
  broadcast();
 });
 socket.on('mc:auth',(pin,ack)=>{
  const x = Buffer.from(String(pin||'')), y = Buffer.from(PIN);
  if(x.length !== y.length || !crypto.timingSafeEqual(x,y)) return ack?.({ok:false,error:'Sai mã MC.'});
  socket.data.mc = true; ack?.({ok:true}); socket.emit('state', publicState());
 });
 socket.on('mc:action',(action,ack)=>{
  if(!socket.data.mc) return ack?.({ok:false,error:'Chưa xác thực MC.'});
  let success = true;
  if(action === 'start' && phase === 'lobby') success = nextQuestion();
  else if(action === 'next' && phase === 'reveal') success = nextQuestion();
  else if(action === 'reveal' && phase === 'question') reveal();
  else if(action === 'finish') finish();
  else if(action === 'ceremony') success = openCeremony();
  else if(action === 'chat:lock' && phase === 'lobby'){ chatLocked = !chatLocked; broadcast(); }
  else if(action === 'chat:clear' && phase === 'lobby'){ lobbyChat.length = 0; broadcast(); }
  else if(action === 'reset') reset();
  else success = false;
  ack?.({ok:success});
 });
});

server.listen(PORT,()=>console.log(`Chùa Công Đức running on http://localhost:${PORT}`));
