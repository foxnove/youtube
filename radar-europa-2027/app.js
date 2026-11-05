'use strict';
const destinations={LIS:'Lisboa',MAD:'Madri',CDG:'Paris · Charles de Gaulle',ORY:'Paris · Orly',OPO:'Porto',FCO:'Roma',MXP:'Milão',BCN:'Barcelona',FRA:'Frankfurt',AMS:'Amsterdã',ZAG:'Zagreb',TIA:'Tirana',TBS:'Tbilisi',BRU:'Bruxelas',DUB:'Dublin',LHR:'Londres',VIE:'Viena'};
function validOffers(data,now=Date.now()){
 if(data.environment!=='production')return [];
 return (Array.isArray(data.offers)?data.offers:[]).filter(o=>o&&typeof o.price==='number'&&Number.isFinite(o.price)&&o.price>0&&o.currency==='BRL'&&destinations[o.destination]&&/^2027-\d{2}-\d{2}$/.test(o.departure)&&/^2027-\d{2}-\d{2}$/.test(o.return)&&Number.isFinite(Date.parse(o.checked_at))&&now-Date.parse(o.checked_at)<=86400000&&now-Date.parse(o.checked_at)>=-300000);
}
function filterOffers(offers,f){return offers.filter(o=>(!f.destination||o.destination===f.destination)&&(!f.month||o.departure.slice(5,7)===f.month)&&(!f.max||o.price<=Number(f.max))&&(!f.direct||o.direct===true)&&(!f.noDomestic||o.domestic_connection===false)).sort((a,b)=>a.price-b.price)}
if(typeof module!=='undefined')module.exports={validOffers,filterOffers};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
 const date=s=>s&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(s)):'Não realizada';
 const day=s=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const states={credentials_missing:'Credenciais pendentes',ok:'Última consulta concluída',partial:'Consulta parcial',error:'Falha na consulta',quota_exhausted:'Teto mensal atingido',test:'Ambiente de testes'};
 const emailStates={not_configured:'Configuração pendente',ready:'Configurado · envio não testado',sent:'Último envio confirmado',no_new_promotions:'Sem nova promoção para enviar',send_failed:'Falha no envio'};
 const errors={credentials_missing:'Credenciais de produção ausentes',monthly_budget_reached:'Teto local de requisições atingido',http_401:'Autenticação recusada',http_403:'Acesso à API recusado',http_429:'Limite de requisições da API',network_unavailable:'API indisponível ou sem conexão',invalid_json:'Resposta inválida da API',invalid_offer:'Oferta descartada por dados inválidos'};
 let data={},offers=[],history=[],loading=false;
 Object.entries(destinations).forEach(([code,city])=>{const o=document.createElement('option');o.value=code;o.textContent=city+' · '+code;$('destination').append(o)});
 function drawOffers(){
  const filtered=filterOffers(offers,{destination:$('destination').value,month:$('month').value,max:$('max-price').value,direct:$('direct').checked,noDomestic:$('no-domestic').checked});
  $('filtered-count').textContent=filtered.length;
  $('empty').hidden=filtered.length>0;
  $('empty').querySelector('h3').textContent=offers.length?'Nenhuma oferta com esses filtros':'Nenhuma tarifa válida disponível';
  $('empty').querySelector('p').textContent=offers.length?'Ajuste os filtros para ver outras passagens.':'As ofertas aparecem após uma consulta de produção e permanecem válidas no painel por até 24 horas. Nenhum preço é simulado.';
  $('offer-list').innerHTML=filtered.map(o=>{
   const connections=Array.isArray(o.connections)?o.connections.map(x=>Array.isArray(x)?x.join(' → '):'').filter(Boolean).join(' / '):'';
   const duration=Array.isArray(o.durations)?o.durations.map(x=>String(x||'').replace(/^PT/,'').toLowerCase()).join(' / '):'Não informada';
   const bags=Array.isArray(o.baggage)&&o.baggage.length?o.baggage.map(b=>b.quantity!==undefined?`${b.quantity} peça(s)`:`${b.weight??'—'} ${b.weightUnit??''}`).filter((x,i,a)=>a.indexOf(x)===i).join(' / '):'Não informada pela API';
   return `<article class="offer"><div class="offer-top"><span class="route-code">SSA → ${esc(o.destination)}</span>${o.promotion?'<span class="deal">⚑ Promoção no radar</span>':''}</div><h3>${esc(destinations[o.destination])}</h3><div class="price">${money(o.price)}</div><div class="caption">POR PESSOA · IDA E VOLTA</div><div class="offer-info"><p>${esc(day(o.departure))} → ${esc(day(o.return))} · ${Math.round((Date.parse(o.return)-Date.parse(o.departure))/86400000)} dias</p><p>${esc((o.airline_names||o.airlines||[]).join(' · '))}</p><p class="route-tag">${o.direct?'Direto · ida e volta':o.domestic_connection?'Com conexão doméstica no Brasil':'Conexão internacional · sem conexão doméstica'}</p><p>Escalas ida / volta: ${esc((o.stops||[]).join(' / '))}${connections?' · '+esc(connections):''}</p><p>Duração ida / volta: ${esc(duration)}<br>Bagagem despachada: ${esc(bags)}</p><p>${o.change_percent!=null?'Variação: '+esc(o.change_percent)+'% · ':''}Menor histórico: ${money(o.historical_low||o.price)}</p><p>Consultado em ${esc(date(o.checked_at))}</p><small>Reconfirme preço e condições com a companhia. A fonte não fornece link de compra.</small></div></article>`;
  }).join('');
 }
 function drawChart(){
  const key=$('history-route').value;
  const rows=history.filter(h=>h.destination+'|'+h.period===key).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-40);
  $('history-table').innerHTML=rows.map(h=>`<tr><td>${esc(date(h.at))}</td><td>SSA → ${esc(h.destination)}</td><td>${esc(h.period)}</td><td>${money(h.price)}</td></tr>`).join('');
  if(!rows.length){$('chart').innerHTML='<div class="chart-empty">O gráfico será formado pelas consultas reais.<small>Amostras de rotas e períodos diferentes não são conectadas.</small></div>';return}
  const prices=rows.map(h=>h.price),min=Math.min(...prices),max=Math.max(...prices),spread=Math.max(200,max-min),first=Date.parse(rows[0].at),last=Date.parse(rows.at(-1).at);
  const points=rows.map(h=>[55+(last===first?205:(Date.parse(h.at)-first)/(last-first)*410),125-(h.price-min)/spread*95]);
  const line=points.map(p=>p.join(',')).join(' ');
  $('chart').innerHTML=`<svg viewBox="0 0 500 165" role="img" aria-label="Histórico de tarifas de ${esc(key)}: ${rows.length} consultas, de ${esc(money(min))} a ${esc(money(max))}"><title>Histórico de preços; valores detalhados na tabela abaixo</title><text x="0" y="25" class="chart-label">${esc(money(max))}</text><text x="0" y="130" class="chart-label">${esc(money(min))}</text><polyline points="${line}" fill="none" stroke="#a6efbb" stroke-width="2"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3" fill="#a6efbb"><title>${esc(date(rows[i].at))}: ${esc(money(rows[i].price))}</title></circle>`).join('')}<text x="55" y="155" class="chart-label">${esc(date(rows[0].at))}</text><text x="465" y="155" text-anchor="end" class="chart-label">${esc(date(rows.at(-1).at))}</text></svg>`;
 }
 function render(){
  offers=validOffers(data);
  history=(Array.isArray(data.history)?data.history:[]).filter(h=>h&&destinations[h.destination]&&['fev-mar','jul-ago'].includes(h.period)&&Number.isFinite(h.price)&&h.price>0&&Number.isFinite(Date.parse(h.at)));
  const status=states[data.status]||'Estado não confirmado';
  const stale=data.last_success_at&&Date.now()-Date.parse(data.last_success_at)>86400000;
  $('api-badge').textContent=stale&&data.status==='ok'?'Dados desatualizados':status;
  $('api-badge').classList.toggle('healthy',data.status==='ok'&&!stale);
  $('api-state').textContent=status+' · '+(data.environment==='production'?'produção':data.environment==='test'?'testes':'ambiente não confirmado');
  $('count').textContent=offers.length;
  $('count-caption').textContent=offers.length?'Consultadas nas últimas 24 horas':'Nenhuma oferta válida disponível';
  $('best').textContent=offers.length?money(Math.min(...offers.map(o=>o.price))):'—';
  $('threshold').textContent=money(Number.isFinite(data.max_brl)?data.max_brl:4500);
  $('updated').textContent=date(data.last_success_at||data.updated_at);
  $('attempt').textContent=date(data.last_attempt_at);
  $('scheduler').textContent=data.scheduler?.status==='active'?'Agendamento ativo · a cada 6 horas':'Pendente · exige workflow na branch padrão';
  $('email-state').textContent=emailStates[data.email_status]||'Não confirmado';
  $('quota').textContent=data.quota?`${data.quota.used} / ${data.quota.limit} · ${data.quota.month}`:'Não disponível';
  $('coverage').textContent=data.coverage?`${data.successful_queries||0} pesquisas concluídas / ${data.coverage.combinations} combinações · amostragem rotativa`:'Nenhuma consulta confirmada';
  $('errors').textContent=(data.errors||[]).map(e=>errors[e.code]||(/^(http_\d{3}|invalid_[a-z_]+)$/.test(e.code)?e.code:'Erro na consulta')).filter((x,i,a)=>a.indexOf(x)===i).join(' · ');
  let title='Monitoramento aguardando configuração',text='O painel está publicado. A consulta de tarifas depende das credenciais de produção; o envio de alertas e a execução automática ainda precisam ser ativados.';
  if(data.status==='ok'){title=stale?'Última consulta desatualizada':'Última consulta de produção concluída';text=stale?'As tarifas antigas não são apresentadas como ofertas válidas. Aguarde uma nova consulta.':`${data.successful_queries||0} pesquisas concluídas na rodada. A lista cobre uma amostra das datas e rotas, sujeita à disponibilidade e alteração de preços.`}
  else if(data.status==='partial'){title='Consulta parcialmente concluída';text='Parte das pesquisas falhou. Apenas ofertas válidas verificadas nas últimas 24 horas são exibidas.'}
  else if(['error','quota_exhausted'].includes(data.status)){title='Monitoramento interrompido';text='A última tentativa não foi concluída. Consulte o estado do sistema abaixo. Ofertas antigas expiram após 24 horas.'}
  else if(data.status==='test'){title='Ambiente de testes';text='Resultados de teste não são apresentados como tarifas reais de produção.'}
  $('notice-title').textContent=title;$('notice-text').textContent=text;
  for(const [period,id] of [['fev-mar','season-one'],['jul-ago','season-two']]){const rows=offers.filter(o=>o.period===period);$(id).textContent=rows.length?money(Math.min(...rows.map(o=>o.price))):'—'}
  const previous=$('history-route').value;$('history-route').replaceChildren();
  const keys=[...new Set(history.map(h=>h.destination+'|'+h.period))].sort();
  if(!keys.length){const option=document.createElement('option');option.textContent='Aguardando histórico';$('history-route').append(option)}
  keys.forEach(key=>{const option=document.createElement('option');option.value=key;const [code,period]=key.split('|');option.textContent=destinations[code]+' · '+period;$('history-route').append(option)});
  if(keys.includes(previous))$('history-route').value=previous;
  drawOffers();drawChart();
 }
 async function load(){
  if(loading)return;loading=true;$('refresh').disabled=true;$('refresh').textContent='Lendo painel…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch('./data.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('HTTP');const parsed=await response.json();if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.offers))throw Error('schema');data=parsed;render()}
  catch{$('api-badge').textContent='Falha ao ler os dados';$('api-badge').classList.remove('healthy');$('notice-title').textContent='Não foi possível atualizar o painel';$('notice-text').textContent='Verifique a conexão e tente novamente. Esta leitura não iniciou uma consulta de voos.';offers=validOffers(data);drawOffers();$('count').textContent=offers.length;$('best').textContent=offers.length?money(Math.min(...offers.map(o=>o.price))):'—'}
  finally{clearTimeout(timer);loading=false;$('refresh').disabled=false;$('refresh').textContent='↻ Atualizar painel'}
 }
 $('filters').addEventListener('submit',e=>e.preventDefault());$('filters').addEventListener('input',drawOffers);$('history-route').addEventListener('change',drawChart);$('refresh').addEventListener('click',load);
 load();setInterval(()=>{if(!document.hidden)load()},300000);
}
