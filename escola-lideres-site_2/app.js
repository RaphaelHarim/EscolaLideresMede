(function () {
'use strict';
const SUPA = 'https://wttghfpswptovghmlthg.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dGdoZnBzd3B0b3ZnaG1sdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzYxMzEsImV4cCI6MjEwNTE1MjEzMX0.TPqD5sujHWnfnGIYCQ_OtkfYy31153KvcU5E1O-kt1c';
const app = document.getElementById('app');
const avisoEl = document.getElementById('aviso');

// ---------- utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(_) { return null; } },
  set(k,v){ try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k,v); } catch(_) {} }
};
let sessao = null;
try { sessao = JSON.parse(store.get('escola_sessao') || 'null'); } catch(_) {}
function salvarSessao(s){ sessao = s; store.set('escola_sessao', s ? JSON.stringify(s) : null); }

let avisoTimer;
function aviso(msg, erro){ avisoEl.textContent = msg; avisoEl.className = 'aviso' + (erro ? ' erro' : ''); avisoEl.hidden = false; clearTimeout(avisoTimer); avisoTimer = setTimeout(() => avisoEl.hidden = true, 4000); }

async function rpc(fn, args){
  const r = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, { method:'POST', headers:{ apikey:KEY, Authorization:'Bearer '+KEY, 'Content-Type':'application/json' }, body: JSON.stringify(args || {}) });
  const txt = await r.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch(_) {}
  if (!r.ok) {
    const m = (data && (data.message || data.hint)) || 'Erro de conexão';
    if (/SESSAO_INVALIDA/.test(m)) { salvarSessao(null); location.hash = '#/entrar'; throw new Error('Sua sessão terminou. Entre de novo.'); }
    if (/SEM_PERMISSAO/.test(m)) throw new Error('Você não tem acesso a esta área.');
    if (/AULA_BLOQUEADA/.test(m)) throw new Error('Esta aula ainda não foi liberada pelo professor.');
    throw new Error('Não foi possível completar. Verifique a internet e tente de novo.');
  }
  if (data && data.erro) { const er = new Error(data.erro); er.dados = data; throw er; }
  return data;
}
const tk = () => sessao && sessao.token;

const TZ = 'America/Sao_Paulo';
function dataHora(iso){ if(!iso) return ''; const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR',{timeZone:TZ, weekday:'long', day:'2-digit', month:'2-digit'});
  const hora = d.toLocaleTimeString('pt-BR',{timeZone:TZ, hour:'2-digit', minute:'2-digit'});
  return `${dia} às ${hora}`; }
function dataCurta(iso){ return iso ? new Date(iso).toLocaleDateString('pt-BR',{timeZone:TZ, day:'2-digit', month:'2-digit'}) : ''; }
function falta(iso){ if(!iso) return ''; const ms = new Date(iso) - Date.now(); if (ms <= 0) return 'prazo encerrado';
  const h = Math.floor(ms/3600000); if (h < 1) return 'falta menos de 1 hora'; if (h < 24) return `faltam ${h} hora${h>1?'s':''}`;
  const d = Math.floor(h/24); return `falta${d>1?'m':''} ${d} dia${d>1?'s':''}`; }
function isoDataSP(iso){ const d = iso ? new Date(iso) : new Date(); return new Intl.DateTimeFormat('en-CA',{timeZone:TZ, year:'numeric', month:'2-digit', day:'2-digit'}).format(d); }
const nota = n => (n == null ? '–' : Number(n).toLocaleString('pt-BR',{minimumFractionDigits:1, maximumFractionDigits:1}));
const celFmt = c => { c = String(c||'').replace(/\D/g,''); return c.length === 11 ? `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7)}` : c.length === 10 ? `(${c.slice(0,2)}) ${c.slice(2,6)}-${c.slice(6)}` : c; };
function mascaraCel(inp){ inp.addEventListener('input', () => { const d = inp.value.replace(/\D/g,'').slice(0,11); inp.value = d.length > 2 ? `(${d.slice(0,2)}) ${d.length>7 ? d.slice(2,7)+'-'+d.slice(7) : d.slice(2)}` : d; }); }
function status(a){
  return { bloqueada:['chip-bloqueada','Em breve'], aberta:['chip-aberta','Atividade aberta'], entregue:['chip-entregue','Atividade entregue'], expirada:['chip-expirada','Prazo encerrado'] }[a.status] || ['chip-bloqueada', a.status];
}
function tamanhoFonte(delta){ const atual = parseInt(store.get('escola_fs') || '20', 10); const novo = Math.min(28, Math.max(17, atual + delta)); store.set('escola_fs', String(novo)); document.documentElement.style.setProperty('--fs', novo + 'px'); }
tamanhoFonte(0);

function tela(html){ app.innerHTML = html; app.focus({preventScroll:true}); window.scrollTo(0,0); }
function carregando(){ app.innerHTML = '<p class="carregando">Carregando…</p>'; }
function erroTela(e){ tela(`<div class="cartao"><h2>Ops!</h2><p>${esc(e.message)}</p><a class="btn btn-principal" href="#/">Voltar ao início</a></div>`); }

// ---------- roteador ----------
async function rotear(){
  const h = location.hash.replace(/^#\/?/, '');
  const [p1, p2] = h.split('/');
  window.speechSynthesis && speechSynthesis.cancel();
  if (!sessao) return p1 === 'primeiro' ? telaPrimeiroAcesso() : telaLogin();
  try {
    if (p1 === 'sair') { try { await rpc('escola_logout', {p_token: tk()}); } catch(_) {} salvarSessao(null); location.hash = '#/entrar'; return; }
    if (p1 === 'pin') return telaPin();
    if (sessao.papel === 'professor') {
      if (p1 === 'aula' && p2) return telaAula(+p2);
      if (p1 === 'entregas' && p2) return telaEntregas(+p2);
      return telaProfessor(p1 || 'aulas');
    }
    if (p1 === 'aula' && p2) return telaAula(+p2);
    return telaInicio();
  } catch (e) { erroTela(e); }
}
window.addEventListener('hashchange', rotear);

// ---------- login ----------
const campoSenha = (id, rotulo, auto) => `<label class="campo" for="${id}">${rotulo}<input type="password" id="${id}" class="pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="${auto}" placeholder="••••"></label>`;

function telaLogin(){
  tela(`<section class="login pilha">
    <div class="boas-vindas"><img src="igreja.webp" alt="" width="120" height="127"><h1>Bem-vindo à Escola de Líderes</h1>
    <p class="sub">Entre com o seu nome e a sua senha de 4 números.</p></div>
    <form class="cartao" id="fLogin" novalidate>
      <label class="campo" for="nome">Seu nome e sobrenome<input type="text" id="nome" autocomplete="name" autocapitalize="words" placeholder="Ex.: Maria da Silva"></label>
      ${campoSenha('pin', 'Sua senha (4 números)', 'current-password')}
      <button class="btn btn-principal btn-bloco" type="submit">Entrar</button>
    </form>
    <div class="cartao"><h3>É a sua primeira vez aqui?</h3><p>Crie a sua conta com o seu nome e uma senha de 4 números que você escolher.</p>
      <a class="btn btn-ouro btn-bloco" href="#/primeiro">Primeiro acesso: criar minha senha</a>
      <p class="sub">Esqueceu a senha? Fale com o seu professor.</p></div></section>`);
  const nome = document.getElementById('nome');
  document.getElementById('fLogin').addEventListener('submit', async ev => {
    ev.preventDefault(); const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Entrando…';
    try { const r = await rpc('escola_login', { p_nome: nome.value, p_pin: document.getElementById('pin').value });
      if (r.criar_senha) { aviso('Bem-vindo! Agora crie a sua senha.'); return telaPrimeiroAcesso(r.nome); }
      salvarSessao(r); location.hash = '#/'; rotear(); }
    catch(e){ aviso(e.message, true); b.disabled = false; b.textContent = 'Entrar'; }
  });
}

function telaPrimeiroAcesso(nomeInicial){
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/entrar">← Voltar</a>
    <form class="cartao login" id="fPrim" novalidate><h2>Primeiro acesso</h2>
      <p>Escreva o seu nome completo e escolha uma senha de 4 números que seja fácil para você lembrar.</p>
      <label class="campo" for="pnome">Seu nome e sobrenome<input type="text" id="pnome" autocomplete="name" autocapitalize="words" placeholder="Ex.: Maria da Silva" value="${esc(nomeInicial || '')}"></label>
      ${campoSenha('ps1', 'Crie sua senha (4 números)', 'new-password')}
      ${campoSenha('ps2', 'Repita a senha', 'new-password')}
      <p class="sub">Dica: evite 1234 ou a data do seu aniversário.</p>
      <button class="btn btn-principal btn-bloco" type="submit">Criar minha conta e entrar</button></form>`);
  document.getElementById('fPrim').addEventListener('submit', async ev => { ev.preventDefault();
    const s1 = document.getElementById('ps1').value, s2 = document.getElementById('ps2').value;
    if (!/^\d{4}$/.test(s1)) return aviso('A senha precisa ter 4 números.', true);
    if (s1 !== s2) return aviso('As duas senhas não estão iguais. Digite de novo.', true);
    const b = ev.target.querySelector('button'); b.disabled = true;
    try { const r = await rpc('escola_primeiro_acesso', {p_nome: document.getElementById('pnome').value, p_pin: s1});
      salvarSessao(r); aviso('Conta criada! Guarde a sua senha.'); location.hash = '#/'; rotear(); }
    catch(e){ aviso(e.message, true); b.disabled = false; } });
}

function telaPin(){
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/">← Voltar</a>
  <form class="cartao login" id="fPin"><h2>Trocar minha senha</h2>
    ${campoSenha('pa', 'Senha atual', 'current-password')}
    ${campoSenha('pn', 'Nova senha (4 números)', 'new-password')}
    <button class="btn btn-principal" type="submit">Salvar nova senha</button></form>`);
  document.getElementById('fPin').addEventListener('submit', async ev => { ev.preventDefault();
    try { await rpc('escola_trocar_pin', {p_token:tk(), p_pin_atual:document.getElementById('pa').value, p_pin_novo:document.getElementById('pn').value}); aviso('Senha trocada. Use a nova senha na próxima vez.'); location.hash = '#/'; }
    catch(e){ aviso(e.message, true); } });
}

// ---------- aluno: início ----------
async function telaInicio(){
  carregando();
  const d = await rpc('escola_aluno_inicio', {p_token: tk()});
  const aulas = d.aulas || [];
  const notas = aulas.filter(a => a.nota != null).map(a => +a.nota);
  const media = notas.length ? notas.reduce((x,y)=>x+y,0)/notas.length : null;
  const marcadas = aulas.filter(a => a.presente != null); const pres = marcadas.filter(a => a.presente).length;
  const abertas = aulas.filter(a => a.status === 'aberta');
  const primeiroNome = String(d.nome).split(' ')[0];
  tela(`<div class="linha entre"><h1>Olá, ${esc(primeiroNome)}!</h1>
      <div class="ferramentas"><button class="btn btn-linha btn-peq" data-fs="-1" aria-label="Diminuir letra">A−</button><button class="btn btn-linha btn-peq" data-fs="1" aria-label="Aumentar letra">A+</button></div></div>
    ${abertas.length ? `<div class="prazo-box">📖 Você tem ${abertas.length} atividade${abertas.length>1?'s':''} para fazer. ${abertas.map(a=>`Aula ${a.numero}: entregar até ${esc(dataHora(a.prazo))} (${falta(a.prazo)}).`).join(' ')}</div>` : ''}
    <div class="resumo">
      <div class="num"><b>${nota(media)}</b><span>Minha média</span></div>
      <div class="num"><b>${pres}/${marcadas.length}</b><span>Presenças</span></div>
      <div class="num"><b>${aulas.filter(a=>a.status==='entregue').length}</b><span>Atividades entregues</span></div>
    </div>
    <section class="pilha"><h2>Módulo 1 · A vida cristã genuína</h2>
    <div class="aulas">${aulas.map(a => { const [cls, txt] = status(a);
      const extra = a.status === 'aberta' ? `Entregar até ${esc(dataHora(a.prazo))}` : a.status === 'entregue' ? `Nota ${nota(a.nota)}${a.corrigida ? '' : ' · aguardando correção do professor'}` : a.status === 'expirada' ? 'Você ainda pode ler o conteúdo' : 'O professor vai liberar em breve';
      const pchip = a.presente === true ? '<span class="chip chip-pres">Presente</span>' : a.presente === false ? '<span class="chip chip-falta">Faltou</span>' : '';
      const inner = `<span class="aula-num">${a.numero}</span><span class="aula-info"><h3>${esc(a.titulo)}</h3><span class="linha"><span class="chip ${cls}">${txt}</span>${pchip}</span><span class="sub">${extra}</span></span>`;
      return a.status === 'bloqueada' ? `<div class="aula-item st-bloqueada">${inner}</div>` : `<a class="aula-item st-${a.status}" href="#/aula/${a.id}">${inner}</a>`; }).join('')}</div></section>
    <div class="linha"><a class="btn btn-linha btn-peq" href="#/pin">Trocar minha senha</a><a class="btn btn-linha btn-peq" href="#/sair">Sair</a></div>`);
  app.querySelectorAll('[data-fs]').forEach(b => b.addEventListener('click', () => tamanhoFonte(+b.dataset.fs)));
}

// ---------- aula (aluno e professor) ----------
async function telaAula(id){
  carregando();
  const d = await rpc('escola_aula_abrir', {p_token: tk(), p_aula: id});
  const a = d.aula, qs = d.questoes || [], ent = d.entrega;
  const prof = sessao.papel === 'professor';
  const podeResponder = !prof && !ent && a.status === 'aberta';
  const conteudo = (a.conteudo || []).map(s => `<article class="cartao secao"><h3>${esc(s.titulo)}</h3>${s.texto ? `<p>${esc(s.texto)}</p>` : ''}${s.itens ? `<ul>${s.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : ''}${s.ref ? `<p class="ref">${esc(s.ref)}</p>` : ''}</article>`).join('');
  let atividade = '';
  if (prof) atividade = `<div class="cartao"><h2>Atividade (${qs.length} questões)</h2><p class="sub">Você está vendo como professor. Veja as respostas dos alunos em “Entregas”.</p><a class="btn btn-principal" href="#/entregas/${a.id}">Ver entregas desta aula</a></div>`;
  else if (ent) atividade = resultadoHTML(qs, ent);
  else if (a.status === 'aberta') atividade = `<div class="prazo-box">Entregue até ${esc(dataHora(a.prazo))} (${falta(a.prazo)}). Você só pode enviar uma vez.</div><form id="fAtiv" class="pilha" novalidate>${qs.map((q,i)=>questaoHTML(q,i)).join('')}
      <div id="conf" class="confirmar" hidden><b>Tem certeza que quer enviar? Depois de enviar não dá para mudar as respostas.</b><p id="faltando" class="sub"></p><div class="linha"><button type="submit" class="btn btn-verde">Sim, enviar agora</button><button type="button" class="btn btn-linha" id="cancelar">Voltar e revisar</button></div></div>
      <button type="button" class="btn btn-principal btn-bloco" id="enviar">Enviar respostas</button></form>`;
  else atividade = `<div class="cartao"><h2>Prazo encerrado</h2><p>O prazo desta atividade terminou em ${esc(dataHora(a.prazo))}. Se precisar, fale com o seu professor.</p></div>`;
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/${prof ? 'aulas' : ''}">← Voltar</a>
    <div class="pilha"><p class="sub"><b>Módulo ${a.modulo} · ${a.numero}ª Lição</b></p><h1>${esc(a.titulo)}</h1></div>
    <div class="ferramentas"><button class="btn btn-ouro btn-peq" id="ouvir">🔊 Ouvir a aula</button><button class="btn btn-linha btn-peq" data-fs="-1" aria-label="Diminuir letra">A−</button><button class="btn btn-linha btn-peq" data-fs="1" aria-label="Aumentar letra">A+</button></div>
    ${a.versiculo ? `<blockquote class="versiculo" style="margin:0"><p>“${esc(a.versiculo)}”</p><cite>${esc(a.versiculo_ref)}</cite></blockquote>` : ''}
    <section class="pilha" id="conteudo">${conteudo}</section>
    <section class="pilha" id="atividade"><h2>Exercício de fixação</h2>${atividade}</section>`);
  app.querySelectorAll('[data-fs]').forEach(b => b.addEventListener('click', () => tamanhoFonte(+b.dataset.fs)));
  const bOuvir = document.getElementById('ouvir');
  if (!('speechSynthesis' in window)) bOuvir.hidden = true;
  else bOuvir.addEventListener('click', () => {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); bOuvir.textContent = '🔊 Ouvir a aula'; return; }
    const txt = [a.titulo, a.versiculo ? a.versiculo + '. ' + a.versiculo_ref : '', ...(a.conteudo||[]).map(s => [s.titulo, s.texto, ...(s.itens||[])].filter(Boolean).join('. '))].join('. ');
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-BR'; u.rate = 0.9; u.onend = () => bOuvir.textContent = '🔊 Ouvir a aula';
    speechSynthesis.speak(u); bOuvir.textContent = '⏹ Parar de ouvir'; });
  if (podeResponder) ligarAtividade(a, qs);
}

function questaoHTML(q, i){
  const n = `<div class="q-enun"><span class="q-n">${i+1}</span><span>${esc(q.enunciado)}</span></div>`;
  const nm = 'q' + q.id; let corpo = '';
  if (q.tipo === 'unica' || q.tipo === 'multipla') {
    const t = q.tipo === 'unica' ? 'radio' : 'checkbox';
    corpo = `${q.tipo==='multipla' ? '<p class="q-dica">Pode marcar mais de uma.</p>' : '<p class="q-dica">Marque uma resposta.</p>'}<div class="opcoes">${q.dados.opcoes.map(o => `<label class="opcao"><input type="${t}" name="${nm}" value="${o.id}"><span>${esc(o.texto)}</span></label>`).join('')}</div>`;
  } else if (q.tipo === 'vf') {
    corpo = `<div class="opcoes">${q.dados.itens.map(it => `<div class="vf-linha"><span class="vf-bot"><label><input type="radio" name="${nm}_${it.id}" value="V">V</label><label><input type="radio" name="${nm}_${it.id}" value="F">F</label></span><span>${esc(it.texto)}</span></div>`).join('')}</div>`;
  } else if (q.tipo === 'relacionar') {
    corpo = `<div class="legenda">${q.dados.letras.map(l => `<span><b>${l.id.toUpperCase()}</b> – ${esc(l.texto)}</span>`).join('')}</div><p class="q-dica">Escolha a letra certa para cada frase.</p><div class="opcoes">${q.dados.itens.map(it => `<div class="rel-linha"><select name="${nm}_${it.id}" aria-label="Letra para: ${esc(it.texto)}"><option value="">—</option>${q.dados.letras.map(l=>`<option value="${l.id}">${l.id.toUpperCase()}</option>`).join('')}</select><span>${esc(it.texto)}</span></div>`).join('')}</div>`;
  } else if (q.tipo === 'lacunas') {
    let k = 0; corpo = `<p class="q-dica">Escreva a palavra que falta em cada espaço.</p><p class="lacunas">${q.dados.partes.map(p => p === null ? `<input type="text" name="${nm}_${k++}" autocomplete="off" aria-label="Espaço ${k}">` : esc(p)).join(' ')}</p>`;
  } else {
    corpo = `<p class="q-dica">Escreva com suas palavras. O professor vai corrigir esta questão.</p><textarea name="${nm}" aria-label="Sua resposta"></textarea>`;
  }
  return `<fieldset class="questao" style="margin:0" data-q="${q.id}">${n}${corpo}</fieldset>`;
}

function coletar(form, qs){
  const r = {}, vazias = [];
  qs.forEach((q, i) => { const nm = 'q' + q.id; let v = null;
    if (q.tipo === 'unica') { const el = form.querySelector(`input[name="${nm}"]:checked`); v = el ? el.value : null; }
    else if (q.tipo === 'multipla') { v = [...form.querySelectorAll(`input[name="${nm}"]:checked`)].map(e => e.value); if (!v.length) v = null; }
    else if (q.tipo === 'vf' || q.tipo === 'relacionar') { const o = {}; let alguma = false, todas = true;
      (q.dados.itens).forEach(it => { const el = q.tipo === 'vf' ? form.querySelector(`input[name="${nm}_${it.id}"]:checked`) : form.querySelector(`select[name="${nm}_${it.id}"]`);
        const val = el && el.value ? el.value : null; if (val) { o[it.id] = val; alguma = true; } else todas = false; });
      v = alguma ? o : null; if (alguma && !todas) vazias.push(i+1); }
    else if (q.tipo === 'lacunas') { const arr = [...form.querySelectorAll(`input[name^="${nm}_"]`)].map(e => e.value.trim()); v = arr.some(Boolean) ? arr : null; }
    else { const t = form.querySelector(`textarea[name="${nm}"]`).value.trim(); v = t || null; }
    if (v == null) vazias.push(i+1); else r[q.id] = v; });
  return { r, vazias: [...new Set(vazias)].sort((a,b)=>a-b) };
}

function ligarAtividade(a, qs){
  const form = document.getElementById('fAtiv'), conf = document.getElementById('conf'), bEnv = document.getElementById('enviar');
  const chave = 'escola_rasc_' + a.id + '_' + (sessao.nome || '');
  // rascunho: guarda as respostas neste aparelho até enviar
  try { const rasc = JSON.parse(store.get(chave) || 'null'); if (rasc) Object.entries(rasc).forEach(([name, val]) => {
    form.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach(el => { if (el.type === 'radio' || el.type === 'checkbox') el.checked = [].concat(val).includes(el.value); else el.value = val; }); }); } catch(_) {}
  form.addEventListener('change', () => { const o = {}; new FormData(form).forEach((v,k) => { if (form.querySelector(`[name="${CSS.escape(k)}"]`).type === 'checkbox') (o[k] = o[k] || []).push(v); else o[k] = v; }); store.set(chave, JSON.stringify(o)); });
  bEnv.addEventListener('click', () => { const { vazias } = coletar(form, qs);
    document.getElementById('faltando').textContent = vazias.length ? `Atenção: a${vazias.length>1?'s':''} questão${vazias.length>1?'ões':''} ${vazias.join(', ')} ${vazias.length>1?'estão':'está'} sem resposta ou incompleta${vazias.length>1?'s':''}.` : 'Todas as questões foram respondidas.';
    conf.hidden = false; bEnv.hidden = true; conf.scrollIntoView({block:'center'}); });
  document.getElementById('cancelar').addEventListener('click', () => { conf.hidden = true; bEnv.hidden = false; });
  form.addEventListener('submit', async ev => { ev.preventDefault(); const b = conf.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Enviando…';
    try { await rpc('escola_enviar', {p_token: tk(), p_aula: a.id, p_respostas: coletar(form, qs).r}); store.set(chave, null); aviso('Atividade enviada! Veja o seu resultado.'); await telaAula(a.id); document.getElementById('atividade').scrollIntoView(); }
    catch(e){ aviso(e.message, true); b.disabled = false; b.textContent = 'Sim, enviar agora'; } });
}

function resultadoHTML(qs, ent){
  const temAberta = qs.some(q => q.tipo === 'aberta');
  const cab = `<div class="cartao destaque"><p class="sub"><b>Sua nota nesta atividade</b></p><p class="nota-grande">${nota(ent.nota)} <span class="sub" style="font-size:1rem">de 10</span></p>
    <p>${ent.corrigida ? 'Correção concluída.' : temAberta ? 'As questões de escrever ainda serão corrigidas pelo professor. A nota pode aumentar.' : ''}</p>
    ${ent.comentario ? `<div class="feedback"><b>Recado do professor:</b> ${esc(ent.comentario)}</div>` : ''}<p class="sub">Enviada em ${esc(dataHora(ent.enviada_em))}</p></div>`;
  return cab + qs.map((q, i) => respostaHTML(q, i, ent)).join('');
}

function respostaHTML(q, i, ent, prof){
  const resp = ent.respostas ? ent.respostas[q.id] : null;
  const pts = q.tipo === 'aberta' ? (ent.pontos_prof || {})[q.id] : (ent.pontos_auto || {})[q.id];
  const n = `<div class="q-enun"><span class="q-n">${i+1}</span><span>${esc(q.enunciado)}</span></div>`;
  let corpo = '';
  const g = q.gabarito;
  if (q.tipo === 'unica' || q.tipo === 'multipla') {
    const certas = [].concat(g || []); const marc = [].concat(resp || []);
    corpo = `<div class="opcoes">${q.dados.opcoes.map(o => { const c = certas.includes(o.id), m = marc.includes(o.id);
      return `<div class="opcao ${c ? 'certa' : m ? 'errada' : ''}"><span>${m ? '☑' : '☐'}</span><span>${esc(o.texto)}${c ? ' <b>(correta)</b>' : m ? ' <b>(sua resposta)</b>' : ''}</span></div>`; }).join('')}</div>`;
  } else if (q.tipo === 'vf' || q.tipo === 'relacionar') {
    const r = resp || {};
    corpo = (q.tipo === 'relacionar' ? `<div class="legenda">${q.dados.letras.map(l => `<span><b>${l.id.toUpperCase()}</b> – ${esc(l.texto)}</span>`).join('')}</div>` : '') +
      `<div class="opcoes">${q.dados.itens.map(it => { const ok = g && r[it.id] === g[it.id];
      return `<div class="${q.tipo==='vf'?'vf-linha':'rel-linha'} ${ok ? 'certa-l' : 'errada-l'}"><b>${esc((r[it.id]||'—').toUpperCase())}</b><span>${esc(it.texto)}${!ok && g ? ` <b>→ correta: ${esc(String(g[it.id]).toUpperCase())}</b>` : ''}</span></div>`; }).join('')}</div>`;
  } else if (q.tipo === 'lacunas') {
    const arr = resp || []; let k = 0;
    corpo = `<p class="lacunas">${q.dados.partes.map(p => { if (p !== null) return esc(p); const idx = k++; const certa = g ? g[idx][0] : '';
      return `<b class="resp-aluno" style="display:inline">${esc(arr[idx] || '—')}</b>${g ? ` <span class="sub">(correta: ${esc(certa)})</span>` : ''}`; }).join(' ')}</p>`;
  } else {
    corpo = `<div class="resp-aluno">${esc(resp || '(sem resposta)')}</div>` + (prof && q.gabarito && q.gabarito.referencia ? `<div class="feedback"><b>Referência para correção:</b> ${esc(q.gabarito.referencia)}</div>` : '');
  }
  const ptxt = q.tipo === 'aberta' && !ent.corrigida ? 'Aguardando correção do professor' : `${nota(pts || 0)} de ${nota(q.pontos)} ponto`;
  const okCls = q.tipo === 'aberta' && !ent.corrigida ? '' : (+pts >= +q.pontos ? 'ok' : 'no');
  const expl = q.explicacao ? ` <span>${esc(q.explicacao)}</span>` : '';
  return `<div class="questao" data-q="${q.id}">${n}${corpo}<div class="feedback ${okCls}"><b>${ptxt}.</b>${expl}</div></div>`;
}

// ---------- professor ----------
let painel = null;
async function telaProfessor(aba){
  carregando();
  painel = await rpc('escola_prof_painel', {p_token: tk()});
  const abas = [['aulas','Aulas'],['alunos','Alunos'],['presenca','Presença'],['notas','Notas']];
  if (!abas.some(a => a[0] === aba)) aba = 'aulas';
  tela(`<div class="linha entre"><h1>Área do professor</h1><div class="linha"><a class="btn btn-linha btn-peq" href="#/pin">Trocar senha</a><a class="btn btn-linha btn-peq" href="#/sair">Sair</a></div></div>
    <nav class="abas" role="tablist">${abas.map(([k,t]) => `<a class="aba" role="tab" aria-selected="${k===aba}" href="#/${k}">${t}</a>`).join('')}</nav>
    <section id="painel" class="pilha"></section>`);
  ({aulas:profAulas, alunos:profAlunos, presenca:profPresenca, notas:profNotas})[aba]();
}
const alunos = () => (painel.usuarios || []).filter(u => u.papel === 'aluno');
const alvo = () => document.getElementById('painel');

function profAulas(){
  const hoje = isoDataSP();
  alvo().innerHTML = `<p class="sub">Ao liberar, os alunos podem ler a aula e fazer a atividade. O prazo padrão é de 3 dias, até as 23:59 do último dia. Você pode mudar a data.</p>` +
  painel.aulas.map(a => { const lib = !!a.liberada_em; const aberta = lib && new Date(a.prazo) > Date.now();
    return `<div class="cartao"><div class="linha entre"><h3>${a.numero}. ${esc(a.titulo)}</h3>
      <span class="chip ${!lib ? 'chip-bloqueada' : aberta ? 'chip-aberta' : 'chip-expirada'}">${!lib ? 'Bloqueada' : aberta ? 'Aberta' : 'Prazo encerrado'}</span></div>
      ${lib ? `<p>Prazo: <b>${esc(dataHora(a.prazo))}</b> (${falta(a.prazo)})</p>` : ''}
      <p class="sub">${a.questoes} questões · ${a.entregas} entrega${a.entregas==1?'':'s'}${a.pendentes ? ` · <b style="color:var(--vermelho)">${a.pendentes} para corrigir</b>` : ''}</p>
      <div class="linha">
        ${!lib ? `<button class="btn btn-verde btn-peq" data-lib="${a.id}">Liberar aula (prazo de 3 dias)</button>` : ''}
        <label class="campo" style="font-size:.85rem">Prazo até (23:59)<input type="date" data-prazo="${a.id}" value="${lib ? isoDataSP(a.prazo) : ''}" min="${hoje}" style="min-height:44px"></label>
        <a class="btn btn-linha btn-peq" href="#/aula/${a.id}">Ver aula</a>
        <a class="btn btn-principal btn-peq" href="#/entregas/${a.id}">Entregas</a>
        ${lib ? `<button class="btn btn-perigo btn-peq" data-bloq="${a.id}">Bloquear de novo</button>` : ''}
      </div></div>`; }).join('');
  alvo().querySelectorAll('[data-lib]').forEach(b => b.addEventListener('click', async () => { b.disabled = true;
    try { painel = await rpc('escola_prof_liberar', {p_token: tk(), p_aula: +b.dataset.lib, p_dias: 3}); aviso('Aula liberada para os alunos.'); profAulas(); } catch(e){ aviso(e.message, true); b.disabled = false; } }));
  alvo().querySelectorAll('[data-prazo]').forEach(inp => inp.addEventListener('change', async () => { if (!inp.value) return;
    try { painel = await rpc('escola_prof_prazo', {p_token: tk(), p_aula: +inp.dataset.prazo, p_data: inp.value}); aviso('Prazo atualizado.'); profAulas(); } catch(e){ aviso(e.message, true); } }));
  alvo().querySelectorAll('[data-bloq]').forEach(b => b.addEventListener('click', () => { if (b.dataset.conf) {
      rpc('escola_prof_bloquear', {p_token: tk(), p_aula: +b.dataset.bloq}).then(p => { painel = p; aviso('Aula bloqueada.'); profAulas(); }).catch(e => aviso(e.message, true));
    } else { b.dataset.conf = '1'; b.textContent = 'Toque de novo para confirmar'; } }));
}

function convite(){
  return `Olá! A Escola de Líderes (MEDE) agora tem aulas e atividades on-line:\n${location.origin}\n\nNo primeiro acesso, toque em "Primeiro acesso: criar minha senha", escreva o seu nome e sobrenome e escolha uma senha de 4 números.`;
}

function profAlunos(){
  const us = painel.usuarios || [];
  const msg = convite();
  alvo().innerHTML = `<div class="cartao destaque"><h2>Convidar alunos</h2>
      <p>Os alunos criam a própria conta: entram no site, tocam em <b>Primeiro acesso</b>, escrevem o nome e escolhem uma senha de 4 números. Mande este convite no grupo da turma:</p>
      <div class="resp-aluno">${esc(msg)}</div>
      <div class="linha"><a class="btn btn-verde" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Enviar pelo WhatsApp</a><button class="btn btn-linha" id="copMsg">Copiar convite</button></div></div>
    <form class="cartao" id="fNovo"><h2>Cadastrar alguém manualmente</h2>
      <p class="sub">Opcional. A pessoa cria a senha dela no primeiro acesso, usando exatamente este nome.</p>
      <div class="linha" style="align-items:flex-end"><label class="campo" style="flex:2 1 220px" for="nNome">Nome e sobrenome<input type="text" id="nNome" autocomplete="off"></label>
      <label class="campo" style="flex:0 1 160px" for="nPapel">Tipo<select id="nPapel"><option value="aluno">Aluno</option><option value="professor">Professor</option></select></label></div>
      <button class="btn btn-principal" type="submit">Cadastrar</button></form>
    <h2>Cadastrados (${us.length})</h2>
    ${us.map(u => `<div class="cartao" data-u="${u.id}"><div class="linha entre"><div><h3>${esc(u.nome)}</h3><p class="sub">${u.papel === 'professor' ? 'Professor' : 'Aluno'}${u.tem_senha ? '' : ' · <b style="color:var(--dourado-esc)">ainda não criou a senha</b>'}${u.ativo ? '' : ' · <b style="color:var(--vermelho)">desativado</b>'}</p></div>
      <div class="linha"><button class="btn btn-linha btn-peq" data-edit="${u.id}">Editar</button>${u.tem_senha ? `<button class="btn btn-linha btn-peq" data-pin="${u.id}">Esqueceu a senha</button>` : ''}
      ${u.id !== painelUsuarioId() ? `<button class="btn ${u.ativo ? 'btn-perigo' : 'btn-verde'} btn-peq" data-ativo="${u.id}">${u.ativo ? 'Desativar' : 'Reativar'}</button>` : ''}</div></div><div class="extra"></div></div>`).join('')}`;
  document.getElementById('copMsg').addEventListener('click', () => { (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => aviso('Convite copiado.')).catch(() => aviso('Não consegui copiar. Selecione o texto e copie.', true)); });
  document.getElementById('fNovo').addEventListener('submit', async ev => { ev.preventDefault();
    try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: null, p_nome: document.getElementById('nNome').value, p_celular: null, p_papel: document.getElementById('nPapel').value, p_gerar_pin: false});
      painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso('Cadastrado. A pessoa cria a senha no primeiro acesso.'); profAlunos(); }
    catch(e){ aviso(e.message, true); } });
  const achar = id => us.find(u => u.id === id);
  alvo().querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', async () => { const u = achar(b.dataset.pin);
    if (!b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Apagar a senha? Toque de novo'; return; }
    try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: u.id, p_nome: u.nome, p_celular: u.celular, p_papel: u.papel, p_gerar_pin: true});
      painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso(`Pronto. ${u.nome} vai criar uma senha nova no próximo acesso.`); profAlunos(); } catch(e){ aviso(e.message, true); } }));
  alvo().querySelectorAll('[data-ativo]').forEach(b => b.addEventListener('click', async () => { const u = achar(b.dataset.ativo);
    try { painel = await rpc('escola_prof_ativo', {p_token: tk(), p_id: u.id, p_ativo: !u.ativo}); profAlunos(); } catch(e){ aviso(e.message, true); } }));
  alvo().querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { const u = achar(b.dataset.edit); const ex = b.closest('.cartao').querySelector('.extra');
    ex.innerHTML = `<form class="pilha"><label class="campo">Nome e sobrenome<input type="text" name="nome" value="${esc(u.nome)}"></label>
      <label class="campo">Tipo<select name="papel"><option value="aluno" ${u.papel==='aluno'?'selected':''}>Aluno</option><option value="professor" ${u.papel==='professor'?'selected':''}>Professor</option></select></label>
      <div class="linha"><button class="btn btn-principal btn-peq">Salvar</button><button type="button" class="btn btn-linha btn-peq" data-x>Cancelar</button></div></form>`;
    ex.querySelector('[data-x]').addEventListener('click', () => ex.innerHTML = '');
    ex.querySelector('form').addEventListener('submit', async ev => { ev.preventDefault(); const f = ev.target;
      try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: u.id, p_nome: f.nome.value, p_celular: u.celular, p_papel: f.papel.value, p_gerar_pin: false});
        painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso('Dados salvos.'); profAlunos(); } catch(e){ aviso(e.message, true); } }); }));
}
function painelUsuarioId(){ return painel.eu; }

function profPresenca(){
  const libs = painel.aulas; const sel = +(store.get('escola_pres_aula') || (libs.find(a => a.liberada_em) || libs[0]).id);
  const al = alunos().filter(u => u.ativo);
  alvo().innerHTML = `<label class="campo" for="pAula">Aula<select id="pAula">${libs.map(a => `<option value="${a.id}" ${a.id===sel?'selected':''}>${a.numero}. ${esc(a.titulo)}</option>`).join('')}</select></label>
    <p class="sub">Toque em “Presente” ou “Faltou” para cada aluno. Salva na hora.</p>
    ${al.length ? al.map(u => { const p = (u.presencas || {})[sel];
      return `<div class="cartao"><div class="linha entre"><h3>${esc(u.nome)}</h3><div class="pres-bot" data-al="${u.id}">
        <button class="btn btn-linha btn-peq ${p===true?'ativo-p':''}" data-v="1" aria-pressed="${p===true}">Presente</button>
        <button class="btn btn-linha btn-peq ${p===false?'ativo-f':''}" data-v="0" aria-pressed="${p===false}">Faltou</button></div></div></div>`; }).join('') : '<p>Nenhum aluno cadastrado ainda.</p>'}`;
  document.getElementById('pAula').addEventListener('change', e => { store.set('escola_pres_aula', e.target.value); profPresenca(); });
  alvo().querySelectorAll('.pres-bot button').forEach(b => b.addEventListener('click', async () => {
    const box = b.parentElement, aid = box.dataset.al, val = b.dataset.v === '1';
    const u = alunos().find(x => x.id === aid); const atual = (u.presencas || {})[sel]; const novo = atual === val ? null : val;
    try { await rpc('escola_prof_presenca', {p_token: tk(), p_aluno: aid, p_aula: sel, p_presente: novo});
      u.presencas = u.presencas || {}; if (novo === null) delete u.presencas[sel]; else u.presencas[sel] = novo;
      box.querySelectorAll('button').forEach(x => { const on = novo !== null && (x.dataset.v === '1') === novo; x.classList.toggle('ativo-p', on && novo); x.classList.toggle('ativo-f', on && !novo); x.setAttribute('aria-pressed', on); });
    } catch(e){ aviso(e.message, true); } }));
}

function profNotas(){
  const al = alunos(); const aulas = painel.aulas;
  const linhas = al.map(u => { const ns = Object.values(u.notas || {}).map(n => +n.nota); const media = ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : null;
    const pres = Object.values(u.presencas || {}); const p = pres.filter(Boolean).length;
    return `<tr><td>${esc(u.nome)}</td>${aulas.map(a => { const n = (u.notas || {})[a.id]; const pr = (u.presencas || {})[a.id];
      return `<td class="n">${n ? nota(n.nota) + (n.corrigida ? '' : '*') : '–'}${pr === true ? ' ✓' : pr === false ? ' ✗' : ''}</td>`; }).join('')}
      <td class="n"><b>${nota(media)}</b></td><td class="n">${p}/${pres.length}</td></tr>`; }).join('');
  alvo().innerHTML = `<p class="sub">Nota de cada aula (0 a 10). * = ainda falta corrigir questão de escrever. ✓ presente · ✗ faltou.</p>
    <div class="tabela-wrap"><table><thead><tr><th>Aluno</th>${aulas.map(a => `<th class="n">Aula ${a.numero}</th>`).join('')}<th class="n">Média</th><th class="n">Presença</th></tr></thead><tbody>${linhas || `<tr><td colspan="${aulas.length+3}">Nenhum aluno ainda.</td></tr>`}</tbody></table></div>`;
}

async function telaEntregas(id){
  carregando();
  const d = await rpc('escola_prof_entregas', {p_token: tk(), p_aula: id});
  const qs = d.questoes, abertas = qs.filter(q => q.tipo === 'aberta');
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/aulas">← Voltar às aulas</a>
    <h1>Entregas · Aula ${d.aula.numero}</h1><p class="sub">${esc(d.aula.titulo)}${d.aula.prazo ? ` · prazo ${esc(dataHora(d.aula.prazo))}` : ''}</p>
    ${d.entregas.length ? '' : '<div class="cartao"><p>Nenhum aluno entregou ainda.</p></div>'}
    ${d.entregas.map(e => `<details class="cartao" ${e.corrigida ? '' : 'open'}><summary class="linha entre" style="cursor:pointer"><h3>${esc(e.aluno)}</h3>
        <span class="linha"><span class="chip ${e.corrigida ? 'chip-entregue' : 'chip-aberta'}">${e.corrigida ? 'Corrigida' : 'Para corrigir'}</span><b>Nota ${nota(e.nota)}</b></span></summary>
      <div class="pilha">${qs.map((q,i) => respostaHTML(q, i, e, true)).join('')}
      <form class="pilha cartao destaque" data-ent="${e.id}"><h3>Correção do professor</h3>
        ${abertas.length ? abertas.map(q => { const v = (e.pontos_prof || {})[q.id]; return `<label class="campo">Questão ${qs.indexOf(q)+1} (vale ${nota(q.pontos)})<select name="p${q.id}">
          ${[0,0.5,1].map(x => `<option value="${x}" ${+v===x?'selected':''}>${nota(x)} ponto</option>`).join('')}</select></label>`; }).join('') : '<p class="sub">Esta atividade não tem questões de escrever.</p>'}
        <label class="campo">Recado para o aluno (opcional)<textarea name="coment">${esc(e.comentario || '')}</textarea></label>
        <div class="linha"><button class="btn btn-verde">Salvar correção</button><button type="button" class="btn btn-perigo btn-peq" data-reabrir="${e.id}">Permitir que refaça</button></div></form></div></details>`).join('')}`);
  app.querySelectorAll('form[data-ent]').forEach(f => f.addEventListener('submit', async ev => { ev.preventDefault();
    const pts = {}; abertas.forEach(q => pts[q.id] = +f.querySelector(`[name=p${q.id}]`).value);
    try { await rpc('escola_prof_corrigir', {p_token: tk(), p_entrega: f.dataset.ent, p_pontos: pts, p_comentario: f.coment.value}); aviso('Correção salva.'); telaEntregas(id); } catch(e){ aviso(e.message, true); } }));
  app.querySelectorAll('[data-reabrir]').forEach(b => b.addEventListener('click', async () => {
    if (!b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Apagar a entrega e deixar refazer? Toque de novo'; return; }
    try { await rpc('escola_prof_reabrir', {p_token: tk(), p_entrega: b.dataset.reabrir}); aviso('Entrega apagada. O aluno pode refazer dentro do prazo.'); telaEntregas(id); } catch(e){ aviso(e.message, true); } }));
}

rotear();
})();
