const SID="1QIpcfgOVCFjcCmgU_DXKn8h7Bfa8rm2q2wB2HneTvKs",AID="1oHFpXqVDPRF3Vi3WV9MdNcxkHNjgytLPxXUQgM6o1ok";
const S="Sheet1", AS={pay:"DEBTOR",cn:"CN SAP",dn:"DN SAP",ret:"SALE RETURN"};
let role="ADMIN",user="",charts={};let LOOK={};
const $=x=>document.getElementById(x), N=x=>String(x??"").trim().toLowerCase().replace(/\s+/g," "),
M=x=>"₹"+(Number(x)||0).toLocaleString("en-IN",{maximumFractionDigits:0}),
E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function qdate(d){return `date '${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}'`}
async function Q(id,sheet,tq){let u=`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&tq=${encodeURIComponent(tq)}`,r=await fetch(u);if(!r.ok)throw Error(sheet+" query failed");return csv(await r.text())}
function csv(t){let R=[],r=[],c="",q=0;for(let i=0;i<t.length;i++){let x=t[i],y=t[i+1];if(x=='"'&&q&&y=='"'){c+='"';i++;continue}if(x=='"'){q=!q;continue}if(x==","&&!q){r.push(c);c="";continue}if((x=="\n"||x=="\r")&&!q){if(x=="\r"&&y=="\n")i++;r.push(c);c="";if(r.some(v=>v.trim()))R.push(r);r=[];continue}c+=x}if(c||r.length){r.push(c);R.push(r)}let h=R.shift().map(x=>x.trim());return R.map(a=>Object.fromEntries(h.map((k,i)=>[k,a[i]??""])))}
const vals=r=>Object.values(r),num=v=>{let x=parseFloat(String(v??"").replace(/[₹,\s]/g,""));return isNaN(x)?0:x};
function escq(s){return String(s??"").replace(/'/g,"''")}
function opts(id,a){$(id).innerHTML='<option>ALL</option>'+[...new Set(a.filter(Boolean))].sort().map(x=>`<option>${E(x)}</option>`).join("")}
async function loginLookups(){
 try{
  $("status").textContent="Loading small lookup lists only…";
  let [sh,party,state,group,fy,month]=await Promise.all([
   Q(SID,S,"select A where A is not null group by A label A ''"),
   Q(SID,S,"select F where F is not null group by F label F ''"),
   Q(SID,S,"select L where L is not null group by L label L ''"),
   Q(SID,S,"select K where K is not null group by K label K ''"),
   Q(SID,S,"select B where B is not null group by B label B ''"),
   Q(SID,S,"select C where C is not null group by C label C ''")
  ]);
  LOOK={sh:sh.map(x=>vals(x)[0]),party:party.map(x=>vals(x)[0]),state:state.map(x=>vals(x)[0]),group:group.map(x=>vals(x)[0]),fy:fy.map(x=>vals(x)[0]),month:month.map(x=>vals(x)[0])};
  fillUsers();fillFilters();$("status").textContent="Ready. No full Sales sheet has been downloaded.";
 }catch(e){$("status").textContent="Google Sheet access failed. Set both files to Anyone with link → Viewer.";console.error(e)}
}
function fillUsers(){let r=$("role").value,a=r==="STATE HEAD"?LOOK.sh:r==="PARTY"?LOOK.party:[];$("user").innerHTML='<option value="">Select</option>'+a.map(x=>`<option>${E(x)}</option>`).join("");$("userWrap").style.display=r==="ADMIN"?"none":"block"}
function fillFilters(){opts("sh",LOOK.sh);opts("party",LOOK.party);opts("state",LOOK.state);opts("group",LOOK.group);opts("fy",LOOK.fy);opts("month",LOOK.month)}
function baseWhere(extra=""){let w=[];if(role==="STATE HEAD")w.push(`A='${escq(user)}'`);if(role==="PARTY")w.push(`F='${escq(user)}'`);
 [["sh","A"],["state","L"],["group","K"],["party","F"],["fy","B"],["month","C"]].forEach(([id,col])=>{if($(id).value!=="ALL")w.push(`${col}='${escq($(id).value)}'`)});
 if($("from").value)w.push(`D>=${qdate(new Date($("from").value))}`);
 if($("to").value)w.push(`D<=${qdate(new Date($("to").value))}`);
 if(extra)w.push(extra);return w.length?" where "+w.join(" and "):""
}
async function acc(sheet){
 let p=sheet==="DEBTOR"?"B":"E",a=sheet==="SALE RETURN"?"F":"D";
 let rows=await Q(AID,sheet,`select ${p},sum(${a}) where ${p} is not null group by ${p} label sum(${a}) ''`);
 let total=rows.reduce((s,r)=>s+num(vals(r)[1]),0);
 let n=new Date(),st=new Date(n.getFullYear(),n.getMonth(),1),nx=new Date(n.getFullYear(),n.getMonth()+1,1);
 let mr=await Q(AID,sheet,`select sum(${a}) where A>=${qdate(st)} and A<${qdate(nx)} label sum(${a}) ''`);
 return {rows,total,month:num(mr[0]?vals(mr[0])[0]:0)}
}
async function dashboard(){
 $("loadbar").textContent="Loading compact summaries…";
 let n=new Date(),st=new Date(n.getFullYear(),n.getMonth(),1),nx=new Date(n.getFullYear(),n.getMonth()+1,1),w=baseWhere();
 let [s,party,months,cm]=await Promise.all([
  Q(SID,S,`select A,L,K,sum(J) ${w} group by A,L,K label sum(J) ''`),
  Q(SID,S,`select F,A,L,sum(J) ${w} group by F,A,L label sum(J) ''`),
  Q(SID,S,`select B,sum(J) ${w} group by B label sum(J) ''`),
  Q(SID,S,`select sum(J) ${baseWhere(`D>=${qdate(st)} and D<${qdate(nx)}`)} label sum(J) ''`)
 ]);
 let [pay,cn,dn,ret]=await Promise.all([acc(AS.pay),acc(AS.cn),acc(AS.dn),acc(AS.ret)]);
 let sales=cm[0]?num(vals(cm[0])[0])*1.18:0;
 let totalSales=party.reduce((z,r)=>z+num(vals(r)[3])*1.18,0);
 let outstanding=totalSales+dn.total-pay.total-cn.total-ret.total;
 $("salesK").textContent=M(sales);$("collectionK").textContent=M(pay.month);$("outK").textContent=M(outstanding);
 $("cnK").textContent=M(cn.total);$("dnK").textContent=M(dn.total);$("retK").textContent=M(ret.total);
 $("overK").textContent="Click";
 renderParty(party,pay,cn,dn,ret);renderCharts(s,months);
 $("loadbar").textContent="FAST MODE: full 2 lakh-row Sales sheet was NOT downloaded."
}
function renderParty(s,p,c,d,r){
 let m=new Map();
 for(let x of s){let v=vals(x),k=N(v[0]);if(!m.has(k))m.set(k,{p:v[0],sh:v[1],st:v[2],sales:0,pay:0,cn:0,dn:0,ret:0});m.get(k).sales+=num(v[3])*1.18}
 for(let [key,o] of [["pay",p],["cn",c],["dn",d],["ret",r]])for(let x of o.rows){let v=vals(x),k=N(v[0]);if(!m.has(k))m.set(k,{p:v[0],sh:"",st:"",sales:0,pay:0,cn:0,dn:0,ret:0});m.get(k)[key]+=num(v[1])}
 let rows=[...m.values()].map(x=>({...x,out:x.sales+x.dn-x.pay-x.cn-x.ret})).sort((a,b)=>b.out-a.out);window.PARTIES=rows;
 if(rows.length){$("topK").textContent=M(rows[0].sales);$("topParty").textContent=rows[0].p}
 $("partyRows").innerHTML=rows.slice(0,150).map(x=>`<tr><td class="link" onclick='partyDetail(${JSON.stringify(x.p)})'>${E(x.p)}</td><td>${E(x.sh)}</td><td>${E(x.st)}</td><td>${M(x.sales)}</td><td>${M(x.pay)}</td><td>${M(x.cn)}</td><td>${M(x.dn)}</td><td>${M(x.ret)}</td><td><b>${M(x.out)}</b></td></tr>`).join("")
}
function chart(id,type,labels,data,label){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data:{labels,datasets:[{label,data,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false}})}
function renderCharts(s,m){
 let sh={},st={},mo={},gr={};for(let x of s){let v=vals(x),z=num(v[3])*1.18;sh[v[0]]=(sh[v[0]]||0)+z;st[v[1]]=(st[v[1]]||0)+z;gr[v[2]]=(gr[v[2]]||0)+z}
 for(let x of m){let v=vals(x);mo[v[0]]=(mo[v[0]]||0)+num(v[1])*1.18}
 chart("shChart","bar",Object.keys(sh).slice(0,15),Object.values(sh).slice(0,15),"Sales");
 chart("stateChart","bar",Object.keys(st).slice(0,15),Object.values(st).slice(0,15),"Sales");
 chart("monthChart","bar",Object.keys(mo),Object.values(mo),"Sales");
 chart("groupChart","doughnut",Object.keys(gr).slice(0,12),Object.values(gr).slice(0,12),"Sales");
 let p=(window.PARTIES||[]).slice(0,10);chart("outChart","doughnut",p.map(x=>x.p),p.map(x=>Math.max(0,x.out)),"Outstanding");chart("partyChart","bar",p.map(x=>x.p),p.map(x=>x.sales),"Sales")
}
async function partyDetail(p){
 $("mtitle").textContent=p;$("mbody").innerHTML="Loading only this party's sales…";$("modal").classList.remove("hide");
 let rows=await Q(SID,S,`select D,E,G,K,H,I,J,L,A where F='${escq(p)}' order by D desc`);
 let b=rows.map(x=>{let v=vals(x);return`<tr><td>${E(v[0])}</td><td class="link" onclick='invoiceDetail(${JSON.stringify(v[1])},${JSON.stringify(p)})'>${E(v[1])}</td><td>${E(v[2])}</td><td>${E(v[3])}</td><td>${E(v[4])}</td><td>${M(v[6])}</td><td>${E(v[7])}</td><td>${E(v[8])}</td></tr>`}).join("");
 $("mbody").innerHTML=`<div class="age"><div>Party<b>${E(p)}</b></div><div>Rows<b>${rows.length}</b></div><div>Invoices<b>${new Set(rows.map(x=>vals(x)[1])).size}</b></div><div>Taxable<b>${M(rows.reduce((z,x)=>z+num(vals(x)[6]),0))}</b></div><div>GST-inclusive<b>${M(rows.reduce((z,x)=>z+num(vals(x)[6])*1.18,0))}</b></div></div><table><thead><tr><th>Date</th><th>Invoice</th><th>Item Code</th><th>Group</th><th>Qty</th><th>Taxable</th><th>State</th><th>State Head</th></tr></thead><tbody>${b}</tbody></table>`
}
async function invoiceDetail(inv,p){
 let rows=await Q(SID,S,`select D,E,F,G,K,H,I,J,L,A where E='${escq(inv)}' and F='${escq(p)}' order by D`);
 let b=rows.map(x=>{let v=vals(x),t=num(v[7]);return`<tr><td>${E(v[0])}</td><td>${E(v[2])}</td><td>${E(v[3])}</td><td>${E(v[4])}</td><td>${E(v[5])}</td><td>${M(v[6])}</td><td>${M(t*.18)}</td><td>${M(t*1.18)}</td></tr>`}).join("");
 $("mtitle").textContent="Invoice "+inv;$("mbody").innerHTML=`<h3>${E(p)}</h3><table><thead><tr><th>Date</th><th>Item Code</th><th>Group</th><th>Qty</th><th>Sale Rate</th><th>Taxable</th><th>GST 18%</th><th>Total</th></tr></thead><tbody>${b}</tbody></table>`
}
async function card(type){
 $("modal").classList.remove("hide");$("mtitle").textContent=type==="sales"?"THIS MONTH SALES":type==="collection"?"THIS MONTH COLLECTION":"OUTSTANDING";$("mbody").innerHTML="Loading…";
 if(type==="sales"){let n=new Date(),st=new Date(n.getFullYear(),n.getMonth(),1),nx=new Date(n.getFullYear(),n.getMonth()+1,1),r=await Q(SID,S,`select F,sum(J) ${baseWhere(`D>=${qdate(st)} and D<${qdate(nx)}`)} group by F label sum(J) ''`);$("mbody").innerHTML=`<table><thead><tr><th>Party</th><th>Sales incl GST</th></tr></thead><tbody>${r.map(x=>{let v=vals(x);return`<tr><td class="link" onclick='partyDetail(${JSON.stringify(v[0])})'>${E(v[0])}</td><td>${M(num(v[1])*1.18)}</td></tr>`}).join("")}</tbody></table>`}
 else if(type==="collection"){let r=await Q(AID,AS.pay,"select B,sum(D) where B is not null group by B label sum(D) ''");$("mbody").innerHTML=`<table><thead><tr><th>Party</th><th>Collection</th></tr></thead><tbody>${r.map(x=>{let v=vals(x);return`<tr><td>${E(v[0])}</td><td>${M(v[1])}</td></tr>`}).join("")}</tbody></table>`}
 else {$("mbody").innerHTML=`<p>Party outstanding is calculated from compact summaries. Click any party for its detailed invoice rows.</p><table><thead><tr><th>Party</th><th>Outstanding</th></tr></thead><tbody>${(window.PARTIES||[]).slice(0,150).map(x=>`<tr><td class="link" onclick='partyDetail(${JSON.stringify(x.p)})'>${E(x.p)}</td><td>${M(x.out)}</td></tr>`).join("")}</tbody></table>`}
}
$("role").onchange=fillUsers;
$("loginBtn").onclick=async()=>{role=$("role").value;user=$("user").value;if(role!=="ADMIN"&&!user)return alert("Select user");$("login").classList.add("hide");$("app").classList.remove("hide");$("roleTag").textContent=role;try{await dashboard()}catch(e){alert("Dashboard error: "+e.message);console.error(e)}};
$("refresh").onclick=dashboard;$("logout").onclick=()=>location.reload();$("close").onclick=()=>$("modal").classList.add("hide");$("modal").onclick=e=>{if(e.target.id==="modal")$("modal").classList.add("hide")};
document.querySelectorAll("[data-card]").forEach(x=>x.onclick=()=>card(x.dataset.card));
document.querySelectorAll(".filters select,.filters input").forEach(x=>x.addEventListener("change",dashboard));


window.addEventListener("DOMContentLoaded",()=>dashboard().catch(e=>{document.getElementById("loadbar").textContent="Data connection error — check Google Sheet sharing.";console.error(e)}));
