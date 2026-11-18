/* AAS Music — bloco de planos e pagamento (Pix / checkout).
   Uso: <div data-planos></div> + config.js carregado antes. */
(function(){
"use strict";
var C=window.AASM_CONFIG||{};
var PLANOS=[
  {id:'mensal',nome:'Professor',preco:'R$ 49',per:'/mês',destaque:true,desc:'Para quem dá aulas particulares.',itens:['Alunos ilimitados','Aulas salvas na nuvem','Código fixo para cada aluno','Todos os níveis e músicas'],checkout:'checkoutUrl'},
  {id:'anual',nome:'Anual',preco:'R$ 470',per:'/ano',selo:'2 meses grátis',desc:'Tudo do plano Professor, pagando uma vez por ano.',itens:['Equivale a R$ 39/mês','Alunos ilimitados','Sem se preocupar com renovação'],checkout:'checkoutAnualUrl'},
  {id:'escola',nome:'Escola ou igreja',preco:'R$ 149',per:'/mês',pre:'a partir de',desc:'Para escolas de música e ministérios de louvor.',itens:['Vários professores','Marca da escola','Atendimento prioritário'],consulta:true}
];
var EXTRA={nome:'Montamos suas 10 primeiras aulas',preco:'R$ 97',desc:'Você manda as músicas, nós deixamos as aulas prontas.'};
var BONUS_ATE=new Date('2026-11-23T23:59:59-03:00');

var css='.pl-wrap{margin:8px 0}.pl-bonus{display:flex;gap:12px;align-items:center;border:1px solid #c9a66b66;background:linear-gradient(135deg,#c9a66b22,#c9a66b08);border-radius:18px;padding:14px 18px;margin-bottom:16px;font-size:15px}.pl-bonus b{color:#e6c896}'+
'.pl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.pl-grid>*{min-width:0}'+
'.pl{position:relative;display:flex;flex-direction:column;background:#18150f;border:1px solid #ffffff17;border-radius:22px;padding:26px 22px;color:#f3ece0}'+
'.pl.on{border-color:#c9a66b;background:linear-gradient(170deg,#211b11,#15120d);box-shadow:0 24px 60px #c9a66b1f}'+
'.pl .tag{position:absolute;top:-12px;left:22px;background:#c9a66b;color:#1a140a;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:4px 12px;border-radius:999px}'+
'.pl h3{font-family:"Playfair Display",Georgia,serif;font-size:1.35rem}.pl .pr{font-family:"Playfair Display",Georgia,serif;font-size:2.4rem;line-height:1.1;margin:8px 0 2px}.pl .pr small{font-family:"DM Sans",sans-serif;font-size:14px;color:#a69f94}.pl .pre{font-size:13px;color:#a69f94}'+
'.pl p{color:#a69f94;font-size:14px}.pl ul{list-style:none;margin:14px 0 20px;flex:1}.pl li{display:flex;gap:8px;margin:7px 0;font-size:14px}.pl li::before{content:"✓";color:#c9a66b;font-weight:700}'+
'.pl .b{display:flex;justify-content:center;align-items:center;gap:8px;width:100%;padding:13px 16px;border-radius:999px;font-weight:700;font-size:14px;border:0;cursor:pointer;text-decoration:none;font-family:"DM Sans",sans-serif;margin-top:8px}'+
'.pl .b.g{background:linear-gradient(135deg,#c9a66b,#e6c896);color:#1a140a}.pl .b.o{background:transparent;color:#f3ece0;border:1px solid #ffffff2a}'+
'.pl-extra{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px;border:1px dashed #ffffff2a;border-radius:18px;padding:16px 20px;color:#a69f94;font-size:14px}.pl-extra b{color:#f3ece0}'+
'.pl-m{position:fixed;inset:0;background:#000c;display:none;align-items:center;justify-content:center;z-index:90;padding:18px}.pl-m.open{display:flex}'+
'.pl-m .c{width:min(460px,100%);background:#18150f;border:1px solid #ffffff22;border-radius:22px;padding:26px;color:#f3ece0;box-shadow:0 40px 100px #000c;font-family:"DM Sans",sans-serif}'+
'.pl-m h3{font-family:"Playfair Display",Georgia,serif;font-size:1.5rem;margin-bottom:6px}.pl-m h3 em{color:#c9a66b}.pl-m p{color:#a69f94;font-size:14px;margin:6px 0}'+
'.pl-key{font-family:ui-monospace,Menlo,monospace;font-size:16px;font-weight:700;color:#e6c896;background:#0f0d0a;border:1px solid #c9a66b55;border-radius:14px;padding:14px;margin:12px 0;word-break:break-all;text-align:center}'+
'.pl-m .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.pl-m .b{flex:1;display:flex;justify-content:center;padding:13px 16px;border-radius:999px;font-weight:700;font-size:14px;border:0;cursor:pointer;text-decoration:none;font-family:"DM Sans",sans-serif}'+
'.pl-m .b.g{background:linear-gradient(135deg,#c9a66b,#e6c896);color:#1a140a}.pl-m .b.w{background:#25d366;color:#06260f}.pl-m .b.o{background:transparent;color:#f3ece0;border:1px solid #ffffff2a}'+
'@media(max-width:860px){.pl-grid{grid-template-columns:1fr}.pl.on{order:-1}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function wa(msg){return 'https://wa.me/'+(C.whatsapp||'')+'?text='+encodeURIComponent(msg);}
function emailAtual(){return (window.AASM_EMAIL||'');}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

var modal=null;
function pix(plano){
  if(!modal){modal=document.createElement('div');modal.className='pl-m';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');document.body.appendChild(modal);
    modal.addEventListener('click',function(e){if(e.target===modal||e.target.closest('[data-x]'))modal.classList.remove('open');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')modal.classList.remove('open');});}
  var em=emailAtual(),msg='Olá! Paguei o AAS Music — plano '+plano.nome+' ('+plano.preco+plano.per+') pelo Pix. Segue o comprovante.'+(em?' Meu e-mail de cadastro: '+em:' Meu e-mail de cadastro: ');
  var h='<div class="c"><h3>Pagar com <em>Pix</em></h3><p>Plano <b style="color:#f3ece0">'+esc(plano.nome)+'</b> — '+esc(plano.preco+plano.per)+'</p>';
  if(C.pix){
    h+='<p>Chave Pix:</p><div class="pl-key" id="plKey">'+esc(C.pixRotulo||C.pix)+'</div>'+
       '<p>Toque em <b style="color:#f3ece0">Copiar chave Pix</b> e cole no app do seu banco, em <b style=\"color:#f3ece0\">Pix → Pagar com chave</b>. Depois mande o comprovante no WhatsApp: seu acesso é liberado em seguida.</p>'+
       '<div class="row"><button class="b g" id="plCopy">Copiar chave Pix</button><a class="b w" target="_blank" rel="noopener noreferrer" href="'+esc(wa(msg))+'">Enviar comprovante</a></div>';
  }else{
    h+='<p>Fale com a gente no WhatsApp para receber a chave Pix e liberar seu acesso.</p><div class="row"><a class="b w" target="_blank" rel="noopener noreferrer" href="'+esc(wa('Olá! Quero assinar o AAS Music — plano '+plano.nome+' ('+plano.preco+plano.per+'). Pode me mandar o Pix?'+(em?' Meu e-mail: '+em:'')))+'">Chamar no WhatsApp</a></div>';
  }
  h+='<div class="row"><button class="b o" data-x>Fechar</button></div></div>';
  modal.innerHTML=h;modal.classList.add('open');
  var cp=document.getElementById('plCopy');
  if(cp) cp.addEventListener('click',function(){
    var done=function(){cp.textContent='Chave copiada ✓';};
    if(navigator.clipboard) navigator.clipboard.writeText(C.pix).then(done,function(){sel();});else sel();
    function sel(){var t=document.createElement('textarea');t.value=C.pix;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){cp.textContent='Chave: '+C.pix;}t.remove();}
  });
}

function render(el){
  var h='<div class="pl-wrap">';
  if(new Date()<BONUS_ATE) h+='<div class="pl-bonus"><span style="font-size:1.6rem">🎁</span><span><b>Bônus até 23/11:</b> assine e ganhe as 10 primeiras aulas montadas por nós (valor de '+EXTRA.preco+').</span></div>';
  h+='<div class="pl-grid">';
  PLANOS.forEach(function(p){
    h+='<div class="pl'+(p.destaque?' on':'')+'">'+(p.destaque?'<span class="tag">Recomendado</span>':p.selo?'<span class="tag" style="background:#25d366;color:#06260f">'+p.selo+'</span>':'')+
      '<h3>'+p.nome+'</h3>'+(p.pre?'<div class="pre">'+p.pre+'</div>':'')+'<div class="pr">'+p.preco+'<small>'+p.per+'</small></div><p>'+p.desc+'</p><ul>'+p.itens.map(function(i){return '<li>'+i+'</li>';}).join('')+'</ul>';
    if(p.consulta) h+='<a class="b o" target="_blank" rel="noopener noreferrer" href="'+esc(wa('Olá! Tenho uma escola/igreja e quero saber do plano Escola do AAS Music.'))+'">Falar no WhatsApp</a>';
    else{
      var url=C[p.checkout];
      if(url) h+='<a class="b '+(p.destaque?'g':'o')+'" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Assinar no cartão</a>';
      h+='<button class="b '+(url?'o':(p.destaque?'g':'o'))+'" data-pix="'+p.id+'">Pagar com Pix</button>';
    }
    h+='</div>';
  });
  h+='</div><div class="pl-extra"><span><b>'+EXTRA.nome+'</b> — '+EXTRA.preco+', pagamento único. '+EXTRA.desc+'</span><a class="b o" style="width:auto;margin:0;padding:10px 16px;border-radius:999px;border:1px solid #ffffff2a;color:#f3ece0;text-decoration:none;font-weight:700;font-size:13px" target="_blank" rel="noopener noreferrer" href="'+esc(wa('Olá! Quero o serviço "Montamos suas 10 primeiras aulas" (R$ 97) do AAS Music.'))+'">Quero esse serviço</a></div></div>';
  el.innerHTML=h;
  el.querySelectorAll('[data-pix]').forEach(function(b){b.addEventListener('click',function(){pix(PLANOS.find(function(p){return p.id===b.dataset.pix;}));});});
}
function init(){document.querySelectorAll('[data-planos]').forEach(render);}
window.AASM_PLANOS={render:init,pix:function(id){pix(PLANOS.find(function(p){return p.id===(id||'mensal');}));}};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
