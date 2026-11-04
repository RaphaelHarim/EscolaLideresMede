# Gera sql/modulo3.json: aulas e atividades do Módulo 3 (Liderança e Aconselhamento).
# Uso: python3 sql/gerar_modulo3.py > sql/modulo3.json
# Importação (SQL Editor do Supabase): select public.escola_importar_aulas('<conteúdo do json>'::jsonb);
import json

MODULO = 3
ID_BASE = 19  # Módulo 1 = ids 1..10, Módulo 2 = 11..19, Módulo 3 = 20..27


def _op(opcoes):
    return {'opcoes': [{'id': chr(97 + i), 'texto': t} for i, t in enumerate(opcoes)]}


def U(enun, opcoes, certa, expl):
    return dict(tipo='unica', enunciado=enun, dados=_op(opcoes), gabarito=certa, explicacao=expl)


def M(enun, opcoes, certas, expl):
    return dict(tipo='multipla', enunciado=enun, dados=_op(opcoes), gabarito=certas, explicacao=expl)


def L(enun, partes, gab, expl):
    return dict(tipo='lacunas', enunciado=enun, dados={'partes': partes}, gabarito=gab, explicacao=expl)


def VF(enun, itens, expl):
    return dict(tipo='vf', enunciado=enun, dados={'itens': [{'id': chr(97 + i), 'texto': t} for i, (t, _) in enumerate(itens)]},
                gabarito={chr(97 + i): v for i, (_, v) in enumerate(itens)}, explicacao=expl)


def R(enun, itens, letras, gab, expl):
    return dict(tipo='relacionar', enunciado=enun,
                dados={'itens': [{'id': str(i + 1), 'texto': t} for i, t in enumerate(itens)],
                       'letras': [{'id': chr(97 + i), 'texto': t} for i, t in enumerate(letras)]},
                gabarito={str(i + 1): g for i, g in enumerate(gab)}, explicacao=expl)


def A(enun, ref):
    return dict(tipo='aberta', enunciado=enun, dados={}, gabarito={'referencia': ref}, explicacao=None)


def S(titulo, texto=None, itens=None, ref=None):
    s = {'titulo': titulo}
    if texto: s['texto'] = texto
    if itens: s['itens'] = itens
    if ref: s['ref'] = ref
    return s


AULAS = [
# 1 ---------------------------------------------------------------
dict(titulo='Princípios para uma liderança eficaz I',
 versiculo='Vós não me escolhestes a mim, mas eu vos escolhi a vós, e vos designei, para que vades e deis fruto, e o vosso fruto permaneça; a fim de que tudo quanto em meu nome pedirdes ao Pai ele vo-lo conceda.',
 versiculo_ref='João 15:16',
 conteudo=[
  S('Introdução', 'Princípios são as bases sobre as quais estabelecemos o nosso discipulado; se forem violadas, o discipulado rui. Discipular é também treinar: dar ao discípulo ferramentas para que seja como Jesus. Eficácia significa continuidade — algo que se mantém funcionando de maneira constante e no mesmo padrão. Discipulado é um processo de formação contínua, e o modelo mais eficaz é o de Jesus (Jo 15).'),
  S('1. O discipulado de Jesus (Jo 15:16)',
    itens=['Jesus é o nosso Discipulador supremo — “Não fostes vós que me escolhestes”: Deus nos escolheu em Sua soberania, não por nossos méritos; por isso não há lugar para competições e carnalidades',
           'Somos representantes do Supremo Discipulador — “e vos designei”: recebemos o Seu nome e a Sua autoridade; somos ministros de Deus',
           'Devemos frutificar — “para que vades e deis fruto”: somos ramos enxertados nEle e damos fruto segundo a semente recebida',
           'Temos a responsabilidade de consolidar nossos frutos — “e o vosso fruto permaneça”: como na agricultura, o fruto sem cuidado morre antes da maturação']),
  S('2. Conselhos básicos para o êxito da liderança',
    itens=['Ensine o caminho do trono aos discípulos: saiba qual é a base do seu discipulado — “Eu sou a videira verdadeira, e meu Pai é o lavrador” (Jo 15:1)',
           'Treine-os a permanecer no Pai: “Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto” (Jo 15:4-5) — ligados 24 horas em Deus, como o ramo que recebe a seiva da videira']),
  S('Conclusão', 'O segredo de uma liderança eficaz é estar ligado 24 horas na Videira Verdadeira, alimentado da genuína seiva de Deus. Assim frutificaremos no mesmo modelo que Jesus nos ensinou: Ele mesmo.'),
 ],
 questoes=[
  U('No discipulado, o que significa “eficácia”?',
    ['Fazer muitas coisas ao mesmo tempo.', 'Continuidade: algo que se mantém funcionando de maneira constante e no mesmo padrão.',
     'Ter resultados rápidos, mesmo que não durem.', 'Ter muitos discípulos, mesmo sem acompanhá-los.'], 'b', 'Introdução da lição.'),
  R('Relacione cada parte de João 15:16 com o ensino da lição.',
    ['“Não fostes vós que me escolhestes, mas eu vos escolhi”', '“…e vos designei…”', '“…para que vades e deis fruto…”', '“…e o vosso fruto permaneça.”'],
    ['Fomos chamados para frutificar', 'Jesus é o nosso Discipulador supremo', 'Devemos consolidar os nossos frutos', 'Somos representantes do Seu Reino'],
    ['b', 'd', 'a', 'c'], 'Itens 1.1 a 1.4.'),
  U('Por que não podemos abandonar uma vida depois de ganhá-la para Jesus?',
    ['Porque precisamos de números para a estatística.',
     'Porque, como na agricultura, o fruto sem os cuidados necessários morre antes do tempo; a vida precisa ser acompanhada e consolidada.',
     'Porque a pessoa precisa nos obedecer em tudo.', 'Não há problema em abandonar: o compromisso termina quando a pessoa aceita Jesus.'], 'b', 'Item 1.4.'),
  L('Complete (João 15:5):', ['“Eu sou a', None, ', vós as', None, '; quem está em mim, e eu nele, esse dá muito', None, '.”'],
    [['videira'], ['varas', 'ramos'], ['fruto', 'frutos']], 'Item 2.2.'),
  U('Qual é o segredo de uma liderança eficaz, segundo a conclusão da lição?',
    ['Ter muitos talentos naturais.', 'Estar ligado 24 horas na Videira Verdadeira, alimentado da seiva de Deus.',
     'Trabalhar sem descanso.', 'Ser mais forte que os outros líderes.'], 'b', 'Conclusão.'),
  A('Como você tem ajudado os seus discípulos a permanecer ligados a Jesus, a Videira Verdadeira?', 'Resposta pessoal (Jo 15:4-5).'),
 ]),
# 2 ---------------------------------------------------------------
dict(titulo='Princípios para uma liderança eficaz II',
 versiculo='Eu sou o Deus Todo-Poderoso; anda em minha presença e sê perfeito. E porei a minha aliança entre mim e ti, e te multiplicarei grandissimamente.',
 versiculo_ref='Gênesis 17:1-2',
 conteudo=[
  S('Introdução', 'Todo grande líder será provado por Deus — não para ficar derrotado, mas para ser aprovado. Uns serão provados na fé, outros no perdão ou na obediência. Líderes aprovados no fogo das provas tornam-se modelo para as futuras gerações.'),
  S('1. Abraão, um modelo de fé', 'Abraão procurou conhecer Aquele que o chamou. Como ele, o discípulo-líder terá a fé testada em três áreas:',
    ['Fé para negar-se a si mesmo — separar-se de tudo o que impede o propósito de Deus (Gn 12; Mc 10:29-30)',
     'Fé para confiar — confiar na Palavra quando parece impossível, obedecer e viver em retidão (Gn 15:1-6; 17:1-2)',
     'Fé para renunciar ao “Isaque” — o amor a Deus acima de tudo, e a esperança firmada em Deus e não nas bênçãos (Gn 22)']),
  S('2. José, um modelo de esperança', 'José ousou sonhar os sonhos de Deus (Gn 37). No Egito enfrentou três provas: a da pureza pessoal (Gn 39:7-12), a da oportunidade de vingança (Gn 42-45) e a de encarar a morte (Gn 39-41). Sua característica fundamental foi a HONRADEZ (dignidade, honestidade, integridade de caráter). Para chegar aonde chegou, José precisou:',
    ['Ter influência santa (Gn 39:2-3)', 'Resistir à tentação, com decisão firme de não pecar (Gn 39:7-12)', 'Ter graça divina: “o Senhor estava com José” (Gn 39:21)',
     'Observar as circunstâncias providenciais (Gn 40:7-8; Rm 8:28)', 'Honrar a Deus publicamente (Gn 41:16)', 'Ser fiel à visão (Gn 39:9; Pv 29:18)', 'Honrar os negócios (Gn 39:5-8)']),
  S('3. Moisés, um modelo de bom orientador', 'Em Moisés encontramos o princípio fundamental da liderança:',
    ['GUIAR — conduzir o povo com segurança ao destino', 'PROTEGER — evitar que os discípulos sofram danos físicos, morais, emocionais ou espirituais (Jo 10:4)',
     'ALIMENTAR — falar ao povo a partir do relacionamento com Deus, saciando a fome espiritual']),
  S('4. Débora, um modelo de inspiração', 'Profetisa e juíza, liderou Israel por 40 anos; sua eficácia vinha do compromisso espiritual e da intimidade com Deus (Jz 4-5). O discípulo-líder inspirador:',
    ['Convence os discípulos a irem além das suas próprias visões', 'Oferece um modelo de integridade e coragem', 'Dá autonomia e encoraja a individualidade',
     'Desenvolve a liderança dando tarefas com responsabilidade e deixando que as executem']),
  S('5. Davi, um modelo de líder ensinável', 'A cada erro, Davi se arrependia: aprendia com os erros, nunca se tornou idólatra e foi leal ao Senhor no testemunho e na adoração. Sabia ouvir até os críticos e seguia os profetas. Deus o chamou “homem segundo o meu coração” (At 13:22).'),
  S('Conclusão', 'Passar pela prova é para todos os que desejam ser modelo: entregar o “Isaque” como Abraão, deixar o conforto como José, perder títulos como Moisés, vencer limites como Débora e aprender com coração quebrantado como Davi. Quem é aprovado se torna modelo.'),
 ],
 questoes=[
  R('Relacione cada líder ao modelo que ele representa.', ['Abraão', 'José', 'Moisés', 'Débora', 'Davi'],
    ['Modelo de inspiração', 'Modelo de fé', 'Modelo de líder ensinável', 'Modelo de esperança', 'Modelo de bom orientador'],
    ['b', 'd', 'e', 'a', 'c'], 'Itens 1 a 5 da lição.'),
  M('Como Abraão, em quais áreas o discípulo-líder terá a sua fé testada?',
    ['Fé para negar-se a si mesmo', 'Fé para enriquecer', 'Fé para confiar', 'Fé para ser reconhecido', 'Fé para renunciar ao “Isaque”'],
    ['a', 'c', 'e'], 'Item 1: Gn 12, Gn 17 e Gn 22.'),
  M('Quais foram as três grandes provas de José no Egito?',
    ['A prova da pureza pessoal', 'A prova da fama', 'A prova da oportunidade de vingança', 'A prova de encarar a morte', 'A prova do poder político'],
    ['a', 'c', 'd'], 'Item 2.'),
  U('Qual foi a característica fundamental de José, que todo discipulador-líder deve buscar?',
    ['Honradez: dignidade, honestidade e integridade de caráter.', 'Esperteza para os negócios.', 'Força física.', 'Popularidade.'], 'a', 'Item 2.'),
  L('Complete, na ordem da lição:', ['Em Moisés encontramos o princípio fundamental da liderança:', None, ',', None, 'e', None, '.'],
    [['guiar'], ['proteger'], ['alimentar']], 'Item 3: guiar, proteger e alimentar.'),
  M('Quais são as características do discípulo-líder inspirador, como Débora?',
    ['Convence os discípulos a irem além das suas próprias visões', 'Faz tudo sozinho para não correr riscos',
     'Oferece um modelo de integridade e coragem', 'Dá autonomia e encoraja a individualidade', 'Lidera pelo medo',
     'Desenvolve a liderança dando tarefas com responsabilidade'], ['a', 'c', 'd', 'f'], 'Item 4.'),
  U('O que fez Deus classificar Davi como “homem segundo o meu coração”?',
    ['Nunca ter errado.', 'Um espírito pronto a aprender: arrependia-se, aprendia com os erros e era leal ao Senhor.',
     'Ter vencido Golias.', 'Ter sido rei por muitos anos.'], 'b', 'Item 5 (At 13:22).'),
  A('Qual destes modelos (Abraão, José, Moisés, Débora, Davi) mais fala com você neste momento? Por quê?', 'Resposta pessoal.'),
 ]),
# 3 ---------------------------------------------------------------
dict(titulo='Princípios para uma liderança eficaz III',
 versiculo='Porque para isto sois chamados; pois também Cristo padeceu por nós, deixando-nos o exemplo, para que sigais as suas pisadas.',
 versiculo_ref='1 Pedro 2:21',
 conteudo=[
  S('Introdução', 'O discípulo-líder deve crer naquilo que Deus lhe mostra e permanecer fiel e leal em todos os relacionamentos, principalmente com Deus. Nesta lição veremos as três últimas qualidades de um líder-modelo.'),
  S('1. João Batista, um modelo de intrepidez', 'Anunciou o Messias e chamou o povo ao arrependimento, desafiando a indiferença e o pecado (Lc 3:1-20). Em sua liderança:',
    ['Pregava o que não era popular, repreendendo os hipócritas (Lc 3:8)', 'Chamava para o altruísmo (Lc 3:10-11)', 'Denunciava a desonestidade (Lc 3:12-13)',
     'Exigia administração justa das autoridades (Lc 3:14)', 'Enfrentava a imoralidade na liderança (Mc 6:18)']),
  S('2. Apóstolo Paulo, um modelo de compromisso total', 'Totalmente comprometido com o chamado; uma das maiores qualidades do seu caráter: viveu o que escreveu (At 26:19). Quatro conceitos da sua liderança:',
    ['Comprometido com os objetivos e o espírito do seu chamado (Fp 3:7-8)', 'Traduzia os seus objetivos para a vida dos discípulos (2Tm 2:1-2)',
     'Paciente em toda dificuldade para alcançar o objetivo (2Co 4:8-11)', 'Aberto a mudanças culturais e sociais, sem violar a Palavra (1Co 9:19-22)']),
  S('3. Jesus, o modelo de serviço', 'A verdadeira grandeza na liderança é uma questão do coração: humildade, desejo de servir a Deus e aos homens e disposição de ser considerado o menor (Fp 2:3; Lc 22:24-30). Não está no cargo, no poder, nos diplomas, na fama ou no sucesso (Mt 18:3-4).',
    ['Ser grande na fé, no caráter santo, na sabedoria, no autodomínio, na perseverança e no amor (Gl 5:22-23)',
     'Amor sincero, lealdade e dedicação a Deus, sendo fiel onde Ele nos colocou (Rm 12:1-2)',
     'Frutificar na área em que Deus nos colocou, segundo os dons que Ele nos deu (1Co 12)']),
  S('Conclusão', 'É mergulhado em Deus que o líder-modelo nasce, arrebanhando multidões e formando em outros o caráter de Cristo.'),
 ],
 questoes=[
  R('Relacione cada líder ao modelo que ele representa.', ['João Batista', 'Apóstolo Paulo', 'Jesus'],
    ['Modelo de serviço', 'Modelo de intrepidez', 'Modelo de compromisso total'], ['b', 'c', 'a'], 'Itens 1, 2 e 3.'),
  M('Quais eram características da liderança de João Batista?',
    ['Pregar o que não é popular', 'Pregar só o que agrada às pessoas', 'Chamar para o altruísmo', 'Denunciar a desonestidade',
     'Evitar confrontos com autoridades', 'Enfrentar a imoralidade na liderança'], ['a', 'c', 'd', 'f'], 'Item 1.1 (Lc 3).'),
  U('Qual foi uma das maiores qualificações do caráter de Paulo?',
    ['Ser o mais culto dos apóstolos.', 'Ele viveu o que escreveu.', 'Nunca ter sido perseguido.', 'Ter muitos seguidores.'], 'b', 'Item 2 (At 26:19).'),
  M('Quais são os conceitos básicos da liderança de Paulo?',
    ['Comprometido com os objetivos do seu chamado', 'Mudava a doutrina para agradar ao público', 'Traduzia os seus objetivos para a vida dos discípulos',
     'Paciente em toda dificuldade', 'Desistia diante das perseguições', 'Aberto a mudanças culturais, sem violar a Palavra'],
    ['a', 'c', 'd', 'f'], 'Item 2.1.'),
  U('Onde está a verdadeira grandeza na liderança, segundo o modelo de Jesus?',
    ['No cargo e no poder.', 'Nos diplomas e na fama.',
     'No interior do coração: humildade, desejo de servir e disposição de ser considerado o menor no Reino.', 'Nas grandes realizações e no sucesso.'],
    'c', 'Item 3 (Fp 2:3; Mt 18:3-4).'),
  A('Em que área da sua vida você precisa crescer para liderar servindo, como Jesus?', 'Resposta pessoal.'),
 ]),
# 4 ---------------------------------------------------------------
dict(titulo='Aconselhamento no discipulado I',
 versiculo='E apiedai-vos de alguns, usando de discernimento; e salvai alguns com temor, arrebatando-os do fogo; aborrecendo até a roupa manchada da carne.',
 versiculo_ref='Judas 22-23',
 conteudo=[
  S('Introdução', 'Aconselhamento cristão deve ser feito por um cristão: só quem tem o Espírito de Deus pode ensinar os Seus conselhos, e só Deus transforma uma pessoa. Podemos defini-lo como uma assistência espiritual, física e psicológica destinada à solução de desvios de conduta (pecado) e de desajustamentos de motivação. O discipulador deve ficar atento à necessidade de o discípulo consultar um médico ou psicólogo: nem todos os problemas podem ser resolvidos pelo conselheiro.'),
  S('1. Aconselhamento cristão no discipulado', 'Não é um legalismo frio (“você está em pecado e vai para o inferno”), que supervaloriza a culpa e anula a graça; nem um determinismo (“a culpa não é sua, é do passado”), que nega a culpa real diante de Deus. Para ser cristão, o aconselhamento precisa:',
    ['Ser realizado por um cristão, que instrui pela Bíblia e não por convicções próprias', 'Ser centrado em Jesus Cristo, a alma e a solução do aconselhamento (Jo 14:6)',
     'Ser alicerçado na Igreja, onde Deus conforma as pessoas ao caráter de Cristo', 'Ser centrado na Escritura, guia máximo e base de todo aconselhamento']),
  S('2. Cuidados básicos no aconselhamento',
    itens=['Toda pessoa precisa de Deus: o pecado separou o homem de Deus (problema espiritual), dos seus iguais (sociológico), de si mesmo (psicológico) e da criação (ecológico) (Gn 1:26-27)',
           'Toda pessoa precisa ser remida e ter a alma restaurada pelo sacrifício de Cristo (Hb 9:14)',
           'Toda pessoa precisa da misericórdia de Deus: o conselheiro reflete o amor e a graça de Deus com EMPATIA — sentir o que sentiria se estivesse na situação do outro']),
  S('Conclusão', 'O líder-modelo, como conselheiro cristão, conduz os discípulos ao objetivo do Evangelho, “a salvação da alma” (1Pe 1:9), para que vivam restaurados e livres para ganhar, consolidar, discipular e enviar outras vidas.'),
 ],
 questoes=[
  U('Como a lição define o aconselhamento cristão?',
    ['Dar a sua opinião pessoal sobre a vida dos outros.',
     'Uma assistência espiritual, física e psicológica destinada à solução de desvios de conduta (pecado) e desajustamentos de motivação.',
     'Uma conversa para descobrir quem é o culpado.', 'Uma técnica de psicologia sem relação com a Bíblia.'], 'b', 'Introdução.'),
  M('Para ser chamado cristão, o aconselhamento no discipulado precisa ter quais características?',
    ['Ser realizado por um cristão', 'Ser centrado nas opiniões do conselheiro', 'Ser centrado em Jesus Cristo', 'Ser alicerçado na Igreja',
     'Ser centrado na Escritura Sagrada', 'Usar apenas técnicas humanas'], ['a', 'c', 'd', 'e'], 'Item 1.'),
  R('Relacione cada frase ao erro que ela representa.',
    ['“Você está em pecado e, se não mudar, vai queimar no inferno.”', '“A culpa não é sua; é das pessoas e das circunstâncias do passado.”'],
    ['Determinismo: nega a culpa real do ser humano diante de Deus', 'Legalismo frio: supervaloriza a culpa e anula a graça'],
    ['b', 'a'], 'Item 1.'),
  M('O pecado separou o ser humano de quê?', ['De Deus (problema espiritual)', 'Dos seus iguais (problema sociológico)', 'De si mesmo (problema psicológico)',
     'Da criação (problema ecológico)', 'De nada: o homem não tem conflitos'], ['a', 'b', 'c', 'd'], 'Item 2.1.'),
  U('O que é empatia?', ['Concordar com tudo o que o outro faz.', 'Sentir pena e não dizer nada.',
     'A tendência para sentir o que sentiria se estivesse na situação e nas circunstâncias vividas por outra pessoa.', 'Dar conselhos rápidos para resolver logo.'],
    'c', 'Item 2.3.'),
  VF('Marque V (verdadeiro) ou F (falso):',
     [('Nem todos os problemas podem ser resolvidos pelo conselheiro; às vezes é preciso encaminhar a um médico ou psicólogo.', 'V'),
      ('Somente Deus pode transformar uma pessoa, fazendo-a abandonar o pecado.', 'V'),
      ('Cristo é apenas um complemento no aconselhamento.', 'F'),
      ('A Bíblia é o guia máximo e a base de todo aconselhamento.', 'V')], 'Introdução e item 1.'),
  A('Por que o conselheiro precisa ter empatia? Dê um exemplo prático.', 'Para que o aconselhado sinta que alguém realmente se importa com ele, refletindo o amor e a misericórdia de Deus (item 2.3).'),
 ]),
# 5 ---------------------------------------------------------------
dict(titulo='Aconselhamento no discipulado II',
 versiculo='Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda a injustiça.',
 versiculo_ref='1 João 1:9',
 conteudo=[
  S('Introdução', 'Aconselhar é tarefa de todo aquele que ama a Jesus. Os discípulos inevitavelmente procurarão o seu líder em busca de orientação; por isso o discipulador precisa se preparar para aconselhar de forma clara e disciplinada. Jesus estava sempre ouvindo e orientando as pessoas: Ele é o Conselheiro maravilhoso (Is 61:1-4).', ref='Rm 15:1; Gl 5:22; Fp 4:6-11; Sl 23'),
  S('1. Por que aconselhar', 'Todo discipulador tem impresso em si o caráter de Cristo, que trouxe o homem ao Criador pelo amor e pela instrução — o bom conselho. Somos cooperadores de Deus; por isso orientar e aconselhar faz parte da rotina diária de um líder de êxito.'),
  S('2. Quando aconselhar', 'Aconselhar é um ministério: acontece quando alguém necessita de orientação e busca no líder a instrução que vem de Deus. Para dar certo, a pessoa precisa estar de coração aberto. O líder não dá ordens ao aconselhado: a obediência ao conselho deve ser espontânea e pessoal.'),
  S('3. Como aconselhar', 'Somos canal de Deus na vida das pessoas: conselheiros que apontam um bom caminho (Dt 30:19), e não pessoas que impõem conceitos e valores. Passos para um aconselhamento eficaz:',
    ['Viver o conselho dado (1Tm 4:6): o bom discipulador vive o que orienta', 'Estar sempre em submissão e dependência do Espírito Santo',
     'Ser compassivo, cordial e sincero: tudo em amor', 'Ser bom ouvinte e atencioso, mostrando-se alguém amoroso e confiável']),
 ],
 questoes=[
  U('Por que o discipulador deve aconselhar?',
    ['Para controlar a vida dos discípulos.',
     'Porque tem o caráter de Cristo e é cooperador de Deus: orientar e aconselhar faz parte da rotina diária de um líder de êxito.',
     'Porque é obrigado pela igreja.', 'Para mostrar que sabe mais que os outros.'], 'b', 'Item 1.'),
  U('Quando aconselhar?',
    ['Sempre que o líder quiser corrigir alguém em público.',
     'Quando alguém necessita de orientação e busca no líder a instrução que vem de Deus, de coração aberto.',
     'Apenas uma vez por ano.', 'Só quando o pastor mandar.'], 'b', 'Item 2.'),
  VF('Marque V (verdadeiro) ou F (falso):',
     [('O líder pode dar ordens ao aconselhado.', 'F'),
      ('A obediência e a aceitação do conselho devem ser espontâneas e pessoais.', 'V'),
      ('O conselheiro aponta um bom caminho, e não impõe conceitos e valores.', 'V'),
      ('Aconselhar é fácil e não exige preparo.', 'F')], 'Itens 2 e 3.'),
  M('Quais são os passos para um aconselhamento eficaz?',
    ['Viver o conselho dado', 'Falar mais do que ouvir', 'Depender do Espírito Santo', 'Ser compassivo, cordial e sincero',
     'Contar os problemas do discípulo para outras pessoas', 'Ser bom ouvinte e atencioso'], ['a', 'c', 'd', 'f'], 'Item 3.'),
  A('Por que “viver o conselho dado” é a chave para que o discípulo ouça o seu líder?',
    'Um bom discipulador vive o que orienta; assim o discípulo confia e recebe a orientação em amor (1Tm 4:6).'),
 ]),
# 6 ---------------------------------------------------------------
dict(titulo='Aconselhamento no discipulado III',
 versiculo='O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece… Tudo sofre, tudo crê, tudo espera, tudo suporta. O amor nunca falha.',
 versiculo_ref='1 Coríntios 13:4-8',
 conteudo=[
  S('Introdução', '“A escolha não é entre aconselhar ou não aconselhar, mas entre aconselhar de maneira disciplinada e hábil ou de modo indisciplinado e inábil” (Wayne Oates). Os discípulos buscarão primeiro o seu líder de célula. Para o líder, a eficiência está em conhecer o problema e saber fazer o encaminhamento para um cuidado mais objetivo e eficaz.'),
  S('1. Desafios quanto à alma do discípulo (Sl 42:11)',
    itens=['ANSIEDADE — sentimento de apreensão, preocupação, angústia ou medo, com intenso despertar físico. É contagiosa: o conselheiro deve vigiar os próprios sentimentos e saber quando encaminhar a um profissional. Jesus nos ensina a não andar ansiosos (Mt 6:25-34). A ansiedade nos imobiliza; o interesse genuíno nos leva à ação (At 20:23-24)',
           'SOLIDÃO — consciência de que falta contato significativo com outros; sentimento de vazio. A base da solução é uma relação crescente com Deus e com as pessoas. A solidão desencoraja, tira os olhos de Deus e leva à autocomiseração, como em Elias (1Rs 19:10)',
           'DEPRESSÃO — tristeza, apatia, perda de energia, desesperança, perda de interesse. É complexa: além da ajuda espiritual, é aconselhável buscar ajuda médica e psicológica. Muitas vezes vem após grandes realizações (1Rs 19:3). Um antídoto é meditar na bondade de Deus (Sl 42:5-6)']),
  S('2. Desafios quanto à sexualidade do discípulo (1Co 6:19)', 'A lição ensina que a vida sentimental e sexual do cristão deve ser vivida em pureza e santidade, segundo a autoridade das Escrituras:',
    ['O sexo foi criado por Deus como algo bom (Gn 1:31), para ser vivido dentro do casamento (Pv 5:15-20)',
     'Castidade é a abstenção de atividade sexual fora do casamento; pureza é estar livre de tudo o que contamina (Sl 18:24-26)',
     'Problemas comuns no casamento: ciúmes (Nm 5:14), adultério (Rm 7:3) e divórcio (Mt 19:3-9) — exigem ajuda qualificada',
     'Homossexualidade: a lição ensina que a prática é contrária à Palavra (Lv 18:22; 1Co 6:9-11), e que o aconselhamento começa pelas atitudes do próprio líder: sem repulsa, zombaria ou condenação, e com a compaixão de Jesus; o perdão, a graça e a misericórdia estão sempre disponíveis']),
  S('Conclusão', 'A eficiência do discipulador não está em resolver tudo sozinho, mas em identificar com precisão os desafios e, com amor e zelo, fazer bons encaminhamentos. Nunca deixe faltar amor, interesse, intercessão e companheirismo durante todo o processo.'),
 ],
 questoes=[
  U('Para o líder de célula, em que está focada a eficiência no aconselhamento?',
    ['Em resolver sozinho todos os problemas dos discípulos.', 'Em conhecer o problema e saber fazer o encaminhamento para um cuidado mais objetivo e eficaz.',
     'Em evitar conversar sobre problemas.', 'Em encaminhar todos ao pastor sem ouvir ninguém.'], 'b', 'Introdução e conclusão.'),
  R('Relacione cada descrição ao desafio da alma.',
    ['Sentimento de apreensão, preocupação, angústia ou medo, com intenso despertar físico.', 'Consciência de que falta contato significativo com os outros; sentimento de vazio.',
     'Tristeza, apatia, perda de energia, desesperança e perda de interesse pelas atividades.'],
    ['Solidão', 'Depressão', 'Ansiedade'], ['c', 'a', 'b'], 'Item 1.'),
  U('Qual a diferença entre a ansiedade e o interesse genuíno?',
    ['Não há diferença.', 'A ansiedade nos imobiliza; o interesse genuíno nos leva à ação.', 'A ansiedade nos leva à ação; o interesse genuíno nos paralisa.',
     'O interesse genuíno é pecado.'], 'b', 'Item 1.1 (At 20:23-24).'),
  M('Diante de ansiedade e depressão, o que a lição recomenda ao discipulador?',
    ['Encaminhar a ajuda médica ou psicológica quando necessário', 'Dizer que é só falta de fé e não buscar ajuda',
     'Estar atento aos próprios sentimentos', 'Ajudar o discípulo a meditar na bondade de Deus e em Suas promessas', 'Ignorar o problema até passar'],
    ['a', 'c', 'd'], 'Itens 1.1 e 1.3.'),
  U('Segundo a lição, o que significa castidade?',
    ['Nunca se casar.', 'Abstenção de atividade sexual fora do casamento.', 'Não ter amigos do sexo oposto.', 'Viver isolado da sociedade.'], 'b', 'Item 2.1.'),
  U('Segundo a lição, por onde começa o aconselhamento nas questões de sexualidade?',
    ['Pela condenação pública da pessoa.', 'Pelas atitudes do próprio líder: sem repulsa, zombaria ou condenação, com a compaixão de Jesus.',
     'Por afastar a pessoa da célula.', 'Por evitar o assunto.'], 'b', 'Item 2.2.'),
  A('Como o amor descrito em 1 Coríntios 13 deve aparecer quando você aconselha um discípulo?', 'Resposta pessoal: paciência, bondade, não se irritar, crer, esperar e suportar; amor, interesse, intercessão e companheirismo (conclusão).'),
 ]),
# 7 ---------------------------------------------------------------
dict(titulo='O líder e a célula principal: a família',
 versiculo='Porém eu e a minha casa serviremos ao Senhor.', versiculo_ref='Josué 24:15',
 conteudo=[
  S('Introdução', 'Um lar organizado é o sonho de Deus, que estabeleceu ordem para que todas as famílias da terra fossem abençoadas (Gn 12:3). Cada membro da família tem um papel vital para o bem de todos. Urge que se restaure o sacerdócio no lar.'),
  S('1. Responsabilidades do sacerdote, o marido', 'O lar precisa de ordem; o sacerdote reconhece que a sua autoridade depende da soberania de Deus. Seu modelo é Jesus com a Igreja:',
    ['Exercer a sua liderança com amor, nunca de forma autoritária, ouvindo e respeitando a esposa (Ef 5:23)', 'Amar a esposa como Cristo amou a Igreja (Ef 5:25-28)',
     'Prover o pão e também nutrir emocional e espiritualmente a casa (Gn 3:19; 1Tm 5:8)', 'Proteger, tratando a esposa como companheira e não como subordinada (1Pe 3:7)',
     'Ser exemplo do caráter de Deus: líder espiritual do lar, aberto à reconciliação']),
  S('2. Responsabilidades da adjuntora, a esposa', 'Como a Igreja em relação a Cristo (Pv 31):',
    ['Ser auxiliadora idônea — “auxiliadora” (Gn 2:18) significa “força” ou “poder”: sócia nos projetos', 'Ser apoiadora — submissão não é anulação nem deixar de ter opinião (Ef 5:22-24, 33)',
     'Administrar o lar com sabedoria e oração (Pv 31:13-27)', 'Ser companheira que ama', 'Ser reflexo do amor de Deus, ministrando cura com atitudes e palavras (1Jo 4:19-21)']),
  S('3. Responsabilidades dos filhos', 'Os filhos são herança do Senhor (Sl 127:3). Devem:',
    ['Obedecer aos pais (Cl 3:20)', 'Honrar os pais — o primeiro mandamento com promessa: “para que te vá bem e vivas muito tempo sobre a terra” (Ef 6:2-3)',
     'Alegrar os pais, agindo com sabedoria (Pv 15:20)', 'Respeitar os mais velhos (Pv 23:22)']),
  S('4. Responsabilidades dos pais', 'Ensinar “a criança no caminho em que deve andar” (Pv 22:6; Dt 6:7-9):',
    ['Amar o filho — inclusive corrigindo-o (Pv 3:12)', 'Ensinar-lhe a respeito de Deus (Dt 11:19)', 'Encorajá-lo a ser um líder, como Paulo com Timóteo (2Tm 2:1)',
     'Ser modelo a ser seguido e imitado (Ef 5:1)']),
  S('Conclusão', 'A família é a célula-mãe da sociedade. A família curada é um pedacinho do céu na terra, com testemunho e liderança modelo.'),
 ],
 questoes=[
  U('Por que o lar precisa de um sacerdote?',
    ['Para que alguém mande em todos.', 'Porque o lar precisa de ordem, e o sacerdote reconhece que a sua autoridade depende da soberania de Deus.',
     'Porque a esposa não pode orar.', 'Para substituir o pastor da igreja.'], 'b', 'Item 1.'),
  M('Quais são responsabilidades do marido, segundo a lição?',
    ['Exercer a liderança com amor', 'Mandar de forma autoritária', 'Amar a esposa como Cristo amou a Igreja', 'Prover o pão e nutrir emocional e espiritualmente a casa',
     'Proteger a esposa, tratando-a como companheira', 'Tratar a esposa como subordinada'], ['a', 'c', 'd', 'e'], 'Item 1.'),
  M('Quais são responsabilidades da esposa, segundo a lição?',
    ['Ser auxiliadora idônea', 'Anular-se e não ter opinião', 'Ser apoiadora', 'Administrar o lar', 'Ser reflexo do amor de Deus'],
    ['a', 'c', 'd', 'e'], 'Item 2.'),
  L('Complete:', ['A palavra “auxiliadora”, em Gênesis 2:18, significa', None, 'ou', None, '.'], [['força', 'forca'], ['poder']], 'Item 2.1.'),
  M('Quais são responsabilidades dos filhos?', ['Obedecer aos pais', 'Fazer tudo o que quiserem', 'Honrar os pais', 'Alegrar os pais', 'Respeitar os mais velhos'],
    ['a', 'c', 'd', 'e'], 'Item 3.'),
  U('Qual é o primeiro mandamento com promessa?',
    ['Não matarás.', 'Honra a teu pai e a tua mãe, para que te vá bem e vivas muito tempo sobre a terra.', 'Lembra-te do dia do sábado.', 'Não furtarás.'],
    'b', 'Item 3.2 (Ef 6:2-3).'),
  M('Quais são responsabilidades dos pais?', ['Amar o filho, inclusive corrigindo-o', 'Deixar o filho fazer tudo (liberalismo)', 'Ensinar-lhe a respeito de Deus',
     'Encorajá-lo a ser um líder', 'Ser modelo a ser seguido e imitado'], ['a', 'c', 'd', 'e'], 'Item 4.'),
  A('O que você pode fazer nesta semana para fortalecer a sua “célula principal”, a sua família?', 'Resposta pessoal.'),
 ]),
# 8 ---------------------------------------------------------------
dict(titulo='O testemunho do líder',
 versiculo='Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim; e a vida que agora vivo na carne, vivo-a na fé do Filho de Deus, o qual me amou, e se entregou a si mesmo por mim.',
 versiculo_ref='Gálatas 2:20',
 conteudo=[
  S('Introdução', 'O que quer dizer testemunhar, e de quem estamos testemunhando? Testemunho é, por definição, a declaração de alguém que viu um fato, dando autenticidade a uma alegação — como a testemunha que confirma o que viu. Somos testemunhas do que Jesus fez na nossa vida: o testemunho é dado por alguém que conhece Jesus e sabe como Ele age.'),
  S('Para a aula', 'O restante desta lição será ministrado pelo professor na aula.'),
 ],
 questoes=[
  U('O que é testemunho, por definição?',
    ['Uma opinião pessoal sobre qualquer assunto.', 'A declaração de alguém que viu um fato, dando autenticidade a uma alegação.', 'Uma história inventada para animar as pessoas.', 'Um sermão longo.'],
    'b', 'Introdução.'),
  U('Somos testemunhas de quê?', ['Do que os outros contam.', 'Do que Jesus fez na nossa vida.', 'Das nossas próprias conquistas.', 'Das notícias do mundo.'], 'b', 'Introdução.'),
  L('Complete (Gálatas 2:20):', ['“Já estou crucificado com Cristo; e vivo, não mais eu, mas', None, 'vive em mim.”'], [['Cristo', 'Jesus']], 'Versículo-chave.'),
  A('Escreva um breve testemunho do que Jesus fez na sua vida.', 'Resposta pessoal.'),
 ]),
]

out = []
for n, a in enumerate(AULAS, 1):
    for q in a['questoes']:
        if q['tipo'] in ('unica', 'multipla'):
            ids = [x['id'] for x in q['dados']['opcoes']]
            for g in ([q['gabarito']] if q['tipo'] == 'unica' else q['gabarito']):
                assert g in ids, q['enunciado']
        if q['tipo'] == 'lacunas':
            assert q['dados']['partes'].count(None) == len(q['gabarito']), q['enunciado']
        if q['tipo'] == 'relacionar':
            assert len(q['gabarito']) == len(q['dados']['itens'])
    out.append(dict(id=ID_BASE + n, modulo=MODULO, numero=n, **a))
print(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
