(function () {
'use strict';
const SUPA = 'https://wttghfpswptovghmlthg.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dGdoZnBzd3B0b3ZnaG1sdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzYxMzEsImV4cCI6MjEwNTE1MjEzMX0.TPqD5sujHWnfnGIYCQ_OtkfYy31153KvcU5E1O-kt1c';
const DAILY_JS = 'https://unpkg.com/@daily-co/daily-js@0.93.0/dist/daily-iframe.js';
const app = document.getElementById('app');
const barra = document.getElementById('barra');
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

async function rpc(fn, args, opts){
  const r = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, { method:'POST', keepalive: !!(opts && opts.keepalive), headers:{ apikey:KEY, Authorization:'Bearer '+KEY, 'Content-Type':'application/json' }, body: JSON.stringify(args || {}) });
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
const prof = () => !!sessao && sessao.papel === 'professor';

const TZ = 'America/Sao_Paulo';
const hora = iso => iso ? new Date(iso).toLocaleTimeString('pt-BR',{timeZone:TZ, hour:'2-digit', minute:'2-digit'}) : '';
function dataHora(iso){ if(!iso) return ''; const dia = new Date(iso).toLocaleDateString('pt-BR',{timeZone:TZ, weekday:'long', day:'2-digit', month:'2-digit'}); return `${dia} às ${hora(iso)}`; }
const dataCurta = iso => iso ? new Date(iso).toLocaleDateString('pt-BR',{timeZone:TZ, day:'2-digit', month:'2-digit'}) : '';
function falta(iso){ if(!iso) return ''; const ms = new Date(iso) - Date.now(); if (ms <= 0) return 'prazo encerrado';
  const h = Math.floor(ms/3600000); if (h < 1) return 'falta menos de 1 hora'; if (h < 24) return `faltam ${h} hora${h>1?'s':''}`;
  const d = Math.floor(h/24); return `falta${d>1?'m':''} ${d} dia${d>1?'s':''}`; }
function isoDataSP(iso){ const d = iso ? new Date(iso) : new Date(); return new Intl.DateTimeFormat('en-CA',{timeZone:TZ, year:'numeric', month:'2-digit', day:'2-digit'}).format(d); }
const nota = n => (n == null ? '–' : Number(n).toLocaleString('pt-BR',{minimumFractionDigits:1, maximumFractionDigits:1}));
const media = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
function status(a){
  return { bloqueada:['chip-bloqueada','Em breve'], aberta:['chip-aberta','Atividade aberta'], entregue:['chip-entregue','Entregue'], expirada:['chip-expirada','Prazo encerrado'] }[a.status] || ['chip-bloqueada', a.status];
}
function tamanhoFonte(delta){ const atual = parseInt(store.get('escola_fs') || '20', 10); const novo = Math.min(28, Math.max(17, atual + delta)); store.set('escola_fs', String(novo)); document.documentElement.style.setProperty('--fs', novo + 'px'); }
tamanhoFonte(0);
const botoesFonte = () => `<div class="ferramentas"><button class="btn btn-linha btn-peq" data-fs="-1" aria-label="Diminuir letra">A−</button><button class="btn btn-linha btn-peq" data-fs="1" aria-label="Aumentar letra">A+</button></div>`;
const ligarFonte = () => app.querySelectorAll('[data-fs]').forEach(b => b.addEventListener('click', () => tamanhoFonte(+b.dataset.fs)));
function copiar(txt){ (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => aviso('Copiado.')).catch(() => aviso('Não consegui copiar. Selecione o texto e copie.', true)); }
const siteUrl = () => location.origin + location.pathname;

// ---------- módulos ----------
const MODULOS = { 1:'A vida cristã genuína', 2:'Visão Celular', 3:'Liderança e Aconselhamento' };
const nomeModulo = m => `Módulo ${m}` + (MODULOS[m] ? ` · ${MODULOS[m]}` : '');
function porModulo(aulas){ const g = new Map(); aulas.forEach(a => { const m = a.modulo || 1; if (!g.has(m)) g.set(m, []); g.get(m).push(a); });
  return [...g.entries()].sort((x,y) => x[0]-y[0]); }
const rotAula = a => `Módulo ${a.modulo || 1} · Lição ${a.numero}`;
function moduloAtual(aulas){
  if (!aulas.length) return 1;
  const abertas = aulas.filter(a => a.status === 'aberta'); if (abertas.length) return Math.max(...abertas.map(a => a.modulo || 1));
  const lib = aulas.filter(a => a.liberada_em || (a.status && a.status !== 'bloqueada'));
  return lib.length ? Math.max(...lib.map(a => a.modulo || 1)) : Math.min(...aulas.map(a => a.modulo || 1));
}
// Abas de módulo (Módulo 1 | Módulo 2 | Módulo 3)
function abasModulo(aulas, chave, resumo){
  const mods = porModulo(aulas); const salvo = +store.get(chave);
  const sel = mods.some(([m]) => m === salvo) ? salvo : moduloAtual(aulas);
  const html = `<div class="abas-mod" role="tablist" aria-label="Módulos">${mods.map(([m, lista]) =>
    `<button type="button" class="aba-mod" role="tab" aria-selected="${m===sel}" data-mod="${m}"><b>Módulo ${m}${lista.some(a => a.status === 'aberta') ? '<span class="novo">NOVO</span>' : ''}</b><span>${esc(resumo(lista))}</span></button>`).join('')}</div>`;
  return { sel, html, lista: (mods.find(([m]) => m === sel) || [0, []])[1] };
}
function ligarAbas(chave, redesenhar){
  app.querySelectorAll('.aba-mod').forEach(b => b.addEventListener('click', () => { store.set(chave, b.dataset.mod); redesenhar(); }));
  const ativa = app.querySelector('.aba-mod[aria-selected=true]'); if (ativa && ativa.scrollIntoView) ativa.scrollIntoView({block:'nearest', inline:'center'});
}

// ---------- barra de navegação ----------
const ICONES = {
  aulas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  vivo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/></svg>',
  conta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  alunos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M18 14.5c2.5.3 4 1.8 4 4.5"/></svg>',
  presenca:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></svg>',
  notas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'
};
let aoVivoAgora = false, abaAtiva = '';
function mostrarBarra(ativa){
  if (ativa !== undefined) abaAtiva = ativa;
  if (!sessao) { barra.hidden = true; document.body.classList.remove('com-barra'); return; }
  const itens = prof()
    ? [['aulas','#/aulas','Aulas'],['vivo','#/aovivo','Ao vivo'],['alunos','#/alunos','Alunos'],['presenca','#/presenca','Presença'],['notas','#/notas','Notas']]
    : [['aulas','#/','Minhas aulas'],['vivo','#/aovivo','Ao vivo'],['conta','#/conta','Minha conta']];
  barra.innerHTML = `<div class="barra-in">${itens.map(([k,h,t]) => `<a href="${h}" ${k===abaAtiva?'aria-current="page"':''}>${ICONES[k]}${k==='vivo' && aoVivoAgora ? '<i class="ponto-vivo" title="Aula ao vivo agora"></i>' : ''}<span>${t}${k==='vivo' && aoVivoAgora ? '<span class="sr-only"> (aula acontecendo agora)</span>' : ''}</span></a>`).join('')}</div>`;
  barra.hidden = false; document.body.classList.add('com-barra');
}
function tela(html, ativa){ sairDaSala(); pararTimers(); app.innerHTML = html; mostrarBarra(ativa || ''); app.focus({preventScroll:true}); window.scrollTo(0,0); }
function carregando(){ app.innerHTML = '<p class="carregando">Carregando…</p>'; }
function erroTela(e){ tela(`<div class="cartao"><h2>Ops!</h2><p>${esc(e.message)}</p><a class="btn btn-principal" href="#/">Voltar ao início</a></div>`); }
async function checarAoVivo(){ try { const r = await rpc('escola_ao_vivo', {p_token: tk()}); aoVivoAgora = !!r.sala; return r.sala; } catch(_) { return null; } }
let timers = [];
function pararTimers(){ timers.forEach(clearInterval); timers = []; }

// ---------- roteador ----------
async function rotear(){
  const h = location.hash.replace(/^#\/?/, '');
  const [p1, p2] = h.split('/');
  window.speechSynthesis && speechSynthesis.cancel();
  if (!sessao) { sairDaSala(); pararTimers(); barra.hidden = true; document.body.classList.remove('com-barra'); return p1 === 'primeiro' ? telaPrimeiroAcesso() : telaLogin(); }
  try {
    if (p1 === 'sair') { sairDaSala(); try { await rpc('escola_logout', {p_token: tk()}); } catch(_) {} salvarSessao(null); location.hash = '#/entrar'; return; }
    if (p1 === 'pin') return telaPin();
    if (p1 === 'aovivo') return p2 === 'entrar' ? await telaSala() : prof() ? await telaProfAoVivo(p2 ? +p2 : null) : await telaAlunoAoVivo();
    if (p1 === 'aula' && p2) return await telaAula(+p2);
    if (prof()) {
      if (p1 === 'entregas' && p2) return await telaEntregas(+p2);
      return await telaProfessor(p1 || 'aulas');
    }
    if (p1 === 'conta') return telaConta();
    return await telaInicio();
  } catch (e) { erroTela(e); }
}
window.addEventListener('hashchange', rotear);

// ---------- login ----------
const campoSenha = (id, rotulo, auto) => `<label class="campo" for="${id}">${rotulo}<input type="password" id="${id}" class="pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="${auto}" placeholder="••••"></label>`;

function telaLogin(){
  tela(`<section class="login pilha">
    <div class="boas-vindas"><img src="igreja.webp" alt="" width="110" height="117"><h1>Bem-vindo à Escola de Líderes</h1>
    <p class="sub">Entre com o seu nome e a sua senha de 4 números.</p></div>
    <form class="cartao" id="fLogin" novalidate>
      <label class="campo" for="nome">Seu nome e sobrenome<input type="text" id="nome" autocomplete="name" autocapitalize="words" placeholder="Ex.: Maria da Silva"></label>
      ${campoSenha('pin', 'Sua senha (4 números)', 'current-password')}
      <button class="btn btn-principal btn-bloco" type="submit">Entrar</button>
    </form>
    <div class="cartao"><h3>É a sua primeira vez aqui?</h3><p>Crie a sua conta com o seu nome e uma senha de 4 números que você escolher.</p>
      <a class="btn btn-ouro btn-bloco" href="#/primeiro">Primeiro acesso: criar minha senha</a>
      <p class="sub">Esqueceu a senha? Fale com o seu professor.</p></div></section>`);
  document.getElementById('fLogin').addEventListener('submit', async ev => {
    ev.preventDefault(); const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Entrando…';
    try { const r = await rpc('escola_login', { p_nome: document.getElementById('nome').value, p_pin: document.getElementById('pin').value });
      if (r.criar_senha) { aviso('Bem-vindo! Agora crie a sua senha.'); return telaPrimeiroAcesso(r.nome); }
      salvarSessao(r); entrarDepoisDoLogin(); }
    catch(e){ aviso(e.message, true); b.disabled = false; b.textContent = 'Entrar'; }
  });
}
// Se o aluno veio por um link de aula ao vivo, volta para ele depois de entrar
let destinoDepoisLogin = /^#\/aovivo/.test(location.hash) ? location.hash : null;
function entrarDepoisDoLogin(){ const d = destinoDepoisLogin; destinoDepoisLogin = null; if (d && location.hash !== d) location.hash = d; else if (location.hash !== '#/') location.hash = '#/'; else rotear(); }

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
      salvarSessao(r); aviso('Conta criada! Guarde a sua senha.'); entrarDepoisDoLogin(); }
    catch(e){ aviso(e.message, true); b.disabled = false; } });
}

function telaPin(){
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/${prof() ? 'aulas' : 'conta'}">← Voltar</a>
  <form class="cartao login" id="fPin"><h2>Trocar minha senha</h2>
    ${campoSenha('pa', 'Senha atual', 'current-password')}
    ${campoSenha('pn', 'Nova senha (4 números)', 'new-password')}
    <button class="btn btn-principal" type="submit">Salvar nova senha</button></form>`, prof() ? '' : 'conta');
  document.getElementById('fPin').addEventListener('submit', async ev => { ev.preventDefault();
    try { await rpc('escola_trocar_pin', {p_token:tk(), p_pin_atual:document.getElementById('pa').value, p_pin_novo:document.getElementById('pn').value}); aviso('Senha trocada. Use a nova senha na próxima vez.'); location.hash = '#/'; }
    catch(e){ aviso(e.message, true); } });
}

function telaConta(){
  tela(`<h1>Minha conta</h1>
    <div class="cartao"><p class="sub">Você entrou como</p><h2>${esc(sessao.nome || '')}</h2></div>
    <div class="cartao"><h3>Tamanho da letra</h3><p class="sub">Deixe as letras do jeito mais confortável para você ler.</p>${botoesFonte()}</div>
    <div class="cartao"><h3>Senha</h3><a class="btn btn-linha" href="#/pin">Trocar minha senha</a></div>
    ${ajudaAluno(true)}
    <a class="btn btn-perigo" href="#/sair">Sair da minha conta</a>`, 'conta');
  ligarFonte();
}
const ajudaAluno = aberta => `<details class="cartao ajuda-geral" ${aberta ? 'open' : ''}><summary>Como funciona a Escola de Líderes no site?</summary>
  <ol class="pilha" style="margin:0; padding-left:1.2em">
    <li>Em <b>Minhas aulas</b>, escolha o <b>módulo</b> nas abas (Módulo 1, Módulo 2, Módulo 3).</li>
    <li>Toque na <b>lição</b> que o professor liberou. Leia o conteúdo ou toque em <b>Ouvir a aula</b>.</li>
    <li>No fim da página, responda a <b>atividade</b> e toque em <b>Enviar respostas</b> antes do prazo. Só dá para enviar uma vez.</li>
    <li>A nota aparece na hora. As perguntas de escrever são corrigidas pelo professor depois.</li>
    <li>No horário da aula, toque em <b>Ao vivo</b> para entrar na sala de vídeo. Sua presença é registrada sozinha.</li>
  </ol></details>`;

// ---------- aluno: início ----------
let inicioDados = null;
async function telaInicio(){
  carregando();
  const [d, sala] = await Promise.all([rpc('escola_aluno_inicio', {p_token: tk()}), checarAoVivo()]);
  inicioDados = { d, sala };
  desenharInicio();
}
function desenharInicio(){
  const { d, sala } = inicioDados; const aulas = d.aulas || [];
  const abertas = aulas.filter(a => a.status === 'aberta').sort((a,b) => new Date(a.prazo) - new Date(b.prazo));
  const primeiroNome = String(d.nome).split(' ')[0];
  const ab = abasModulo(aulas, 'escola_mod_aluno', l => `${l.filter(a=>a.status==='entregue').length} de ${l.length} feitas`);
  const lista = ab.lista;
  const ns = lista.filter(a => a.nota != null).map(a => +a.nota);
  const marcadas = lista.filter(a => a.presente != null); const pres = marcadas.filter(a => a.presente).length;
  const feitas = lista.filter(a => a.status === 'entregue').length;
  const proximo = abertas.length
    ? `<section class="passo"><h2>📖 Seu próximo passo</h2>${abertas.map(a => `<div class="tarefa"><span class="trilha">${esc(rotAula(a))}</span><b>${esc(a.titulo)}</b>
        <span class="peq">Entregar até ${esc(dataHora(a.prazo))} · <b>${falta(a.prazo)}</b></span>
        <a class="btn btn-principal" href="#/aula/${a.id}">Ler a aula e fazer a atividade →</a></div>`).join('')}</section>`
    : `<div class="tudo-certo">✅ Você está em dia! Nenhuma atividade pendente agora.</div>`;
  tela(`<div class="linha entre"><h1>Olá, ${esc(primeiroNome)}!</h1>${botoesFonte()}</div>
    <div class="inicio-grid"><aside class="pilha lateral">
    ${sala ? cartaoAoVivo(sala) : ''}
    ${proximo}
    <div class="so-pc">${ajudaAluno(false)}</div></aside>
    <section class="pilha" aria-label="Minhas aulas por módulo">
      ${ab.html}
      <div class="cab-mod"><h2>${esc(nomeModulo(ab.sel))}</h2>
        <div class="progresso" role="img" aria-label="${feitas} de ${lista.length} atividades feitas"><i style="width:${lista.length ? Math.round(100*feitas/lista.length) : 0}%"></i></div>
        <p class="sub peq">${feitas} de ${lista.length} atividades feitas neste módulo</p></div>
      <div class="resumo">
        <div class="num"><b>${nota(media(ns))}</b><span>Média do módulo</span></div>
        <div class="num"><b>${pres}/${marcadas.length}</b><span>Presenças</span></div>
        <div class="num"><b>${feitas}</b><span>Entregues</span></div>
      </div>
      <div class="aulas grade">${lista.map(itemAula).join('')}</div>
    </section></div>
    <div class="so-cel">${ajudaAluno(false)}</div>`, 'aulas');
  ligarFonte(); ligarAbas('escola_mod_aluno', desenharInicio);
}
function itemAula(a){
  const [cls, txt] = status(a);
  const extra = a.status === 'aberta' ? `Entregar até ${esc(dataHora(a.prazo))}` : a.status === 'entregue' ? `Nota ${nota(a.nota)}${a.corrigida ? '' : ' · aguardando correção'}` : a.status === 'expirada' ? 'Você ainda pode ler o conteúdo' : 'O professor vai liberar em breve';
  const pchip = a.presente === true ? '<span class="chip chip-pres">Presente</span>' : a.presente === false ? '<span class="chip chip-falta">Faltou</span>' : '';
  const inner = `<span class="aula-num" aria-hidden="true">${a.status === 'entregue' ? '✓' : a.numero}</span><span class="aula-info"><span class="sub peq">Lição ${a.numero}</span><h3>${esc(a.titulo)}</h3><span class="linha"><span class="chip ${cls}">${txt}</span>${pchip}</span><span class="sub peq">${extra}</span></span>`;
  return a.status === 'bloqueada' ? `<div class="aula-item st-bloqueada">${inner}<span></span></div>` : `<a class="aula-item st-${a.status}" href="#/aula/${a.id}">${inner}<span class="seta" aria-hidden="true">›</span></a>`;
}
function cartaoAoVivo(sala){
  return `<section class="vivo"><span class="selo-vivo">AO VIVO AGORA</span><h2>${esc(sala.titulo)}</h2>
    ${sala.aula ? `<p class="peq">${esc(rotAula(sala.aula))}: ${esc(sala.aula.titulo)}</p>` : ''}
    <a class="btn btn-ouro" href="#/aovivo/entrar">🎥 Entrar na aula ao vivo</a></section>`;
}

// ---------- aula (aluno e professor) ----------
async function telaAula(id){
  carregando();
  const d = await rpc('escola_aula_abrir', {p_token: tk(), p_aula: id});
  const a = d.aula, qs = d.questoes || [], ent = d.entrega;
  const ehProf = prof();
  const podeResponder = !ehProf && !ent && a.status === 'aberta';
  const conteudo = (a.conteudo || []).map(s => `<article class="cartao secao"><h3>${esc(s.titulo)}</h3>${s.texto ? `<p>${esc(s.texto)}</p>` : ''}${s.itens ? `<ul>${s.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : ''}${s.ref ? `<p class="ref">${esc(s.ref)}</p>` : ''}</article>`).join('');
  let atividade = '';
  if (ehProf) atividade = `<div class="cartao"><h2>Atividade (${qs.length} questões)</h2><p class="sub">Você está vendo como professor. Veja as respostas dos alunos em “Entregas”.</p><a class="btn btn-principal" href="#/entregas/${a.id}">Ver entregas desta aula</a></div>`;
  else if (ent) atividade = resultadoHTML(qs, ent);
  else if (a.status === 'aberta') atividade = `<div class="prazo-box">⏰ Entregue até ${esc(dataHora(a.prazo))} (${falta(a.prazo)}). Você só pode enviar uma vez. Suas respostas ficam guardadas neste aparelho até você enviar.</div>
      <form id="fAtiv" class="pilha" novalidate>${qs.map((q,i)=>questaoHTML(q,i)).join('')}
      <div id="conf" class="confirmar" hidden><b>Tem certeza que quer enviar? Depois de enviar não dá para mudar as respostas.</b><p id="faltando" class="sub"></p><div class="linha"><button type="submit" class="btn btn-verde">Sim, enviar agora</button><button type="button" class="btn btn-linha" id="cancelar">Voltar e revisar</button></div></div>
      <div class="envio-fixo" id="barraEnvio"><span class="cont" id="contagem">0 de ${qs.length} respondidas</span><button type="button" class="btn btn-principal" id="enviar">Enviar respostas</button></div></form>`;
  else atividade = `<div class="cartao"><h2>Prazo encerrado</h2><p>O prazo desta atividade terminou em ${esc(dataHora(a.prazo))}. Se precisar, fale com o seu professor.</p></div>`;
  const [cls, txt] = status(a);
  tela(`<div class="leitura"><a class="btn btn-linha btn-peq voltar" href="#/${ehProf ? 'aulas' : ''}">← Voltar às aulas</a>
    <div class="pilha" style="gap:8px"><span class="trilha">${esc(rotAula(a))}</span><h1>${esc(a.titulo)}</h1>${ehProf ? '' : `<span class="chip ${cls}">${txt}</span>`}</div>
    ${ehProf ? '' : `<nav class="etapas" aria-label="Passos da lição"><a class="etapa" href="#conteudo"><i>1</i>Ler a aula</a><a class="etapa ${ent ? 'ok' : ''}" href="#atividade"><i>${ent ? '✓' : '2'}</i>${ent ? 'Ver meu resultado' : 'Fazer a atividade'}</a></nav>`}
    <div class="ferramentas"><button class="btn btn-ouro btn-peq" id="ouvir">🔊 Ouvir a aula</button><button class="btn btn-linha btn-peq" data-fs="-1" aria-label="Diminuir letra">A−</button><button class="btn btn-linha btn-peq" data-fs="1" aria-label="Aumentar letra">A+</button></div>
    ${a.versiculo ? `<blockquote class="versiculo"><p>“${esc(a.versiculo)}”</p><cite>${esc(a.versiculo_ref)}</cite></blockquote>` : ''}
    <section class="pilha" id="conteudo">${conteudo}</section>
    <section class="pilha" id="atividade"><h2>Exercício de fixação</h2>${atividade}</section></div>`, 'aulas');
  app.querySelectorAll('.etapa').forEach(l => l.addEventListener('click', ev => { ev.preventDefault(); document.querySelector(l.getAttribute('href')).scrollIntoView({behavior:'smooth'}); }));
  ligarFonte();
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
    corpo = `<p class="q-dica">Toque em V (verdadeiro) ou F (falso) em cada frase.</p><div class="opcoes">${q.dados.itens.map(it => `<div class="vf-linha"><span class="vf-bot"><label><input type="radio" name="${nm}_${it.id}" value="V">V</label><label><input type="radio" name="${nm}_${it.id}" value="F">F</label></span><span>${esc(it.texto)}</span></div>`).join('')}</div>`;
  } else if (q.tipo === 'relacionar') {
    corpo = `<div class="legenda">${q.dados.letras.map(l => `<span><b>${l.id.toUpperCase()}</b> – ${esc(l.texto)}</span>`).join('')}</div><p class="q-dica">Escolha a letra certa para cada frase.</p><div class="opcoes">${q.dados.itens.map(it => `<div class="rel-linha"><select name="${nm}_${it.id}" aria-label="Letra para: ${esc(it.texto)}"><option value="">—</option>${q.dados.letras.map(l=>`<option value="${l.id}">${l.id.toUpperCase()}</option>`).join('')}</select><span>${esc(it.texto)}</span></div>`).join('')}</div>`;
  } else if (q.tipo === 'lacunas') {
    let k = 0; corpo = `<p class="q-dica">Escreva a palavra que falta em cada espaço.</p><p class="lacunas">${q.dados.partes.map(p => p === null ? `<input type="text" name="${nm}_${k++}" autocomplete="off" aria-label="Espaço ${k}">` : esc(p)).join(' ')}</p>`;
  } else {
    corpo = `<p class="q-dica">Escreva com suas palavras. O professor vai corrigir esta questão.</p><textarea name="${nm}" aria-label="Sua resposta"></textarea>`;
  }
  return `<fieldset class="questao" data-q="${q.id}">${n}${corpo}</fieldset>`;
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
    else if (q.tipo === 'lacunas') { const arr = [...form.querySelectorAll(`input[name^="${nm}_"]`)].map(e => e.value.trim()); v = arr.some(Boolean) ? arr : null; if (v && arr.some(x => !x)) vazias.push(i+1); }
    else { const t = form.querySelector(`textarea[name="${nm}"]`).value.trim(); v = t || null; }
    if (v == null) vazias.push(i+1); else r[q.id] = v; });
  return { r, vazias: [...new Set(vazias)].sort((a,b)=>a-b) };
}

function ligarAtividade(a, qs){
  const form = document.getElementById('fAtiv'), conf = document.getElementById('conf'), bEnv = document.getElementById('enviar'), barraEnv = document.getElementById('barraEnvio');
  const chave = 'escola_rasc_' + a.id + '_' + (sessao.nome || '');
  try { const rasc = JSON.parse(store.get(chave) || 'null'); if (rasc) Object.entries(rasc).forEach(([name, val]) => {
    form.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach(el => { if (el.type === 'radio' || el.type === 'checkbox') el.checked = [].concat(val).includes(el.value); else el.value = val; }); }); } catch(_) {}
  const atualizar = () => { const { r, vazias } = coletar(form, qs); const feitas = qs.length - vazias.length;
    document.getElementById('contagem').textContent = feitas === qs.length ? `Tudo respondido! (${qs.length} de ${qs.length})` : `${feitas} de ${qs.length} respondidas`;
    form.querySelectorAll('.questao').forEach((f, i) => f.classList.toggle('feita', !vazias.includes(i+1) && r[qs[i].id] != null)); };
  const guardar = () => { const o = {}; new FormData(form).forEach((v,k) => { if (form.querySelector(`[name="${CSS.escape(k)}"]`).type === 'checkbox') (o[k] = o[k] || []).push(v); else o[k] = v; }); store.set(chave, JSON.stringify(o)); atualizar(); };
  let t; form.addEventListener('change', guardar); form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(guardar, 400); });
  atualizar();
  bEnv.addEventListener('click', () => { const { vazias } = coletar(form, qs);
    document.getElementById('faltando').textContent = vazias.length ? `Atenção: a${vazias.length>1?'s':''} questão${vazias.length>1?'ões':''} ${vazias.join(', ')} ${vazias.length>1?'estão':'está'} sem resposta ou incompleta${vazias.length>1?'s':''}.` : 'Todas as questões foram respondidas.';
    conf.hidden = false; barraEnv.hidden = true; conf.scrollIntoView({block:'center', behavior:'smooth'}); });
  document.getElementById('cancelar').addEventListener('click', () => { conf.hidden = true; barraEnv.hidden = false; });
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

function respostaHTML(q, i, ent, ehProf){
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
    corpo = `<div class="resp-aluno">${esc(resp || '(sem resposta)')}</div>` + (ehProf && q.gabarito && q.gabarito.referencia ? `<div class="feedback"><b>Referência para correção:</b> ${esc(q.gabarito.referencia)}</div>` : '');
  }
  const ptxt = q.tipo === 'aberta' && !ent.corrigida ? 'Aguardando correção do professor' : `${nota(pts || 0)} de ${nota(q.pontos)} ponto`;
  const okCls = q.tipo === 'aberta' && !ent.corrigida ? '' : (+pts >= +q.pontos ? 'ok' : 'no');
  const expl = q.explicacao ? ` <span>${esc(q.explicacao)}</span>` : '';
  return `<div class="questao" data-q="${q.id}">${n}${corpo}<div class="feedback ${okCls}"><b>${ptxt}.</b>${expl}</div></div>`;
}

// ---------- AULA AO VIVO ----------
const convidarAoVivo = () => `🔴 A aula da Escola de Líderes está AO VIVO agora!\nEntre no site, faça o login e toque em "Ao vivo":\n${siteUrl()}#/aovivo/entrar`;
const ehDaily = l => /^https:\/\/[a-z0-9-]+\.daily\.co\/[^\s]+$/i.test(l || '');
const ehJitsi = l => /^https:\/\/(meet\.jit\.si|8x8\.vc|[^/]*jitsi[^/]*)\//i.test(l || '');
const linkComNome = (l, nome) => ehJitsi(l) ? `${l.split('#')[0]}#userInfo.displayName=${encodeURIComponent(JSON.stringify(nome))}` : l;

async function telaAlunoAoVivo(){
  carregando();
  const sala = await checarAoVivo();
  if (sala) { location.hash = '#/aovivo/entrar'; return; }
  tela(`<h1>Aula ao vivo</h1>
    <div class="cartao"><h2>Nenhuma aula ao vivo agora</h2><p>Quando o professor abrir a sala, ela aparece aqui e na sua página inicial. Toque em <b>Ao vivo</b> no horário da aula.</p>
    <button class="btn btn-principal" id="atualizar">Verificar de novo</button></div>
    <div class="ajuda"><b>Como funciona a aula ao vivo:</b><ol>
      <li>No horário da aula, toque em <b>Ao vivo</b> aqui embaixo.</li>
      <li>Toque em <b>Entrar na aula</b>. Seu nome entra junto, não precisa digitar.</li>
      <li>Permita o uso da câmera e do microfone se o celular perguntar.</li>
      <li>Fique com esta página aberta até o fim: a presença é marcada pelo tempo que você ficou na aula.</li></ol></div>`, 'vivo');
  document.getElementById('atualizar').addEventListener('click', telaAlunoAoVivo);
  // verifica sozinho a cada 30 segundos
  timers.push(setInterval(async () => { if (await checarAoVivo()) location.hash = '#/aovivo/entrar'; }, 30000));
}

// Presença na sala: o site manda um "sinal" a cada 45 s enquanto a pessoa está na página da aula
let salaAtual = null;
function sairDaSala(){
  if (!salaAtual) return; const s = salaAtual; salaAtual = null;
  clearInterval(s.timer); clearInterval(s.timerLista);
  document.removeEventListener('visibilitychange', s.vis); window.removeEventListener('pagehide', s.ph);
  try { s.frame && s.frame.destroy(); } catch(_) {}
  rpc('escola_ao_vivo_sinal', {p_token: tk(), p_segmento: s.seg, p_sair: true}, {keepalive:true}).catch(() => {});
}
function carregarDaily(){ return new Promise((ok, falha) => { if (window.Daily || window.DailyIframe) return ok(window.Daily || window.DailyIframe);
  const s = document.createElement('script'); s.src = DAILY_JS; s.onload = () => ok(window.Daily || window.DailyIframe); s.onerror = () => falha(new Error('Não foi possível carregar o vídeo. Verifique a internet.')); document.head.appendChild(s); }); }

async function telaSala(){
  carregando();
  const sala = await checarAoVivo();
  if (!sala) { aviso('A aula ao vivo já terminou ou ainda não começou.', true); location.hash = '#/aovivo'; return; }
  const r = await rpc('escola_ao_vivo_entrar', {p_token: tk(), p_sala: sala.id});
  const link = sala.link;
  const ehP = prof();
  const voltar = ehP ? '#/aovivo' : '#/';
  tela(`<div class="linha entre"><span class="selo-vivo">AO VIVO</span><button class="btn btn-perigo btn-peq" id="sairSala">Sair da aula</button></div>
    <div class="pilha" style="gap:4px"><h1>${esc(sala.titulo)}</h1>${sala.aula ? `<p class="sub">${esc(rotAula(sala.aula))}: ${esc(sala.aula.titulo)}</p>` : ''}</div>
    <div class="${ehP ? 'sala-grid' : 'pilha'}"><div class="pilha">
    ${ehDaily(link) ? `<div class="video-caixa" id="video"><p class="carregando" style="color:#fff">Abrindo o vídeo…</p></div>`
      : link ? `<div class="cartao destaque"><h2>Abrir a sala de vídeo</h2><p>A aula acontece em outra página. Toque no botão abaixo${ehJitsi(link) ? ' (seu nome já vai preenchido)' : ''} e <b>deixe esta página do site aberta</b> para a sua presença ser registrada.</p>
          <a class="btn btn-verde btn-bloco" target="_blank" rel="noopener" href="${esc(linkComNome(link, sessao.nome))}">🎥 Abrir a sala de vídeo</a></div>`
      : `<div class="cartao"><p>O professor ainda não colocou o link do vídeo. Sua presença já está sendo registrada.</p></div>`}
    <p class="tudo-certo">✅ Você entrou como <b>${esc(sessao.nome)}</b>. Sua presença está sendo registrada enquanto esta página estiver aberta.</p></div>
    ${ehP ? `<section class="cartao lista-lateral"><div class="linha entre"><h2>Quem está na aula</h2><a class="btn btn-linha btn-peq" href="#/aovivo">Painel da aula</a></div><div id="listaVivo" class="pessoas"><p class="sub">Carregando…</p></div></section>` : ''}</div>`, 'vivo');
  salaAtual = { id: sala.id, seg: r.segmento };
  const s = salaAtual;
  const terminar = msg => { if (salaAtual !== s) return; sairDaSala(); aviso(msg); location.hash = voltar; };
  const sinal = async () => { try { const x = await rpc('escola_ao_vivo_sinal', {p_token: tk(), p_segmento: s.seg}); if (x && x.encerrada) terminar('O professor encerrou a aula. Obrigado por participar!'); } catch(_) {} };
  s.timer = setInterval(sinal, 45000);
  s.vis = () => { if (document.visibilityState === 'visible') sinal(); }; document.addEventListener('visibilitychange', s.vis);
  s.ph = () => { if (salaAtual === s) rpc('escola_ao_vivo_sinal', {p_token: tk(), p_segmento: s.seg, p_sair: true}, {keepalive:true}).catch(()=>{}); }; window.addEventListener('pagehide', s.ph);
  document.getElementById('sairSala').addEventListener('click', () => terminar('Você saiu da aula.'));
  if (ehP) { const lista = async () => { if (salaAtual !== s) return; try { const rel = await rpc('escola_prof_sala_relatorio', {p_token: tk(), p_sala: s.id}); const el = document.getElementById('listaVivo'); if (el) el.innerHTML = listaPessoas(rel.participantes); } catch(_) {} };
    lista(); s.timerLista = setInterval(lista, 15000); }
  if (ehDaily(link)) {
    try { const Daily = await carregarDaily(); if (salaAtual !== s) return;
      const caixa = document.getElementById('video'); caixa.innerHTML = '';
      const opcoes = { iframeStyle:{ width:'100%', height:'100%', border:'0' }, showLeaveButton:true, showFullscreenButton:true };
      try { s.frame = Daily.createFrame(caixa, { ...opcoes, lang:'pt-BR' }); } catch(_) { s.frame = Daily.createFrame(caixa, opcoes); }
      s.frame.on('left-meeting', () => terminar('Você saiu da aula.'));
      await s.frame.join({ url: link, userName: sessao.nome });
    } catch(e) { const v = document.getElementById('video'); if (v) v.outerHTML = `<div class="cartao"><p>${esc(e.message || 'Não foi possível abrir o vídeo aqui.')}</p><a class="btn btn-verde" target="_blank" rel="noopener" href="${esc(link)}">Abrir a sala em outra aba</a></div>`; }
  }
}
function listaPessoas(ps){
  const lista = ps || [];
  if (!lista.length) return '<p class="sub">Ninguém entrou ainda.</p>';
  const on = lista.filter(p => p.online).length;
  return `<p class="sub peq"><b>${on}</b> na aula agora · <b>${lista.length}</b> ${lista.length == 1 ? 'pessoa entrou' : 'pessoas entraram'} ao todo</p>` + lista.map(p => `<div class="pessoa"><span class="bola ${p.online ? 'on' : ''}" title="${p.online ? 'Na aula agora' : 'Saiu'}"></span>
    <span><b>${esc(p.nome)}</b>${p.papel === 'professor' ? ' <span class="chip chip-aberta">Professor</span>' : ''}${p.presenca === true ? ' <span class="chip chip-pres">Presença lançada</span>' : ''}<br><span class="sub peq">Entrou às ${hora(p.entrou_em)}${p.online ? ' · na aula agora' : ` · saiu às ${hora(p.ultimo)}`}${p.entradas > 1 ? ` · entrou ${p.entradas} vezes` : ''}</span></span>
    <span class="min">${p.minutos} min</span></div>`).join('');
}

// ---------- professor ----------
let painel = null;
async function telaProfessor(aba){
  carregando();
  const [p] = await Promise.all([rpc('escola_prof_painel', {p_token: tk()}), checarAoVivo()]);
  painel = p;
  const telas = {aulas:profAulas, alunos:profAlunos, presenca:profPresenca, notas:profNotas};
  (telas[aba] || profAulas)();
}
const alunos = () => (painel.usuarios || []).filter(u => u.papel === 'aluno');
const cabProf = titulo => `<div class="linha entre"><h1>${titulo}</h1><div class="linha"><a class="btn btn-linha btn-peq" href="#/pin">Trocar senha</a><a class="btn btn-linha btn-peq" href="#/sair">Sair</a></div></div>`;
const avisoAoVivoProf = () => aoVivoAgora ? `<a class="vivo" href="#/aovivo" style="text-decoration:none"><span class="selo-vivo">AO VIVO AGORA</span><b>Há uma aula ao vivo aberta. Toque para ver quem está na sala.</b></a>` : '';

function profAulas(){
  const ab = abasModulo(painel.aulas, 'escola_mod_prof', l => `${l.filter(a=>a.liberada_em).length} de ${l.length} liberadas`);
  const hoje = isoDataSP();
  tela(cabProf('Aulas') + avisoAoVivoProf() + ab.html + `<h2>${esc(nomeModulo(ab.sel))}</h2>
    <p class="sub peq">Ao liberar, os alunos podem ler a aula e fazer a atividade. O prazo padrão é de 3 dias, até as 23:59 do último dia. Você pode mudar a data.</p>
    <div class="grade-prof">${ab.lista.map(a => { const lib = !!a.liberada_em; const aberta = lib && new Date(a.prazo) > Date.now();
    return `<div class="cartao"><div class="linha entre"><h3>${a.numero}. ${esc(a.titulo)}</h3>
      <span class="chip ${!lib ? 'chip-bloqueada' : aberta ? 'chip-aberta' : 'chip-expirada'}">${!lib ? 'Bloqueada' : aberta ? 'Aberta' : 'Prazo encerrado'}</span></div>
      ${lib ? `<p>Prazo: <b>${esc(dataHora(a.prazo))}</b> (${falta(a.prazo)})</p>` : ''}
      <p class="sub peq">${a.questoes} questões · ${a.entregas} entrega${a.entregas==1?'':'s'}${a.pendentes ? ` · <b style="color:var(--vermelho)">${a.pendentes} para corrigir</b>` : ''}</p>
      <div class="linha">
        ${!lib ? `<button class="btn btn-verde btn-peq" data-lib="${a.id}">Liberar aula (prazo de 3 dias)</button>` : ''}
        <label class="campo peq">Prazo até (23:59)<input type="date" data-prazo="${a.id}" value="${lib ? isoDataSP(a.prazo) : ''}" min="${hoje}" style="min-height:44px"></label>
        <a class="btn btn-linha btn-peq" href="#/aula/${a.id}">Ver aula</a>
        <a class="btn btn-principal btn-peq" href="#/entregas/${a.id}">Entregas</a>
        ${lib ? `<button class="btn btn-perigo btn-peq" data-bloq="${a.id}">Bloquear de novo</button>` : ''}
      </div></div>`; }).join('')}</div>`, 'aulas');
  ligarAbas('escola_mod_prof', profAulas);
  app.querySelectorAll('[data-lib]').forEach(b => b.addEventListener('click', async () => { b.disabled = true;
    try { painel = await rpc('escola_prof_liberar', {p_token: tk(), p_aula: +b.dataset.lib, p_dias: 3}); aviso('Aula liberada para os alunos.'); profAulas(); } catch(e){ aviso(e.message, true); b.disabled = false; } }));
  app.querySelectorAll('[data-prazo]').forEach(inp => inp.addEventListener('change', async () => { if (!inp.value) return;
    try { painel = await rpc('escola_prof_prazo', {p_token: tk(), p_aula: +inp.dataset.prazo, p_data: inp.value}); aviso('Prazo atualizado.'); profAulas(); } catch(e){ aviso(e.message, true); } }));
  app.querySelectorAll('[data-bloq]').forEach(b => b.addEventListener('click', () => { if (b.dataset.conf) {
      rpc('escola_prof_bloquear', {p_token: tk(), p_aula: +b.dataset.bloq}).then(p => { painel = p; aviso('Aula bloqueada.'); profAulas(); }).catch(e => aviso(e.message, true));
    } else { b.dataset.conf = '1'; b.textContent = 'Toque de novo para confirmar'; } }));
}

const convite = () => `Olá! A Escola de Líderes (MEDE) agora tem aulas e atividades on-line:\n${siteUrl()}\n\nNo primeiro acesso, toque em "Primeiro acesso: criar minha senha", escreva o seu nome e sobrenome e escolha uma senha de 4 números.`;

function profAlunos(){
  const us = painel.usuarios || [];
  const msg = convite();
  tela(cabProf('Alunos') + `<div class="cartao destaque"><h2>Convidar alunos</h2>
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
      ${u.id !== painel.eu ? `<button class="btn ${u.ativo ? 'btn-perigo' : 'btn-verde'} btn-peq" data-ativo="${u.id}">${u.ativo ? 'Desativar' : 'Reativar'}</button>` : ''}</div></div><div class="extra"></div></div>`).join('')}`, 'alunos');
  document.getElementById('copMsg').addEventListener('click', () => copiar(msg));
  document.getElementById('fNovo').addEventListener('submit', async ev => { ev.preventDefault();
    try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: null, p_nome: document.getElementById('nNome').value, p_celular: null, p_papel: document.getElementById('nPapel').value, p_gerar_pin: false});
      painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso('Cadastrado. A pessoa cria a senha no primeiro acesso.'); profAlunos(); }
    catch(e){ aviso(e.message, true); } });
  const achar = id => us.find(u => u.id === id);
  app.querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', async () => { const u = achar(b.dataset.pin);
    if (!b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Apagar a senha? Toque de novo'; return; }
    try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: u.id, p_nome: u.nome, p_celular: u.celular, p_papel: u.papel, p_gerar_pin: true});
      painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso(`Pronto. ${u.nome} vai criar uma senha nova no próximo acesso.`); profAlunos(); } catch(e){ aviso(e.message, true); } }));
  app.querySelectorAll('[data-ativo]').forEach(b => b.addEventListener('click', async () => { const u = achar(b.dataset.ativo);
    try { painel = await rpc('escola_prof_ativo', {p_token: tk(), p_id: u.id, p_ativo: !u.ativo}); profAlunos(); } catch(e){ aviso(e.message, true); } }));
  app.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { const u = achar(b.dataset.edit); const ex = b.closest('.cartao').querySelector('.extra');
    ex.innerHTML = `<form class="pilha"><label class="campo">Nome e sobrenome<input type="text" name="nome" value="${esc(u.nome)}"></label>
      <label class="campo">Tipo<select name="papel"><option value="aluno" ${u.papel==='aluno'?'selected':''}>Aluno</option><option value="professor" ${u.papel==='professor'?'selected':''}>Professor</option></select></label>
      <div class="linha"><button class="btn btn-principal btn-peq">Salvar</button><button type="button" class="btn btn-linha btn-peq" data-x>Cancelar</button></div></form>`;
    ex.querySelector('[data-x]').addEventListener('click', () => ex.innerHTML = '');
    ex.querySelector('form').addEventListener('submit', async ev => { ev.preventDefault(); const f = ev.target;
      try { await rpc('escola_prof_salvar_usuario', {p_token: tk(), p_id: u.id, p_nome: f.nome.value, p_celular: u.celular, p_papel: f.papel.value, p_gerar_pin: false});
        painel = await rpc('escola_prof_painel', {p_token: tk()}); aviso('Dados salvos.'); profAlunos(); } catch(e){ aviso(e.message, true); } }); }));
}

function profPresenca(){
  const ab = abasModulo(painel.aulas, 'escola_mod_prof', l => `${l.filter(a=>a.liberada_em).length} de ${l.length} liberadas`);
  const libs = ab.lista; const salva = +store.get('escola_pres_aula'); const ultimaLib = libs.filter(a => a.liberada_em).pop();
  const sel = libs.some(a => a.id === salva) ? salva : (ultimaLib || libs[0]).id;
  const al = alunos().filter(u => u.ativo);
  const marcados = al.filter(u => (u.presencas || {})[sel] != null).length;
  tela(cabProf('Presença') + ab.html + `<label class="campo" for="pAula">Lição<select id="pAula">${libs.map(a => `<option value="${a.id}" ${a.id===sel?'selected':''}>${a.numero}. ${esc(a.titulo)}</option>`).join('')}</select></label>
    <p class="sub peq">Toque em “Presente” ou “Faltou” para cada aluno; salva na hora (${marcados} de ${al.length} marcados). Se a aula foi pelo <b>Ao vivo</b>, dá para lançar a presença de todos de uma vez no painel da aula ao vivo.</p>
    <div class="grade-prof">${al.length ? al.map(u => { const p = (u.presencas || {})[sel];
      return `<div class="cartao"><div class="linha entre"><h3>${esc(u.nome)}</h3><div class="pres-bot" data-al="${u.id}">
        <button class="btn btn-linha btn-peq ${p===true?'ativo-p':''}" data-v="1" aria-pressed="${p===true}">Presente</button>
        <button class="btn btn-linha btn-peq ${p===false?'ativo-f':''}" data-v="0" aria-pressed="${p===false}">Faltou</button></div></div></div>`; }).join('') : '<p>Nenhum aluno cadastrado ainda.</p>'}</div>`, 'presenca');
  ligarAbas('escola_mod_prof', profPresenca);
  document.getElementById('pAula').addEventListener('change', e => { store.set('escola_pres_aula', e.target.value); profPresenca(); });
  app.querySelectorAll('.pres-bot button').forEach(b => b.addEventListener('click', async () => {
    const box = b.parentElement, aid = box.dataset.al, val = b.dataset.v === '1';
    const u = alunos().find(x => x.id === aid); const atual = (u.presencas || {})[sel]; const novo = atual === val ? null : val;
    try { await rpc('escola_prof_presenca', {p_token: tk(), p_aluno: aid, p_aula: sel, p_presente: novo});
      u.presencas = u.presencas || {}; if (novo === null) delete u.presencas[sel]; else u.presencas[sel] = novo;
      box.querySelectorAll('button').forEach(x => { const on = novo !== null && (x.dataset.v === '1') === novo; x.classList.toggle('ativo-p', on && novo); x.classList.toggle('ativo-f', on && !novo); x.setAttribute('aria-pressed', on); });
    } catch(e){ aviso(e.message, true); } }));
}

function profNotas(){
  const ab = abasModulo(painel.aulas, 'escola_mod_prof', l => `${l.length} lições`);
  const aulas = ab.lista; const ids = new Set(aulas.map(a => String(a.id)));
  const linhas = alunos().map(u => { const ns = Object.entries(u.notas || {}).filter(([k]) => ids.has(k)).map(([,n]) => +n.nota);
    const pres = Object.entries(u.presencas || {}).filter(([k]) => ids.has(k)).map(([,v]) => v); const p = pres.filter(Boolean).length;
    return `<tr><td>${esc(u.nome)}</td>${aulas.map(a => { const n = (u.notas || {})[a.id]; const pr = (u.presencas || {})[a.id];
      return `<td class="n">${n ? nota(n.nota) + (n.corrigida ? '' : '*') : '–'}${pr === true ? ' ✓' : pr === false ? ' ✗' : ''}</td>`; }).join('')}
      <td class="n"><b>${nota(media(ns))}</b></td><td class="n">${p}/${pres.length}</td></tr>`; }).join('');
  tela(cabProf('Notas') + ab.html + `<h2>${esc(nomeModulo(ab.sel))}</h2><p class="sub peq">Nota de cada lição (0 a 10). * = ainda falta corrigir questão de escrever. ✓ presente · ✗ faltou. Arraste a tabela para o lado para ver todas as lições.</p>
    <div class="tabela-wrap"><table><thead><tr><th>Aluno</th>${aulas.map(a => `<th class="n" title="${esc(a.titulo)}">L${a.numero}</th>`).join('')}<th class="n">Média</th><th class="n">Presença</th></tr></thead><tbody>${linhas || `<tr><td colspan="${aulas.length+3}">Nenhum aluno ainda.</td></tr>`}</tbody></table></div>`, 'notas');
  ligarAbas('escola_mod_prof', profNotas);
}

async function telaEntregas(id){
  carregando();
  const d = await rpc('escola_prof_entregas', {p_token: tk(), p_aula: id});
  const qs = d.questoes, abertas = qs.filter(q => q.tipo === 'aberta');
  tela(`<a class="btn btn-linha btn-peq voltar" href="#/aulas">← Voltar às aulas</a>
    <div class="pilha" style="gap:6px"><span class="trilha">${esc(rotAula(d.aula))}</span><h1>Entregas</h1><p class="sub">${esc(d.aula.titulo)}${d.aula.prazo ? ` · prazo ${esc(dataHora(d.aula.prazo))}` : ''}</p></div>
    ${d.entregas.length ? '' : '<div class="cartao"><p>Nenhum aluno entregou ainda.</p></div>'}
    ${d.entregas.map(e => `<details class="cartao" ${e.corrigida ? '' : 'open'}><summary class="linha entre" style="cursor:pointer"><h3>${esc(e.aluno)}</h3>
        <span class="linha"><span class="chip ${e.corrigida ? 'chip-entregue' : 'chip-aberta'}">${e.corrigida ? 'Corrigida' : 'Para corrigir'}</span><b>Nota ${nota(e.nota)}</b></span></summary>
      <div class="pilha">${qs.map((q,i) => respostaHTML(q, i, e, true)).join('')}
      <form class="pilha cartao destaque" data-ent="${e.id}"><h3>Correção do professor</h3>
        ${abertas.length ? abertas.map(q => { const v = (e.pontos_prof || {})[q.id]; return `<label class="campo">Questão ${qs.indexOf(q)+1} (vale ${nota(q.pontos)})<select name="p${q.id}">
          ${[0,0.5,1].map(x => `<option value="${x}" ${+v===x?'selected':''}>${nota(x)} ponto</option>`).join('')}</select></label>`; }).join('') : '<p class="sub">Esta atividade não tem questões de escrever.</p>'}
        <label class="campo">Recado para o aluno (opcional)<textarea name="coment">${esc(e.comentario || '')}</textarea></label>
        <div class="linha"><button class="btn btn-verde">Salvar correção</button><button type="button" class="btn btn-perigo btn-peq" data-reabrir="${e.id}">Permitir que refaça</button></div></form></div></details>`).join('')}`, 'aulas');
  app.querySelectorAll('form[data-ent]').forEach(f => f.addEventListener('submit', async ev => { ev.preventDefault();
    const pts = {}; abertas.forEach(q => pts[q.id] = +f.querySelector(`[name=p${q.id}]`).value);
    try { await rpc('escola_prof_corrigir', {p_token: tk(), p_entrega: f.dataset.ent, p_pontos: pts, p_comentario: f.coment.value}); aviso('Correção salva.'); telaEntregas(id); } catch(e){ aviso(e.message, true); } }));
  app.querySelectorAll('[data-reabrir]').forEach(b => b.addEventListener('click', async () => {
    if (!b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Apagar a entrega e deixar refazer? Toque de novo'; return; }
    try { await rpc('escola_prof_reabrir', {p_token: tk(), p_entrega: b.dataset.reabrir}); aviso('Entrega apagada. O aluno pode refazer dentro do prazo.'); telaEntregas(id); } catch(e){ aviso(e.message, true); } }));
}

// ---------- professor: painel da aula ao vivo ----------
async function telaProfAoVivo(salaId){
  carregando();
  const [p, rel] = await Promise.all([rpc('escola_prof_painel', {p_token: tk()}), rpc('escola_prof_sala_relatorio', {p_token: tk(), p_sala: salaId})]);
  painel = p;
  const s = rel.sala; const aberta = !!s && !s.encerrada_em;
  aoVivoAgora = (rel.historico || []).some(h => !h.encerrada_em);
  const aulaDe = id => painel.aulas.find(a => a.id === id);
  const historico = (rel.historico || []).filter(h => !s || h.id !== s.id || !aberta);
  const histHTML = historico.length ? `<section class="cartao"><h2>Aulas ao vivo anteriores</h2><p class="sub peq">Toque numa aula para ver quem participou e lançar a presença.</p><div class="pessoas">${historico.map(h => `<a class="pessoa" style="text-decoration:none; color:inherit" href="#/aovivo/${h.id}"><span class="bola ${h.encerrada_em ? '' : 'on'}"></span><span><b>${esc(h.titulo)}</b><br><span class="sub peq">${dataCurta(h.aberta_em)} às ${hora(h.aberta_em)}${h.encerrada_em ? ` até ${hora(h.encerrada_em)}` : ' · aberta agora'}</span></span><span class="min">${h.pessoas} pessoa${h.pessoas==1?'':'s'}</span></a>`).join('')}</div></section>` : '';
  let corpo;
  if (aberta) {
    const a = aulaDe(s.aula_id);
    corpo = `<div class="duas-col"><div class="pilha"><section class="vivo"><span class="selo-vivo">AO VIVO DESDE ${hora(s.aberta_em)}</span><h2>${esc(s.titulo)}</h2>${a ? `<p class="peq">${esc(a.titulo)}</p>` : ''}
        <a class="btn btn-ouro" href="#/aovivo/entrar">🎥 Entrar na sala (câmera, microfone e tela)</a>
        <div class="linha"><a class="btn btn-verde btn-peq" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(convidarAoVivo())}">Avisar a turma no WhatsApp</a><button class="btn btn-linha btn-peq" id="copConv">Copiar aviso</button></div></section>
      <section class="cartao"><h2>Terminou a aula?</h2><p class="sub">Ao encerrar, a sala fecha para todos e você lança a presença de quem participou.</p>
        <button class="btn btn-vermelho" id="encerrar">Encerrar aula ao vivo</button></section></div>
      <section class="cartao"><div class="linha entre"><h2>Quem está na aula</h2><span class="sub peq">atualiza sozinho</span></div><div id="listaVivo" class="pessoas">${listaPessoas(rel.participantes)}</div></section></div>`;
  } else if (s && salaId) {
    const a = aulaDe(s.aula_id);
    corpo = `<a class="btn btn-linha btn-peq voltar" href="#/aovivo">← Voltar</a>
      <div class="duas-col"><section class="cartao destaque"><span class="trilha">${a ? esc(rotAula(a)) : 'Aula ao vivo'}</span><h2>${esc(s.titulo)}</h2><p class="sub">${dataCurta(s.aberta_em)}, das ${hora(s.aberta_em)} às ${hora(s.encerrada_em)}</p>
      ${a ? `<h3>Lançar presença</h3>
        <label class="campo" for="minMin">Dar presença para quem ficou pelo menos (minutos)<input type="number" id="minMin" min="0" max="300" value="30" inputmode="numeric" style="max-width:160px"></label>
        <label class="check"><input type="checkbox" id="marcarFaltas"><span>Marcar <b>falta</b> para os alunos que não entraram na aula</span></label>
        <button class="btn btn-verde" id="aplicar">Lançar presença na ${esc(rotAula(a))}</button>
        <p class="sub peq">Depois você ainda pode ajustar aluno por aluno na aba Presença.</p>` : '<p class="sub">Esta aula ao vivo não foi ligada a nenhuma lição; marque a presença na aba Presença.</p>'}</section>
      <section class="cartao"><h2>Quem participou</h2><div class="pessoas">${listaPessoas(rel.participantes)}</div></section></div>`;
  } else {
    const sugestao = (painel.aulas.filter(a => a.liberada_em).pop() || painel.aulas[0] || {}).id;
    corpo = `<div class="duas-col"><form class="cartao destaque" id="fAbrir"><h2>Começar uma aula ao vivo</h2>
        <p class="sub">Os alunos veem o aviso “Ao vivo” no site, entram com o nome deles e você vê quem entrou, a que horas e por quanto tempo ficou.</p>
        <label class="campo" for="vAula">De qual lição é esta aula?<select id="vAula">${porModulo(painel.aulas).map(([m, lista]) => `<optgroup label="${esc(nomeModulo(m))}">${lista.map(a => `<option value="${a.id}" ${a.id===sugestao?'selected':''}>${a.numero}. ${esc(a.titulo)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label class="campo" for="vLink">Link da sala de vídeo<input type="url" id="vLink" placeholder="https://suaigreja.daily.co/escola" value="${esc(store.get('escola_link_sala') || '')}" autocomplete="off" inputmode="url"><small>Cole o link da sua sala (veja abaixo como criar). Fica guardado para as próximas aulas.</small></label>
        <button class="btn btn-verde" type="submit">🔴 Abrir a sala ao vivo</button></form>
      <details class="cartao ajuda-geral" ${store.get('escola_link_sala') ? '' : 'open'}><summary>Como criar a sala de vídeo (só uma vez)</summary>
        <div class="ajuda"><b>Recomendado: Daily — grátis e abre dentro do site</b><ol>
          <li>Entre em <b>dashboard.daily.co</b> e crie uma conta gratuita.</li>
          <li>Vá em <b>Rooms</b> e toque em <b>Create room</b>. Dê um nome, por exemplo “escola”.</li>
          <li>Copie o link da sala (parecido com <b>https://suaigreja.daily.co/escola</b>) e cole no campo acima.</li></ol>
          <p class="peq" style="margin-top:8px">Câmera, microfone, chat e compartilhamento de tela abrem dentro do site, com o nome de cada aluno já preenchido. O plano grátis dá 10.000 minutos por mês (uma aula de 1h30 com 30 pessoas usa 2.700).</p></div>
        <div class="ajuda"><b>Também dá para usar Google Meet, Zoom ou Jitsi:</b> cole o link da reunião. O vídeo abre em outra aba e a presença continua sendo registrada enquanto o aluno deixa a página do site aberta.</div>
      </details></div>`;
  }
  tela(cabProf('Aula ao vivo') + corpo + histHTML, 'vivo');
  if (aberta) timers.push(setInterval(async () => {
    const el = document.getElementById('listaVivo'); if (!el) return;
    try { const r = await rpc('escola_prof_sala_relatorio', {p_token: tk(), p_sala: s.id}); el.innerHTML = listaPessoas(r.participantes); } catch(_) {} }, 15000));
  const fAbrir = document.getElementById('fAbrir');
  if (fAbrir) fAbrir.addEventListener('submit', async ev => { ev.preventDefault();
    const link = document.getElementById('vLink').value.trim();
    if (link && !/^https:\/\//i.test(link)) return aviso('O link precisa começar com https://', true);
    store.set('escola_link_sala', link || null);
    const aid = +document.getElementById('vAula').value; const a = aulaDe(aid);
    const b = fAbrir.querySelector('button'); b.disabled = true;
    try { await rpc('escola_prof_sala_abrir', {p_token: tk(), p_aula: aid, p_titulo: a ? `Aula ao vivo · ${rotAula(a)}` : 'Aula ao vivo', p_link: link});
      aviso('Sala aberta! Os alunos já veem o aviso “Ao vivo”.'); if (location.hash === '#/aovivo') rotear(); else location.hash = '#/aovivo'; } catch(e){ aviso(e.message, true); b.disabled = false; } });
  const bConv = document.getElementById('copConv'); if (bConv) bConv.addEventListener('click', () => copiar(convidarAoVivo()));
  const bEnc = document.getElementById('encerrar');
  if (bEnc) bEnc.addEventListener('click', async () => { if (!bEnc.dataset.conf) { bEnc.dataset.conf = '1'; bEnc.textContent = 'Toque de novo para encerrar'; return; }
    try { await rpc('escola_prof_sala_encerrar', {p_token: tk(), p_sala: s.id}); aviso('Aula encerrada. Agora lance a presença.'); location.hash = '#/aovivo/' + s.id; } catch(e){ aviso(e.message, true); } });
  const bApl = document.getElementById('aplicar');
  if (bApl) bApl.addEventListener('click', async () => { bApl.disabled = true;
    try { const r = await rpc('escola_prof_sala_presenca', {p_token: tk(), p_sala: s.id, p_min: +document.getElementById('minMin').value || 0, p_faltas: document.getElementById('marcarFaltas').checked});
      aviso(`Presença lançada: ${r.presentes} presente${r.presentes==1?'':'s'}${r.faltas ? ` e ${r.faltas} falta${r.faltas==1?'':'s'}` : ''}.`); telaProfAoVivo(s.id); }
    catch(e){ aviso(e.message, true); bApl.disabled = false; } });
}

rotear();
})();
