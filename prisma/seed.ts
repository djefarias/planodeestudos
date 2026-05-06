import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const hashedPassword = await bcrypt.hash('pcparana2026', 12);
  const user = await prisma.user.upsert({
    where: { email: 'dje.reis.17@gmail.com' },
    update: {},
    create: {
      email: 'dje.reis.17@gmail.com',
      name: 'Jefferson',
      hashedPassword,
    },
  });
  console.log(`✅ Usuário: ${user.email}`);

  // Clean existing data
  await prisma.materialEstudo.deleteMany({ where: { userId: user.id } });
  await prisma.teste.deleteMany({ where: { userId: user.id } });
  await prisma.sessao.deleteMany({ where: { userId: user.id } });
  await prisma.topico.deleteMany({ where: { materia: { userId: user.id } } });
  await prisma.materia.deleteMany({ where: { userId: user.id } });

  // ========== MATÉRIAS (extraídas do Abacus) ==========
  const materiasData: Array<{
    nome: string;
    peso: number;
    questoes: number;
    cor: string;
    driveLink: string | null;
    topicos: string[];
  }> = [
    {
      nome: 'Português',
      peso: 3,
      questoes: 15,
      cor: '#60B5FF',
      driveLink: 'https://drive.google.com/drive/folders/19JwAb-FWecOPjaWpC7RWFXHMBpwbypp1?usp=sharing',
      topicos: ['Interpretação de textos', 'Morfologia', 'Sintaxe', 'Ortografia', 'Literatura brasileira', 'Concordância verbal e nominal'],
    },
    {
      nome: 'Raciocínio Lógico',
      peso: 2,
      questoes: 10,
      cor: '#FF9149',
      driveLink: 'https://drive.google.com/drive/folders/1oqqgx4lkWLbAWwuoUAuhxq-_3NAJ5niV?usp=sharing',
      topicos: ['Estruturas lógicas', 'Diagramas', 'Sequências', 'Argumentação'],
    },
    {
      nome: 'Informática',
      peso: 2,
      questoes: 10,
      cor: '#FF9898',
      driveLink: 'https://drive.google.com/drive/folders/1Xie4axrwjx9PadXG3UISpPgApAG-LYfp?usp=sharing',
      topicos: ['Sistemas operacionais', 'Pacote Office', 'Internet e redes', 'Segurança da informação'],
    },
    {
      nome: 'Direito Constitucional',
      peso: 3,
      questoes: 10,
      cor: '#FF90BB',
      driveLink: 'https://drive.google.com/drive/folders/1h52HXfxrLMIoin-HboHz_92AcaksBqyt?usp=sharing',
      topicos: ['Princípios fundamentais', 'Direitos e garantias fundamentais', 'Organização do Estado', 'Poder Legislativo', 'Poder Executivo', 'Poder Judiciário'],
    },
    {
      nome: 'Direito Administrativo',
      peso: 3,
      questoes: 10,
      cor: '#FF6363',
      driveLink: 'https://drive.google.com/drive/folders/1UekTcMOfJrDoCjWYcFe7RbQZJFw31vQ7?usp=sharing',
      topicos: ['Princípios administrativos', 'Poderes administrativos', 'Atos administrativos', 'Licitações', 'Servidores públicos'],
    },
    {
      nome: 'Direito Penal',
      peso: 2,
      questoes: 8,
      cor: '#80D8C3',
      driveLink: 'https://drive.google.com/drive/folders/1WnAES4ZFEPR-DLQAyEtlJC1S9vsbsrpJ?usp=sharing',
      topicos: ['Teoria geral do crime', 'Crimes contra a pessoa', 'Crimes contra o patrimônio', 'Crimes contra a administração'],
    },
    {
      nome: 'Processo Penal',
      peso: 2,
      questoes: 8,
      cor: '#A19AD3',
      driveLink: 'https://drive.google.com/drive/folders/1ugQk-77xbuVIUJe-hFK6TlHlBEOEqQ_I?usp=sharing',
      topicos: ['Inquérito policial', 'Ação penal', 'Provas', 'Recursos'],
    },
    {
      nome: 'Legislação Penal',
      peso: 2,
      questoes: 8,
      cor: '#72BF78',
      driveLink: 'https://drive.google.com/drive/folders/1YSnqYI2C78QIHw4zr3K02wVLQP4YnL0Y?usp=sharing',
      topicos: ['Lei de execução penal', 'Lei de drogas', 'Juizados especiais criminais'],
    },
    {
      nome: 'Direito Civil',
      peso: 2,
      questoes: 8,
      cor: '#80D8C3',
      driveLink: null,
      topicos: ['Parte geral', 'Obrigações', 'Contratos', 'Responsabilidade civil'],
    },
    {
      nome: 'Regimento Interno',
      peso: 2,
      questoes: 10,
      cor: '#72BF78',
      driveLink: null,
      topicos: ['Estrutura do tribunal', 'Competências', 'Processo e julgamento'],
    },
    {
      nome: 'Atualidades',
      peso: 1,
      questoes: 5,
      cor: '#F4A261',
      driveLink: null,
      topicos: ['Política nacional', 'Economia', 'Sociedade', 'Meio ambiente'],
    },
    {
      nome: 'Redação / Discursiva',
      peso: 3,
      questoes: 2,
      cor: '#E76F51',
      driveLink: null,
      topicos: ['Estrutura dissertativa', 'Coesão e coerência', 'Argumentação', 'Propostas de intervenção'],
    },
    {
      nome: 'Inglês',
      peso: 1,
      questoes: 5,
      cor: '#2A9D8F',
      driveLink: null,
      topicos: ['Interpretação de textos', 'Vocabulário', 'Estruturas gramaticais'],
    },
    {
      nome: 'Específica',
      peso: 3,
      questoes: 15,
      cor: '#264653',
      driveLink: null,
      topicos: ['Conteúdo específico do cargo', 'Legislação pertinente'],
    },
    {
      nome: 'MAPAS MENTAIS',
      peso: 1,
      questoes: 10,
      cor: '#264653',
      driveLink: 'https://drive.google.com/drive/folders/1UWWqRffzWwQfXmLLyhXAXqpPx69MNMtG?usp=sharing',
      topicos: ['Revisão geral', 'Mapas mentais por matéria'],
    },
  ];

  const materiasCriadas = [];
  for (const md of materiasData) {
    const materia = await prisma.materia.create({
      data: {
        nome: md.nome,
        peso: md.peso,
        questoes: md.questoes,
        cor: md.cor,
        driveLink: md.driveLink,
        userId: user.id,
        topicos: { create: md.topicos.map(nome => ({ nome })) },
      },
    });
    materiasCriadas.push(materia);
    console.log(`✅ Matéria: ${materia.nome}${md.driveLink ? ' (com link do Drive)' : ''}`);
  }

  // ========== MATERIAIS DE ESTUDO (extraídos do Abacus) ==========
  const materiaisData: Array<{ nome: string; link: string; categoria: string }> = [
    { nome: 'Caderno de Testes PC-PR', link: 'https://drive.google.com/file/d/1WpZF-LaZ84N4l6Btet2XftAQyNzPjTc_/view?usp=sharing', categoria: 'testes' },
    { nome: 'Ebook 1000Q - PCPR', link: 'https://drive.google.com/file/d/1kIYoFlqdAeyO-maFrbaZ6Cm-3SwSl_Ww/view?usp=sharing', categoria: 'testes' },
    { nome: 'Preparatório Policial Federal', link: 'https://drive.google.com/file/d/1kIYoFlqdAeyO-maFrbaZ6Cm-3SwSl_Ww/view?usp=sharing', categoria: 'testes' },
    { nome: 'Prep PRF', link: 'https://drive.google.com/file/d/19bSvlnKpv-5CqCOm5uDr2jjXNnsDUfMq/view?usp=sharing', categoria: 'testes' },
    { nome: 'Prep PRF - 2', link: 'https://drive.google.com/file/d/1tU5FtYCes2yJ6-Pt8kIyoTyxCzlVm-BE/view?usp=sharing', categoria: 'testes' },
    { nome: 'Gabarito PRF', link: 'https://drive.google.com/file/d/1CDqeFnDF7cWHP4cxIvxqXXjKuNSr676y/view?usp=sharing', categoria: 'testes' },
    { nome: 'DIREITO CONSTITUCIONAL', materiaNome: 'Direito Constitucional', link: 'https://drive.google.com/file/d/17pyRrpAyL4fvspZSFsVr1ohEQAzcEAwS/view?usp=drive_link', categoria: 'testes' },
    { nome: 'DIREITOS HUMANOS', materiaNome: 'Direito Constitucional', link: 'https://drive.google.com/file/d/1fw0JVApMDzDvmUfC7pEd02sxez0JyP84/view?usp=drive_link', categoria: 'testes' },
    { nome: 'INFORMÁTICA', materiaNome: 'Informática', link: 'https://drive.google.com/file/d/1MT2R4ZuNbk79G4X1P_rHWV6Oa5_OZEsp/view?usp=drive_link', categoria: 'testes' },
    { nome: 'LEGISLAÇÃO PRF', materiaNome: 'Legislação Penal', link: 'https://drive.google.com/file/d/1vNHq_f6oI39ISV9gBYrf4pnAl3u_qlCi/view?usp=drive_link', categoria: 'testes' },
    { nome: 'PROVA PF-AGENTE - 600 QUESTÕES', link: 'https://drive.google.com/file/d/10qZOP8K3q7msefa4ZvyZLcVkOn9ESK70/view?usp=drive_link', categoria: 'testes' },
    { nome: 'PORTUGUÊS QUESTÕES', materiaNome: 'Português', link: 'https://drive.google.com/file/d/12kqoLobgwtDuqvk_MRdyAOvhyJSGlGna/view?usp=drive_link', categoria: 'testes' },
    { nome: 'Dicas de Estudo - Guia', link: 'https://drive.google.com/drive/folders/10PtGyzG4pJxJqo5JZU2BPH_2AJZhmxiw?usp=sharing', categoria: 'dicas' },
    { nome: 'Análise Estratégica da Banca', link: 'https://drive.google.com/drive/folders/1K1vmaBLkTcmzUIkZv1lY4TSHXU-plAYm?usp=sharing', categoria: 'estrategia' },
    { nome: 'Plano Personalizado de Estudos', link: 'https://drive.google.com/drive/folders/1ITMPLHZgg9qKaCRe3q97iS5vhl8BJ9FS?usp=sharing', categoria: 'plano' },
    { nome: 'Mapas Mentais', link: 'https://drive.google.com/drive/folders/1UWWqRffzWwQfXmLLyhXAXqpPx69MNMtG?usp=sharing', categoria: 'geral' },
  ];

    const seen = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type MaterialInput = { nome: string; link: string; categoria: string; materiaNome?: string };
  const materiaisUnicos: MaterialInput[] = materiaisData.filter((m: MaterialInput) => {
    const key = `${m.nome}|${m.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Material type with optional materiaNome
    const materiaisUnicosTyped = materiaisUnicos;
  
  for (const md of materiaisUnicos) {
    const materiaMatch = md.materiaNome
      ? materiasCriadas.find(m => m.nome === md.materiaNome)
      : null;

    await prisma.materialEstudo.create({
      data: {
        nome: md.nome,
        link: md.link,
        categoria: md.categoria,
        materiaId: materiaMatch?.id ?? null,
        userId: user.id,
      },
    });
    console.log(`📚 Material: ${md.nome} (${md.categoria})${materiaMatch ? ` → ${materiaMatch.nome}` : ''}`);
  }

  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Email: dje.reis.17@gmail.com');
  console.log('   Senha: pcparana2026');
  console.log(`\n📊 Total: ${materiasCriadas.length} matérias, ${materiaisUnicos.length} materiais`);
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
