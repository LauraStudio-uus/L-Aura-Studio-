"use strict";

const CONFIG = window.LAURA_CONFIG || {};
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const nowISO = () => new Date().toISOString();
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmtDate = v => { if(!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("vi-VN"); };
const slugify = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "item";

function toast(message, type="ok"){
  const region = $("#toastRegion"); if(!region) return;
  const el = document.createElement("div"); el.className = `toast ${type === "error" ? "error" : ""}`; el.textContent = message; region.appendChild(el);
  setTimeout(()=> el.remove(), 3500);
}
function setBusy(form, busy){
  form?.querySelectorAll("button,input,select,textarea").forEach(el => { if(el.type !== "hidden") el.disabled = busy; });
}
function openModal(id){const el=document.getElementById(id);if(!el)return;el.classList.add("open");el.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");}
function closeModal(id){const el=document.getElementById(id);if(!el)return;el.classList.remove("open");el.setAttribute("aria-hidden","true");if(!$(".modal.open"))document.body.classList.remove("modal-open");if(id==="videoModal")$("#videoPlayer").innerHTML="";}

/* -------------------------
   CONFIG + SEO
------------------------- */
function applyConfig(){
  const s=CONFIG.studio||{};
  if($("#contactLocation")) $("#contactLocation").textContent=s.location||"Ho Chi Minh City, Vietnam";
  if($("#contactPhone")) $("#contactPhone").textContent=s.phone||"";
  if($("#contactEmail")) $("#contactEmail").textContent=s.email||"";
  [["#instagramLink",s.instagram],["#facebookLink",s.facebook]].forEach(([sel,url])=>{const a=$(sel);if(a&&url){a.href=url;a.target="_blank";a.rel="noopener noreferrer";}});
  const site=(CONFIG.siteUrl||"").trim();
  if(site && !site.includes("YOUR-DOMAIN")){
    const normalized=site.endsWith("/")?site:site+"/";
    const canonical=$("#canonicalLink"); if(canonical) canonical.href=normalized;
    try{const schema=JSON.parse($("#studioSchema")?.textContent||"{}");schema.url=normalized;schema.name=s.name||"L'Aura Studio";schema.email=s.email||undefined;schema.telephone=s.phone||undefined;schema.sameAs=[s.instagram,s.facebook].filter(Boolean);$("#studioSchema").textContent=JSON.stringify(schema); }catch(_){ }
  }
}

/* -------------------------
   THEME / NAV / ANIMATION
------------------------- */
function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("lauraTheme",theme);const icon=$("#themeIcon");if(icon)icon.textContent=theme==="dark"?"☀":"☾";const meta=$("meta[name='theme-color']");if(meta)meta.content=theme==="dark"?"#111315":"#f6f2ea";}
function initChrome(){
  applyTheme(document.documentElement.dataset.theme||"light");
  $("#themeToggle")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  $("#menuToggle")?.addEventListener("click",()=>$("#nav")?.classList.toggle("open"));
  $$("#nav a").forEach(a=>a.addEventListener("click",()=>$("#nav")?.classList.remove("open")));
  window.addEventListener("scroll",()=>$("#header")?.classList.toggle("scrolled",scrollY>25),{passive:true});
  $("#year") && ($("#year").textContent=new Date().getFullYear());
  const obs = "IntersectionObserver" in window ? new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target);}}),{threshold:.1}) : null;
  $$(".reveal").forEach(el=>obs?obs.observe(el):el.classList.add("visible"));
  $$('[data-close]').forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
  $$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id);}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){const open=$$(".modal.open").pop();if(open)closeModal(open.id);}});
}

/* -------------------------
   LOCAL CRYPTO AUTH
------------------------- */
async function sha256(text){const bytes=new TextEncoder().encode(text);const hash=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function hashPassword(password,salt){return sha256(`${salt}:${password}`)}

const LOCAL_KEYS={users:"laura_v2_users",session:"laura_v2_session",portfolio:"laura_v2_portfolio",videos:"laura_v2_videos",posts:"laura_v2_posts",comments:"laura_v2_comments",bookings:"laura_v2_bookings",media:"laura_v2_media",migrated:"laura_v2_migrated"};
const localRead=(key,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}};
const localWrite=(key,v)=>localStorage.setItem(key,JSON.stringify(v));
const sessionRead=()=>{try{return JSON.parse(sessionStorage.getItem(LOCAL_KEYS.session)||"null")}catch{return null}};
const sessionWrite=v=>v?sessionStorage.setItem(LOCAL_KEYS.session,JSON.stringify(v)):sessionStorage.removeItem(LOCAL_KEYS.session);

const SEEDS={
 portfolio:[
  {id:"p1",title:"Quiet Portrait",category:"Portrait",layout:"large",image_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",published:true,sort_order:1},
  {id:"p2",title:"Editorial Mood",category:"Fashion",layout:"normal",image_url:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",published:true,sort_order:2},
  {id:"p3",title:"Soft Light",category:"Editorial",layout:"tall",image_url:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",published:true,sort_order:3},
  {id:"p4",title:"Beauty Study",category:"Beauty",layout:"normal",image_url:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",published:true,sort_order:4},
  {id:"p5",title:"Together",category:"Couple",layout:"wide",image_url:"https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1400&q=85",published:true,sort_order:5}
 ],
 videos:[],
 posts:[
  {id:"post-1",title:"5 nguyên tắc tạo ánh sáng chân dung có chiều sâu",slug:"5-nguyen-tac-anh-sang-chan-dung",category:"Photography",image_url:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85",excerpt:"Từ hướng sáng, kích thước nguồn sáng đến khoảng cách giữa đèn và chủ thể.",content:"Ánh sáng là một trong những yếu tố quan trọng nhất quyết định cảm xúc của một bức chân dung.\n\n1. Xác định hướng sáng trước khi chọn modifier.\n2. Quan sát vùng highlight và shadow trên khuôn mặt.\n3. Điều chỉnh kích thước nguồn sáng để kiểm soát độ chuyển.\n4. Kiểm soát khoảng cách đèn với chủ thể.\n5. Luôn thử nghiệm và đánh giá ảnh thực tế.\n\nMột setup tốt không nhất thiết phải nhiều đèn. Quan trọng là mỗi nguồn sáng có nhiệm vụ rõ ràng.",published:true,created_at:"2026-09-29T00:00:00+07:00"},
  {id:"post-2",title:"Một ngày phía sau camera tại L’Aura Studio",slug:"mot-ngay-phia-sau-camera",category:"Behind the scenes",image_url:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",excerpt:"Từ lúc chuẩn bị concept, set đèn đến những khung hình cuối cùng.",content:"Một buổi chụp tốt bắt đầu từ trước khi mẫu bước vào studio.\n\nEkip kiểm tra moodboard, camera, lens, trigger, đèn và modifier. Sau đó dựng ánh sáng thử, kiểm tra exposure và thống nhất direction.\n\nTrong lúc chụp, photographer tập trung vào ánh sáng, biểu cảm và khoảnh khắc; support giữ workflow và thiết bị ổn định.",published:true,created_at:"2026-09-25T00:00:00+07:00"},
  {id:"post-3",title:"Studio nhỏ cần gì để bắt đầu?",slug:"studio-nho-can-gi",category:"Studio",image_url:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",excerpt:"Không gian, ánh sáng, phông nền và cách ưu tiên ngân sách khi bắt đầu.",content:"Bạn không cần một studio quá lớn để bắt đầu.\n\nƯu tiên không gian có trần đủ cao, điện ổn định, khu vực thay đồ và khoảng cách hợp lý giữa background, chủ thể và đèn.\n\nSau đó đầu tư theo thứ tự: nguồn sáng ổn định → modifier → background → camera/lens → thiết bị phụ trợ.",published:true,created_at:"2026-09-20T00:00:00+07:00"}
 ]
};

function migrateLocal(){
  if(localStorage.getItem(LOCAL_KEYS.migrated)) return;
  const port=localRead("lauraStudioPortfolio",null); if(port?.length) localWrite(LOCAL_KEYS.portfolio,port.map((x,i)=>({id:x.id||uid(),title:x.title||`Portfolio ${i+1}`,category:x.category||"Portfolio",layout:x.layout||"normal",image_url:x.image||x.image_url||"",published:true,sort_order:i+1})));
  const vids=localRead("lauraStudioVideos",null); if(vids?.length) localWrite(LOCAL_KEYS.videos,vids.map(x=>({id:x.id||uid(),title:x.title,category:x.category||"Film",video_url:x.url||x.video_url,thumbnail_url:x.thumbnail||x.thumbnail_url||"",description:x.description||"",published:true,created_at:nowISO()})));
  const posts=localRead("ddStudioPosts",null); if(posts?.length) localWrite(LOCAL_KEYS.posts,posts.map(x=>({id:x.id||uid(),title:x.title,slug:slugify(x.title),category:x.category||"Studio",image_url:x.image||x.image_url||"",excerpt:x.excerpt||"",content:x.content||"",published:true,created_at:x.created_at||x.date||nowISO()})));
  const comments=localRead("ddStudioComments",null); if(comments?.length) localWrite(LOCAL_KEYS.comments,comments.map(x=>({id:x.id||uid(),post_id:x.postId||x.post_id,user_id:x.userId||x.user_id,author_name:x.name||x.author_name||"User",body:x.text||x.body||"",created_at:x.createdAt||x.created_at||nowISO()})));
  const contacts=localRead("ddStudioContacts",null); if(contacts?.length) localWrite(LOCAL_KEYS.bookings,contacts.map(x=>({id:x.id||uid(),name:x.name||"",phone:x.phone||"",email:x.email||"",service:x.service||"",requested_date:x.date||x.requested_date||"",budget:x.budget||"",message:x.message||"",status:x.status==="new"?"new":(x.status||"new"),created_at:x.created_at||nowISO()})));
  localStorage.setItem(LOCAL_KEYS.migrated,"1");
}
function seedLocal(){
  if(!localStorage.getItem(LOCAL_KEYS.portfolio)) localWrite(LOCAL_KEYS.portfolio,SEEDS.portfolio);
  if(!localStorage.getItem(LOCAL_KEYS.videos)) localWrite(LOCAL_KEYS.videos,SEEDS.videos);
  if(!localStorage.getItem(LOCAL_KEYS.posts)) localWrite(LOCAL_KEYS.posts,SEEDS.posts);
  if(!localStorage.getItem(LOCAL_KEYS.comments)) localWrite(LOCAL_KEYS.comments,[]);
  if(!localStorage.getItem(LOCAL_KEYS.bookings)) localWrite(LOCAL_KEYS.bookings,[]);
  if(!localStorage.getItem(LOCAL_KEYS.media)) localWrite(LOCAL_KEYS.media,[]);
  if(!localStorage.getItem(LOCAL_KEYS.users)) localWrite(LOCAL_KEYS.users,[]);
}

/* -------------------------
   BACKEND ADAPTER
------------------------- */
class LauraBackend{
  constructor(){
    const s=CONFIG.supabase||{};
    this.mode=(s.url&&s.publishableKey&&window.supabase?.createClient)?"supabase":"local";
    this.bucket=s.mediaBucket||"laura-media";
    this.client=this.mode==="supabase"?window.supabase.createClient(s.url,s.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
  }
  async init(){if(this.mode==="local"){migrateLocal();seedLocal();} return this.mode;}
  async currentUser(){
    if(this.mode==="supabase"){const {data}=await this.client.auth.getUser();if(!data?.user)return null;const {data:p}=await this.client.from("profiles").select("id,email,full_name,role").eq("id",data.user.id).maybeSingle();return {id:data.user.id,email:data.user.email,name:p?.full_name||data.user.user_metadata?.full_name||data.user.email,role:p?.role||"user"};}
    return sessionRead();
  }
  async signUp(name,email,password){
    if(this.mode==="supabase"){const {data,error}=await this.client.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)throw error;return data;}
    const users=localRead(LOCAL_KEYS.users,[]);if(users.some(u=>u.email.toLowerCase()===email.toLowerCase()))throw new Error("Email này đã được đăng ký.");const salt=uid();const user={id:uid(),email:email.toLowerCase(),name,role:"user",salt,passwordHash:await hashPassword(password,salt),created_at:nowISO()};users.push(user);localWrite(LOCAL_KEYS.users,users);sessionWrite({id:user.id,email:user.email,name:user.name,role:user.role});return user;
  }
  async signIn(email,password){
    if(this.mode==="supabase"){const {error}=await this.client.auth.signInWithPassword({email,password});if(error)throw error;return this.currentUser();}
    const users=localRead(LOCAL_KEYS.users,[]);const user=users.find(u=>u.email.toLowerCase()===email.toLowerCase());if(!user)throw new Error("Email hoặc mật khẩu không đúng.");let ok=false;if(user.passwordHash&&user.salt)ok=(await hashPassword(password,user.salt))===user.passwordHash;else if(user.password===password){ok=true;user.salt=uid();user.passwordHash=await hashPassword(password,user.salt);delete user.password;localWrite(LOCAL_KEYS.users,users);}if(!ok)throw new Error("Email hoặc mật khẩu không đúng.");sessionWrite({id:user.id,email:user.email,name:user.name,role:user.role||"user"});return sessionRead();
  }
  async signOut(){if(this.mode==="supabase")await this.client.auth.signOut();else sessionWrite(null);}
  async hasLocalAdmin(){return this.mode==="local"&&localRead(LOCAL_KEYS.users,[]).some(u=>u.role==="admin");}
  async bootstrapLocalAdmin(email,password){if(this.mode!=="local")throw new Error("Chỉ dùng trong Local Demo.");if(await this.hasLocalAdmin())throw new Error("Admin demo đã tồn tại.");if(!email||password.length<8)throw new Error("Email hợp lệ và mật khẩu tối thiểu 8 ký tự.");const users=localRead(LOCAL_KEYS.users,[]);const salt=uid();const admin={id:uid(),email:email.toLowerCase(),name:"L'Aura Admin",role:"admin",salt,passwordHash:await hashPassword(password,salt),created_at:nowISO()};users.push(admin);localWrite(LOCAL_KEYS.users,users);sessionWrite({id:admin.id,email:admin.email,name:admin.name,role:"admin"});return admin;}
  async isAdmin(){return (await this.currentUser())?.role==="admin";}

  async listPortfolio(admin=false){if(this.mode==="supabase"){let q=this.client.from("portfolio_items").select("*").eq("page","portfolio").order("sort_order").order("created_at");if(!admin)q=q.eq("published",true);const {data,error}=await q;if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.portfolio,[]).filter(x=>admin||x.published!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));}
  async savePortfolio(item){if(this.mode==="supabase"){const payload={title:item.title,category:item.category,page:"portfolio",layout:item.layout,image_url:item.image_url,alt:item.title,published:item.published,sort_order:Number(item.sort_order)||0};const q=item.id?this.client.from("portfolio_items").update(payload).eq("id",item.id):this.client.from("portfolio_items").insert(payload);const {error}=await q;if(error)throw error;return;}const arr=localRead(LOCAL_KEYS.portfolio,[]);if(item.id){const i=arr.findIndex(x=>x.id===item.id);if(i>=0)arr[i]={...arr[i],...item};}else arr.push({...item,id:uid(),created_at:nowISO()});localWrite(LOCAL_KEYS.portfolio,arr);}
  async deletePortfolio(id){if(this.mode==="supabase"){const {error}=await this.client.from("portfolio_items").delete().eq("id",id);if(error)throw error;}else localWrite(LOCAL_KEYS.portfolio,localRead(LOCAL_KEYS.portfolio,[]).filter(x=>x.id!==id));}

  async listVideos(admin=false){if(this.mode==="supabase"){let q=this.client.from("videos").select("*").order("sort_order").order("created_at",{ascending:false});if(!admin)q=q.eq("published",true);const {data,error}=await q;if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.videos,[]).filter(x=>admin||x.published!==false);}
  async saveVideo(item){if(this.mode==="supabase"){const payload={title:item.title,category:item.category,video_url:item.video_url,thumbnail_url:item.thumbnail_url,description:item.description,published:item.published,sort_order:Number(item.sort_order)||0};const q=item.id?this.client.from("videos").update(payload).eq("id",item.id):this.client.from("videos").insert(payload);const {error}=await q;if(error)throw error;return;}const arr=localRead(LOCAL_KEYS.videos,[]);if(item.id){const i=arr.findIndex(x=>x.id===item.id);if(i>=0)arr[i]={...arr[i],...item};}else arr.push({...item,id:uid(),created_at:nowISO()});localWrite(LOCAL_KEYS.videos,arr);}
  async deleteVideo(id){if(this.mode==="supabase"){const {error}=await this.client.from("videos").delete().eq("id",id);if(error)throw error;}else localWrite(LOCAL_KEYS.videos,localRead(LOCAL_KEYS.videos,[]).filter(x=>x.id!==id));}

  async listPosts(admin=false){if(this.mode==="supabase"){let q=this.client.from("posts").select("*").order("created_at",{ascending:false});if(!admin)q=q.eq("published",true);const {data,error}=await q;if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.posts,[]).filter(x=>admin||x.published!==false).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")));}
  async savePost(item){if(this.mode==="supabase"){const payload={title:item.title,slug:slugify(item.title),category:item.category,image_url:item.image_url,excerpt:item.excerpt,content:item.content,published:item.published,updated_at:nowISO()};const q=item.id?this.client.from("posts").update(payload).eq("id",item.id):this.client.from("posts").insert(payload);const {error}=await q;if(error)throw error;return;}const arr=localRead(LOCAL_KEYS.posts,[]);if(item.id){const i=arr.findIndex(x=>x.id===item.id);if(i>=0)arr[i]={...arr[i],...item,slug:slugify(item.title),updated_at:nowISO()};}else arr.unshift({...item,id:uid(),slug:slugify(item.title),created_at:nowISO(),updated_at:nowISO()});localWrite(LOCAL_KEYS.posts,arr);}
  async deletePost(id){if(this.mode==="supabase"){const {error}=await this.client.from("posts").delete().eq("id",id);if(error)throw error;}else localWrite(LOCAL_KEYS.posts,localRead(LOCAL_KEYS.posts,[]).filter(x=>x.id!==id));}

  async listComments(postId=null){if(this.mode==="supabase"){let q=this.client.from("comments").select("*").order("created_at",{ascending:false});if(postId)q=q.eq("post_id",postId);const {data,error}=await q;if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.comments,[]).filter(x=>!postId||x.post_id===postId).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
  async addComment(postId,body){const user=await this.currentUser();if(!user)throw new Error("Bạn cần đăng nhập.");if(this.mode==="supabase"){const {error}=await this.client.from("comments").insert({post_id:postId,user_id:user.id,author_name:user.name||user.email,body});if(error)throw error;return;}const arr=localRead(LOCAL_KEYS.comments,[]);arr.unshift({id:uid(),post_id:postId,user_id:user.id,author_name:user.name||user.email,body,created_at:nowISO()});localWrite(LOCAL_KEYS.comments,arr);}
  async deleteComment(id){if(this.mode==="supabase"){const {error}=await this.client.from("comments").delete().eq("id",id);if(error)throw error;}else{const user=await this.currentUser();const arr=localRead(LOCAL_KEYS.comments,[]);const c=arr.find(x=>x.id===id);if(!c||(!user)||(user.role!=="admin"&&c.user_id!==user.id))throw new Error("Bạn không có quyền xóa bình luận này.");localWrite(LOCAL_KEYS.comments,arr.filter(x=>x.id!==id));}}

  async createBooking(item){if(this.mode==="supabase"){const payload={...item,requested_date:item.requested_date||null,email:item.email||null,budget:item.budget||null,message:item.message||null,status:"new"};const {error}=await this.client.from("bookings").insert(payload);if(error)throw error;return;}const arr=localRead(LOCAL_KEYS.bookings,[]);arr.unshift({...item,id:uid(),status:"new",created_at:nowISO(),updated_at:nowISO()});localWrite(LOCAL_KEYS.bookings,arr);}
  async listBookings(){if(this.mode==="supabase"){const {data,error}=await this.client.from("bookings").select("*").order("created_at",{ascending:false});if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.bookings,[]).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
  async updateBookingStatus(id,status){if(this.mode==="supabase"){const {error}=await this.client.from("bookings").update({status,updated_at:nowISO()}).eq("id",id);if(error)throw error;}else{const arr=localRead(LOCAL_KEYS.bookings,[]);const x=arr.find(b=>b.id===id);if(x){x.status=status;x.updated_at=nowISO();localWrite(LOCAL_KEYS.bookings,arr);}}}
  async deleteBooking(id){if(this.mode==="supabase"){const {error}=await this.client.from("bookings").delete().eq("id",id);if(error)throw error;}else localWrite(LOCAL_KEYS.bookings,localRead(LOCAL_KEYS.bookings,[]).filter(x=>x.id!==id));}

  async uploadFile(file){
    if(this.mode==="supabase"){
      const path=`${new Date().toISOString().slice(0,10)}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/,""))}.${file.name.split(".").pop()?.toLowerCase()||"bin"}`;
      const {error}=await this.client.storage.from(this.bucket).upload(path,file,{cacheControl:"31536000",upsert:false,contentType:file.type});if(error)throw error;
      const {data}=this.client.storage.from(this.bucket).getPublicUrl(path);const url=data.publicUrl;
      await this.client.from("media").insert({name:file.name,type:file.type,url,path,size:file.size});return {url,path,type:file.type,name:file.name,size:file.size};
    }
    if(file.type.startsWith("video/"))throw new Error("Local Demo không lưu file video trực tiếp. Hãy dùng URL video hoặc bật Supabase Storage.");
    if(file.size>4*1024*1024)throw new Error("Local Demo chỉ nhận ảnh dưới 4 MB.");
    const url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});const item={id:uid(),name:file.name,type:file.type,url,size:file.size,created_at:nowISO()};const arr=localRead(LOCAL_KEYS.media,[]);arr.unshift(item);localWrite(LOCAL_KEYS.media,arr);return item;
  }
  async listMedia(){if(this.mode==="supabase"){const {data,error}=await this.client.from("media").select("*").order("created_at",{ascending:false});if(error)throw error;return data||[];}return localRead(LOCAL_KEYS.media,[]);}
}

const backend=new LauraBackend();
let currentArticle=null;
let cache={portfolio:[],videos:[],posts:[],comments:[],bookings:[],media:[]};

/* -------------------------
   PUBLIC RENDERERS
------------------------- */
async function renderPortfolio(){try{cache.portfolio=await backend.listPortfolio(false);const grid=$("#portfolioGrid"),empty=$("#portfolioEmpty");if(!grid)return;grid.innerHTML=cache.portfolio.map((x,i)=>`<button class="gallery-card ${esc(x.layout||"normal")}" data-image-id="${esc(x.id)}" type="button" aria-label="Mở ảnh ${esc(x.title)}"><img src="${esc(x.image_url||x.image||"")}" alt="${esc(x.alt||x.title||x.category||"Portfolio")}" loading="lazy" decoding="async"><span>${esc(x.category||"Portfolio")} / ${String(i+1).padStart(2,"0")}</span></button>`).join("");empty.hidden=cache.portfolio.length>0;grid.querySelectorAll("[data-image-id]").forEach(b=>b.addEventListener("click",()=>{const x=cache.portfolio.find(i=>String(i.id)===b.dataset.imageId);if(x){$("#modalImage").src=x.image_url||x.image||"";$("#modalImage").alt=x.title||"Portfolio";openModal("imageModal");}}));}catch(e){console.error(e);toast("Không tải được Portfolio","error");}}
function youtubeId(url){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];if(u.hostname.includes("youtube.com")){if(u.pathname.startsWith("/shorts/"))return u.pathname.split("/")[2];return u.searchParams.get("v");}}catch{}return null;}
function vimeoId(url){const m=String(url||"").match(/vimeo\.com\/(?:video\/)?(\d+)/);return m?m[1]:null;}
function videoThumb(x){return x.thumbnail_url||x.thumbnail|| (youtubeId(x.video_url||x.url)?`https://i.ytimg.com/vi/${youtubeId(x.video_url||x.url)}/hqdefault.jpg`:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80");}
function videoEmbed(url){const y=youtubeId(url);if(y)return `<iframe src="https://www.youtube-nocookie.com/embed/${esc(y)}?autoplay=1&rel=0" title="Video L'Aura" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;const v=vimeoId(url);if(v)return `<iframe src="https://player.vimeo.com/video/${esc(v)}?autoplay=1" title="Video L'Aura" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;return `<video src="${esc(url)}" controls autoplay playsinline></video>`;}
async function renderVideos(){try{cache.videos=await backend.listVideos(false);const grid=$("#videoGrid"),empty=$("#videoEmpty");if(!grid)return;grid.innerHTML=cache.videos.map(x=>`<button class="video-card" data-video-id="${esc(x.id)}" type="button"><div class="video-thumb"><img src="${esc(videoThumb(x))}" alt="${esc(x.title||"Video")}" loading="lazy"><div class="play-badge"><span>▶</span></div></div><div class="video-meta"><small>${esc(x.category||"Film")}</small><h3>${esc(x.title||"Untitled")}</h3><p>${esc(x.description||"")}</p></div></button>`).join("");empty.hidden=cache.videos.length>0;grid.querySelectorAll("[data-video-id]").forEach(b=>b.addEventListener("click",()=>openVideo(cache.videos.find(x=>String(x.id)===b.dataset.videoId))));}catch(e){console.error(e);}}
function openVideo(x){if(!x)return;$("#videoPlayer").innerHTML=videoEmbed(x.video_url||x.url||"");$("#videoModalCategory").textContent=x.category||"Film";$("#videoModalTitle").textContent=x.title||"";$("#videoModalDescription").textContent=x.description||"";openModal("videoModal");}
async function renderBlog(category="all"){try{cache.posts=await backend.listPosts(false);const posts=cache.posts.filter(p=>category==="all"||p.category===category);const grid=$("#blogGrid"),empty=$("#blogEmpty");if(!grid)return;grid.innerHTML=posts.map(p=>`<article class="blog-card" data-post-id="${esc(p.id)}" tabindex="0"><img src="${esc(p.image_url||p.image||"")}" alt="${esc(p.title)}" loading="lazy" decoding="async"><div class="blog-card-body"><div class="blog-card-meta"><span>${esc(p.category||"Studio")}</span><span>${esc(fmtDate(p.created_at||p.date))}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||"")}</p><span class="blog-card-more">Đọc bài viết ↗</span></div></article>`).join("");empty.hidden=posts.length>0;grid.querySelectorAll("[data-post-id]").forEach(card=>{const go=()=>openArticle(cache.posts.find(p=>String(p.id)===card.dataset.postId));card.addEventListener("click",go);card.addEventListener("keydown",e=>{if(e.key==="Enter")go();});});}catch(e){console.error(e);}}
async function openArticle(post){if(!post)return;currentArticle=post;$("#articleImage").src=post.image_url||post.image||"";$("#articleImage").alt=post.title||"";$("#articleCategory").textContent=post.category||"";$("#articleTitle").textContent=post.title||"";$("#articleDate").textContent=fmtDate(post.created_at||post.date);$("#articleContent").textContent=post.content||"";await renderComments();await refreshCommentUI();openModal("articleModal");}
async function renderComments(){if(!currentArticle)return;cache.comments=await backend.listComments(currentArticle.id);const user=await backend.currentUser();const isAdmin=user?.role==="admin";$("#commentList").innerHTML=cache.comments.length?cache.comments.map(c=>`<div class="comment-item"><div class="comment-head"><span class="comment-author">${esc(c.author_name||"User")}</span><span class="comment-date">${esc(fmtDate(c.created_at))}</span></div><div class="comment-body">${esc(c.body)}</div>${user&&(isAdmin||String(c.user_id)===String(user.id))?`<button class="comment-delete" data-comment-delete="${esc(c.id)}">Xóa bình luận</button>`:""}</div>`).join(""):'<p class="empty-state">Chưa có bình luận.</p>';$("#commentList").querySelectorAll("[data-comment-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Xóa bình luận này?"))return;try{await backend.deleteComment(b.dataset.commentDelete);await renderComments();if(isAdmin)await renderAdminComments();toast("Đã xóa bình luận.");}catch(e){toast(e.message||"Không thể xóa.","error");}}));}
async function refreshCommentUI(){const user=await backend.currentUser();$("#commentLoginMessage").hidden=!!user;$("#commentForm").hidden=!user;$("#commentUserName").textContent=user?`Đang bình luận với tư cách: ${user.name||user.email}`:"";}

/* -------------------------
   ACCOUNT
------------------------- */
async function renderAccount(){const user=await backend.currentUser();$("#loginView").hidden=!!user;$("#registerView").hidden=true;$("#profileView").hidden=!user;if(user){$("#profileName").textContent=user.name||user.email;$("#profileEmail").textContent=user.email;$("#profileRole").textContent=user.role||"user";}await refreshCommentUI();}
function showLogin(){ $("#loginView").hidden=false; $("#registerView").hidden=true; $("#profileView").hidden=true; }
function showRegister(){ $("#loginView").hidden=true; $("#registerView").hidden=false; $("#profileView").hidden=true; }
function initAccount(){
  $("#accountOpen")?.addEventListener("click",async()=>{await renderAccount();openModal("accountModal");});
  $("#showRegister")?.addEventListener("click",showRegister);$("#showLogin")?.addEventListener("click",showLogin);$("#commentLoginMessage")?.addEventListener("click",async()=>{await renderAccount();openModal("accountModal");});
  $("#registerForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);$("#registerError").textContent="";try{await backend.signUp($("#registerName").value.trim(),$("#registerEmail").value.trim(),$("#registerPassword").value);await renderAccount();toast(backend.mode==="supabase"?"Tài khoản đã được tạo. Nếu bật xác minh email, hãy kiểm tra hộp thư.":"Đã tạo tài khoản.");}catch(err){$("#registerError").textContent=err.message||"Không thể đăng ký.";}finally{setBusy(f,false);}});
  $("#loginForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);$("#loginError").textContent="";try{await backend.signIn($("#loginEmail").value.trim(),$("#loginPassword").value);await renderAccount();toast("Đăng nhập thành công.");}catch(err){$("#loginError").textContent=err.message||"Đăng nhập thất bại.";}finally{setBusy(f,false);}});
  $("#logoutUser")?.addEventListener("click",async()=>{await backend.signOut();await renderAccount();closeModal("accountModal");toast("Đã đăng xuất.");});
  $("#commentForm")?.addEventListener("submit",async e=>{e.preventDefault();const body=$("#commentText").value.trim();if(!body||!currentArticle)return;try{await backend.addComment(currentArticle.id,body);$("#commentText").value="";await renderComments();toast("Đã đăng bình luận.");}catch(err){toast(err.message||"Không thể bình luận.","error");}});
}

/* -------------------------
   BOOKING
------------------------- */
function initBooking(){$("#bookingForm")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);const data=Object.fromEntries(fd.entries());delete data.consent;data.name=String(data.name||"").trim();data.phone=String(data.phone||"").trim();data.email=String(data.email||"").trim();data.message=String(data.message||"").trim();if(!data.name||!data.phone)return;setBusy(form,true);$("#bookingNote").textContent="";try{await backend.createBooking(data);form.reset();$("#bookingNote").textContent="Cảm ơn bạn. Yêu cầu đã được ghi nhận và chuyển vào pipeline của Studio.";toast("Đã gửi yêu cầu đặt lịch.");}catch(err){$("#bookingNote").textContent="";toast(err.message||"Không thể gửi yêu cầu.","error");}finally{setBusy(form,false);}});}

/* -------------------------
   MEDIA UPLOAD HELPER
------------------------- */
async function fileOrUrl(fileInput,urlValue){const file=fileInput?.files?.[0];if(file){const uploaded=await backend.uploadFile(file);return uploaded.url;}return String(urlValue||"").trim();}

/* -------------------------
   ADMIN
------------------------- */
async function initAdminLoginState(){const mode=$("#adminModeText"),boot=$("#bootstrapAdmin");if(mode)mode.textContent=backend.mode==="supabase"?"Backend: Supabase Auth + PostgreSQL + Storage. Admin được xác định bởi profiles.role = 'admin'.":"Backend: Local Demo. Dữ liệu chỉ tồn tại trên trình duyệt này; hãy cấu hình Supabase trước khi production.";if(boot)boot.hidden=backend.mode!=="local"||await backend.hasLocalAdmin();}
async function openAdmin(){await initAdminLoginState();const user=await backend.currentUser();if(user?.role==="admin")await showAdminDashboard();else{$("#adminLoginView").hidden=false;$("#adminDashboard").hidden=true;if(user?.email)$("#adminEmail").value=user.email;}openModal("adminModal");}
async function showAdminDashboard(){const user=await backend.currentUser();if(!user||user.role!=="admin")throw new Error("Tài khoản không có quyền Admin.");$("#adminLoginView").hidden=true;$("#adminDashboard").hidden=false;$("#modeBadge").textContent=backend.mode==="supabase"?"Supabase Production":"Local Demo";$("#backendStatusText").textContent=backend.mode==="supabase"?"Backend đã kết nối. Auth, RLS, database và Storage hoạt động trên server; dữ liệu được chia sẻ giữa các thiết bị.":"Bạn đang ở Local Demo. Chức năng chạy đầy đủ để thử nghiệm nhưng không phải môi trường production và không đồng bộ sang thiết bị khác.";await refreshAdminAll();}
function activateTab(name){$$(".admin-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".admin-view").forEach(v=>v.classList.toggle("active",v.dataset.view===name));if(name==="bookings")renderAdminBookings();if(name==="portfolio")renderAdminPortfolio();if(name==="videos")renderAdminVideos();if(name==="posts")renderAdminPosts();if(name==="comments")renderAdminComments();if(name==="media")renderMediaLibrary();}
async function refreshAdminAll(){await Promise.all([loadAdminBookings(),loadAdminPortfolio(),loadAdminVideos(),loadAdminPosts(),loadAdminComments(),loadMedia()]);renderOverview();renderAdminBookings();renderAdminPortfolio();renderAdminVideos();renderAdminPosts();renderAdminComments();renderMediaLibrary();}
async function loadAdminBookings(){cache.bookings=await backend.listBookings();}async function loadAdminPortfolio(){cache.adminPortfolio=await backend.listPortfolio(true);}async function loadAdminVideos(){cache.adminVideos=await backend.listVideos(true);}async function loadAdminPosts(){cache.adminPosts=await backend.listPosts(true);}async function loadAdminComments(){cache.adminComments=await backend.listComments();}async function loadMedia(){cache.media=await backend.listMedia();}
function renderOverview(){const counts={Bookings:cache.bookings?.length||0,New:cache.bookings?.filter(x=>x.status==="new").length||0,Portfolio:cache.adminPortfolio?.length||0,Videos:cache.adminVideos?.length||0,Posts:cache.adminPosts?.length||0,Comments:cache.adminComments?.length||0};$("#overviewStats").innerHTML=Object.entries(counts).map(([k,v])=>`<div class="stat-card"><b>${v}</b><span>${esc(k)}</span></div>`).join("");}
const statusLabel={new:"Mới",contacted:"Đã liên hệ",deposit:"Đã cọc",booked:"Đã chốt lịch",shooting:"Đang sản xuất",post:"Hậu kỳ",complete:"Hoàn thành",cancelled:"Đã hủy"};
function renderAdminBookings(){const list=$("#adminBookingList");if(!list)return;const q=($("#bookingSearch")?.value||"").toLowerCase();const status=$("#bookingStatusFilter")?.value||"all";const items=(cache.bookings||[]).filter(x=>(status==="all"||x.status===status)&&(!q||[x.name,x.phone,x.email,x.service].join(" ").toLowerCase().includes(q)));list.innerHTML=items.length?items.map(x=>`<article class="booking-card"><div class="booking-card-top"><div><h4>${esc(x.name)}</h4><small>${esc(fmtDate(x.created_at))} · ${esc(statusLabel[x.status]||x.status)}</small></div><div>${esc(x.service||"")}</div></div><div class="booking-meta"><div><span>PHONE</span><p>${esc(x.phone||"")}</p></div><div><span>EMAIL</span><p>${esc(x.email||"—")}</p></div><div><span>DATE</span><p>${esc(x.requested_date||"—")}</p></div><div><span>BUDGET</span><p>${esc(x.budget||"—")}</p></div></div><p class="booking-message">${esc(x.message||"")}</p><div class="booking-actions"><select data-booking-status="${esc(x.id)}">${Object.entries(statusLabel).map(([v,l])=>`<option value="${v}" ${x.status===v?"selected":""}>${l}</option>`).join("")}</select><button class="btn btn-outline" data-booking-delete="${esc(x.id)}" type="button">Xóa</button></div></article>`).join(""):'<p class="empty-state">Không có booking phù hợp.</p>';list.querySelectorAll("[data-booking-status]").forEach(s=>s.addEventListener("change",async()=>{try{await backend.updateBookingStatus(s.dataset.bookingStatus,s.value);await loadAdminBookings();renderAdminBookings();renderOverview();toast("Đã cập nhật pipeline.");}catch(e){toast(e.message,"error");}}));list.querySelectorAll("[data-booking-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Xóa booking này?"))return;try{await backend.deleteBooking(b.dataset.bookingDelete);await loadAdminBookings();renderAdminBookings();renderOverview();toast("Đã xóa booking.");}catch(e){toast(e.message,"error");}}));}
function renderAdminPortfolio(){const list=$("#portfolioAdminList");if(!list)return;list.innerHTML=(cache.adminPortfolio||[]).length?(cache.adminPortfolio||[]).map(x=>`<div class="admin-row"><img src="${esc(x.image_url||x.image||"")}" alt=""><div><h4>${esc(x.title)}</h4><p>${esc(x.category)} · ${esc(x.layout)} · ${x.published===false?"Draft":"Published"}</p></div><div class="admin-row-actions"><button data-edit-portfolio="${esc(x.id)}">Sửa</button><button class="danger" data-delete-portfolio="${esc(x.id)}">Xóa</button></div></div>`).join(""):'<p class="empty-state">Chưa có portfolio.</p>';list.querySelectorAll("[data-edit-portfolio]").forEach(b=>b.addEventListener("click",()=>fillPortfolio(cache.adminPortfolio.find(x=>String(x.id)===b.dataset.editPortfolio))));list.querySelectorAll("[data-delete-portfolio]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Xóa ảnh này?"))return;try{await backend.deletePortfolio(b.dataset.deletePortfolio);await loadAdminPortfolio();await renderPortfolio();renderAdminPortfolio();renderOverview();toast("Đã xóa ảnh.");}catch(e){toast(e.message,"error");}}));}
function fillPortfolio(x=null){const f=$("#portfolioForm");f.hidden=false;f.reset();$("#portfolioId").value=x?.id||"";$("#portfolioTitle").value=x?.title||"";$("#portfolioCategory").value=x?.category||"";$("#portfolioLayout").value=x?.layout||"normal";$("#portfolioSort").value=x?.sort_order||0;$("#portfolioUrl").value=x?.image_url||x?.image||"";$("#portfolioPublished").checked=x?.published!==false;f.scrollIntoView({behavior:"smooth",block:"center"});}
function renderAdminVideos(){const list=$("#videoAdminList");if(!list)return;list.innerHTML=(cache.adminVideos||[]).length?(cache.adminVideos||[]).map(x=>`<div class="admin-row"><img src="${esc(videoThumb(x))}" alt=""><div><h4>${esc(x.title)}</h4><p>${esc(x.category||"Film")} · ${x.published===false?"Draft":"Published"}</p></div><div class="admin-row-actions"><button data-edit-video="${esc(x.id)}">Sửa</button><button class="danger" data-delete-video="${esc(x.id)}">Xóa</button></div></div>`).join(""):'<p class="empty-state">Chưa có video.</p>';list.querySelectorAll("[data-edit-video]").forEach(b=>b.addEventListener("click",()=>fillVideo(cache.adminVideos.find(x=>String(x.id)===b.dataset.editVideo))));list.querySelectorAll("[data-delete-video]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Xóa video này?"))return;try{await backend.deleteVideo(b.dataset.deleteVideo);await loadAdminVideos();await renderVideos();renderAdminVideos();renderOverview();toast("Đã xóa video.");}catch(e){toast(e.message,"error");}}));}
function fillVideo(x=null){const f=$("#videoForm");f.hidden=false;f.reset();$("#videoId").value=x?.id||"";$("#videoTitle").value=x?.title||"";$("#videoCategory").value=x?.category||"";$("#videoUrl").value=x?.video_url||x?.url||"";$("#videoThumb").value=x?.thumbnail_url||x?.thumbnail||"";$("#videoDescription").value=x?.description||"";$("#videoPublished").checked=x?.published!==false;f.scrollIntoView({behavior:"smooth",block:"center"});}
function renderAdminPosts(){const list=$("#postAdminList");if(!list)return;list.innerHTML=(cache.adminPosts||[]).length?(cache.adminPosts||[]).map(x=>`<div class="admin-row"><img src="${esc(x.image_url||x.image||"")}" alt=""><div><h4>${esc(x.title)}</h4><p>${esc(x.category)} · ${esc(fmtDate(x.created_at))} · ${x.published===false?"Draft":"Published"}</p></div><div class="admin-row-actions"><button data-edit-post="${esc(x.id)}">Sửa</button><button class="danger" data-delete-post="${esc(x.id)}">Xóa</button></div></div>`).join(""):'<p class="empty-state">Chưa có bài viết.</p>';list.querySelectorAll("[data-edit-post]").forEach(b=>b.addEventListener("click",()=>fillPost(cache.adminPosts.find(x=>String(x.id)===b.dataset.editPost))));list.querySelectorAll("[data-delete-post]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Xóa bài viết này? Bình luận liên quan cũng có thể bị xóa theo database cascade."))return;try{await backend.deletePost(b.dataset.deletePost);await loadAdminPosts();await renderBlog("all");renderAdminPosts();renderOverview();toast("Đã xóa bài viết.");}catch(e){toast(e.message,"error");}}));}
function fillPost(x=null){const f=$("#postForm");f.hidden=false;f.reset();$("#postId").value=x?.id||"";$("#postTitle").value=x?.title||"";$("#postCategory").value=x?.category||"Photography";$("#postImage").value=x?.image_url||x?.image||"";$("#postExcerpt").value=x?.excerpt||"";$("#postContent").value=x?.content||"";$("#postPublished").checked=x?.published!==false;f.scrollIntoView({behavior:"smooth",block:"center"});}
async function renderAdminComments(){const list=$("#adminCommentList");if(!list)return;const posts=cache.adminPosts||await backend.listPosts(true);const postMap=new Map(posts.map(p=>[String(p.id),p.title]));list.innerHTML=(cache.adminComments||[]).length?(cache.adminComments||[]).map(c=>`<div class="admin-row no-thumb"><div><h4>${esc(c.author_name||"User")}</h4><p>${esc(postMap.get(String(c.post_id))||"Bài viết")} · ${esc(fmtDate(c.created_at))}</p><small>${esc(c.body)}</small></div><div class="admin-row-actions"><button class="danger" data-admin-comment-delete="${esc(c.id)}">Xóa</button></div></div>`).join(""):'<p class="empty-state">Chưa có bình luận.</p>';list.querySelectorAll("[data-admin-comment-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Admin xóa bình luận này?"))return;try{await backend.deleteComment(b.dataset.adminCommentDelete);await loadAdminComments();renderAdminComments();renderOverview();if(currentArticle)await renderComments();toast("Đã xóa bình luận.");}catch(e){toast(e.message,"error");}}));}
function renderMediaLibrary(){const grid=$("#mediaGrid");if(!grid)return;grid.innerHTML=(cache.media||[]).length?(cache.media||[]).map(m=>`<div class="media-item"><div class="media-preview">${String(m.type||"").startsWith("video/")?`<video src="${esc(m.url)}" muted preload="metadata"></video>`:`<img src="${esc(m.url)}" alt="${esc(m.name||"Media")}" loading="lazy">`}</div><div class="media-item-copy"><p title="${esc(m.url)}">${esc(m.name||m.path||"Media")}</p><small>${esc(m.type||"")}</small><button class="btn btn-outline" data-copy-media="${esc(m.url)}" type="button">Copy URL</button></div></div>`).join(""):'<p class="empty-state">Media Library trống.</p>';grid.querySelectorAll("[data-copy-media]").forEach(b=>b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(b.dataset.copyMedia);toast("Đã copy URL.");}catch{toast("Không copy được URL.","error");}}));}

function initAdmin(){
  $("#adminOpen")?.addEventListener("click",openAdmin);
  $("#adminLoginForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);$("#adminError").textContent="";try{const user=await backend.signIn($("#adminEmail").value.trim(),$("#adminPassword").value);if(user?.role!=="admin")throw new Error("Tài khoản này không có quyền Admin.");await showAdminDashboard();}catch(err){$("#adminError").textContent=err.message||"Không thể đăng nhập Admin.";}finally{setBusy(f,false);}});
  $("#bootstrapAdmin")?.addEventListener("click",async()=>{try{const admin=await backend.bootstrapLocalAdmin($("#adminEmail").value.trim(),$("#adminPassword").value);toast("Đã khởi tạo Admin demo.");await initAdminLoginState();await showAdminDashboard();}catch(e){$("#adminError").textContent=e.message;}});
  $("#adminLogout")?.addEventListener("click",async()=>{await backend.signOut();$("#adminDashboard").hidden=true;$("#adminLoginView").hidden=false;await initAdminLoginState();toast("Đã đăng xuất Admin.");});
  $("#adminTabs")?.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)activateTab(b.dataset.tab);});
  $$('[data-go-tab]').forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.goTab)));
  $("#bookingSearch")?.addEventListener("input",renderAdminBookings);$("#bookingStatusFilter")?.addEventListener("change",renderAdminBookings);
  $("#addPortfolio")?.addEventListener("click",()=>fillPortfolio());$("#cancelPortfolio")?.addEventListener("click",()=>$("#portfolioForm").hidden=true);
  $("#portfolioForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);try{const image_url=await fileOrUrl($("#portfolioFile"),$("#portfolioUrl").value);if(!image_url)throw new Error("Cần Image URL hoặc file ảnh.");await backend.savePortfolio({id:$("#portfolioId").value||null,title:$("#portfolioTitle").value.trim(),category:$("#portfolioCategory").value.trim(),layout:$("#portfolioLayout").value,sort_order:$("#portfolioSort").value,image_url,published:$("#portfolioPublished").checked});f.hidden=true;await loadAdminPortfolio();await loadMedia();await renderPortfolio();renderAdminPortfolio();renderOverview();toast("Đã lưu Portfolio.");}catch(err){toast(err.message||"Không thể lưu.","error");}finally{setBusy(f,false);}});
  $("#addVideo")?.addEventListener("click",()=>fillVideo());$("#cancelVideo")?.addEventListener("click",()=>$("#videoForm").hidden=true);
  $("#videoForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);try{let thumbnail_url=await fileOrUrl($("#videoThumbFile"),$("#videoThumb").value);await backend.saveVideo({id:$("#videoId").value||null,title:$("#videoTitle").value.trim(),category:$("#videoCategory").value.trim(),video_url:$("#videoUrl").value.trim(),thumbnail_url,description:$("#videoDescription").value.trim(),published:$("#videoPublished").checked});f.hidden=true;await loadAdminVideos();await loadMedia();await renderVideos();renderAdminVideos();renderOverview();toast("Đã lưu Video.");}catch(err){toast(err.message||"Không thể lưu video.","error");}finally{setBusy(f,false);}});
  $("#addPost")?.addEventListener("click",()=>fillPost());$("#cancelPost")?.addEventListener("click",()=>$("#postForm").hidden=true);
  $("#postForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;setBusy(f,true);try{const image_url=await fileOrUrl($("#postImageFile"),$("#postImage").value);await backend.savePost({id:$("#postId").value||null,title:$("#postTitle").value.trim(),category:$("#postCategory").value,image_url,excerpt:$("#postExcerpt").value.trim(),content:$("#postContent").value.trim(),published:$("#postPublished").checked});f.hidden=true;await loadAdminPosts();await loadMedia();await renderBlog("all");renderAdminPosts();renderOverview();toast("Đã lưu bài viết.");}catch(err){toast(err.message||"Không thể lưu bài.","error");}finally{setBusy(f,false);}});
  $("#mediaUploadForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,file=$("#mediaFile").files?.[0];if(!file)return;setBusy(f,true);$("#mediaUploadNote").textContent="";try{const result=await backend.uploadFile(file);$("#mediaUploadNote").textContent=`Đã upload: ${result.url}`;f.reset();await loadMedia();renderMediaLibrary();toast("Upload thành công.");}catch(err){toast(err.message||"Upload thất bại.","error");}finally{setBusy(f,false);}});
}

/* -------------------------
   START
------------------------- */
async function start(){
  applyConfig();initChrome();await backend.init();initAccount();initBooking();initAdmin();
  $("#blogFilters")?.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;$$('.filter-btn').forEach(x=>x.classList.toggle("active",x===b));renderBlog(b.dataset.category);});
  await Promise.all([renderPortfolio(),renderVideos(),renderBlog("all"),renderAccount()]);
  if(backend.mode==="supabase") backend.client.auth.onAuthStateChange(()=>{renderAccount();});
}

document.addEventListener("DOMContentLoaded",start);
