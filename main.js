const menuBtn=document.getElementById('menuBtn');const menu=document.getElementById('menu');menuBtn.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));menuBtn.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));document.getElementById('year').textContent=new Date().getFullYear();document.querySelectorAll('.service-select').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('service').value=btn.dataset.service;document.getElementById('contato').scrollIntoView({behavior:'smooth'});setTimeout(()=>document.getElementById('name').focus({preventScroll:true}),650)}));const quoteForm=document.getElementById('quoteForm');
const serviceField=document.getElementById('service');
const messagePreview=document.getElementById('messagePreview');
const serviceMessages={
  'Página de vendas':'Tenho interesse em uma página de vendas profissional para apresentar meus produtos ou serviços e facilitar a conversão de visitantes em clientes. Gostaria de conhecer as possibilidades, os valores e o prazo de desenvolvimento.',
  'Site institucional':'Tenho interesse em criar um site institucional profissional para fortalecer a presença digital da minha empresa. Gostaria de conversar sobre estrutura, páginas, funcionalidades, valores e prazo de entrega.',
  'Manutenção mensal':'Gostaria de informações sobre a manutenção mensal de um site, incluindo atualizações, correções, acompanhamento técnico e melhorias. Quero entender os planos disponíveis e o que está incluído.',
  'Projeto personalizado':'Tenho uma ideia de projeto digital personalizado e gostaria de avaliar a viabilidade com a AAS. Preciso de uma proposta de acordo com as funcionalidades e necessidades do meu negócio.'
};
function buildQuoteMessage(){
 const name=document.getElementById('name').value.trim();
 const company=document.getElementById('company').value.trim();
 const service=serviceField.value;
 const details=document.getElementById('details').value.trim();
 if(!serviceMessages[service])return '';
 return [
  'Olá, equipe AAS Tecnologia e Editorial!',
  '',serviceMessages[service],
  '',`*Serviço escolhido:* ${service}`,
  `*Meu nome:* ${name||'[seu nome]'}`,
  `*Empresa ou marca:* ${company||'Não informada'}`,
  `*Detalhes do projeto:* ${details||'Gostaria de conversar sobre as opções.'}`,
  '', 'Aguardo o contato para conversarmos. Obrigado!'
 ].join('\n');
}
function updateMessagePreview(){
 const msg=buildQuoteMessage();
 messagePreview.textContent=msg||'Escolha um serviço para visualizar a mensagem que será preparada para o WhatsApp.';
 messagePreview.closest('.message-preview').hidden=!msg;
}
quoteForm.addEventListener('input',updateMessagePreview);
quoteForm.addEventListener('change',updateMessagePreview);
quoteForm.addEventListener('submit',e=>{
 e.preventDefault();
 if(!quoteForm.reportValidity())return;
 const message=buildQuoteMessage();
 if(!message)return;
 const url='https://wa.me/5519989522187?text='+encodeURIComponent(message);
 // Abre o WhatsApp em nova aba; se o navegador bloquear, abre na mesma aba.
 const opened=window.open(url,'_blank');
 if(opened){opened.opener=null}else{window.location.href=url}
});
updateMessagePreview();


// Rotação sincronizada das capturas reais nas duas telas (a cada 2,5 segundos).
(()=>{
 const groups=[...document.querySelectorAll('[data-showcase]')];
 const names=['ADÃO ROSA MONTEIRO','VANESSA OLIVEIRA','MESA ROSA','CHRISTIAN GOIS','DENISE RESENDE','BRASA BURGER'];
 const urls=['https://adaorosamonteiro.art.br/','https://aliantsilva10-ctrl.github.io/vanessa-oliveira/','https://mesarosaquitandasartesanais.netlify.app/','https://christian-gois-psicanalista.netlify.app/','https://oficialsacerdotisa.com.br/','https://brasaburguer10.netlify.app/'];
 const liveLinks=[...document.querySelectorAll('[data-showcase-link]')];
 const label=document.getElementById('showcaseProject');
 if(!groups.length)return;
 let current=0;
 function show(index){
  groups.forEach(group=>group.querySelectorAll('.showcase-slide').forEach((slide,i)=>{
   const active=i===index;slide.classList.toggle('is-active',active);
   slide.setAttribute('aria-hidden',String(!active));
  }));
  if(label)label.textContent=names[index];
  liveLinks.forEach(link=>{link.href=urls[index];link.setAttribute('aria-label','Abrir o site de '+names[index]+' em nova aba');link.title='Visitar '+names[index];});
 }
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let timer;
 function start(){clearInterval(timer);if(!reduced.matches)timer=setInterval(()=>{current=(current+1)%names.length;show(current)},2500)}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(timer);else start()});
 reduced.addEventListener?.('change',start);
 show(current);start();
})();

// Portfólio: esteira circular contínua, com avanço automático e por seta.
(()=>{
 const track=document.getElementById('portfolioTrack');
 const next=document.getElementById('portfolioNext');
 if(!track)return;
 const originals=[...track.querySelectorAll('.project:not(.project-clone)')];
 const total=originals.length;
 if(total<2)return;
 track.querySelectorAll('.project-clone').forEach(el=>el.remove());
 // Repete todos os itens: o salto para o início acontece somente após a animação.
 originals.forEach(card=>{
   const clone=card.cloneNode(true);
   clone.classList.add('project-clone');
   clone.setAttribute('aria-hidden','true');
   clone.querySelectorAll('a,button').forEach(el=>el.tabIndex=-1);
   track.appendChild(clone);
 });
 let index=0, locked=false, timer=null, fallback=null;
 const duration=780;
 function stepSize(){
   const first=originals[0];
   const second=originals[1];
   return second.offsetLeft-first.offsetLeft;
 }
 function move(animate){
   track.style.transition=animate?`transform ${duration}ms cubic-bezier(.22,.8,.2,1)`:'none';
   track.style.transform=`translate3d(${-index*stepSize()}px,0,0)`;
 }
 function complete(){
   clearTimeout(fallback);
   if(index>=total){index=0;move(false);void track.offsetHeight;}
   locked=false;
 }
 function advance(){
   if(locked)return;
   locked=true;
   index++;
   move(true);
   // Fallback para navegadores que não disparam transitionend.
   clearTimeout(fallback);
   fallback=setTimeout(complete,duration+100);
 }
 track.addEventListener('transitionend',e=>{
   if(e.target===track&&e.propertyName==='transform')complete();
 });
 next?.addEventListener('click',()=>{advance();start();});
 function start(){
   clearInterval(timer);
   if(!document.hidden)timer=setInterval(advance,2900);
 }
 document.addEventListener('visibilitychange',start);
 window.addEventListener('resize',()=>move(false));
 move(false);
 start();
})();
