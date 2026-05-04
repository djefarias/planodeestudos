const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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

  const materiasData = [
    { nome: 'Língua Portuguesa', peso: 2, questoes: 12, cor: '#60B5FF',
      topicos: ['Interpretação de textos', 'Morfologia', 'Sintaxe', 'Ortografia', 'Literatura brasileira', 'Concordância verbal e nominal'] },
    { nome: 'Matemática', peso: 2, questoes: 12, cor: '#FF9149',
      topicos: ['Raciocínio lógico', 'Conjuntos numéricos', 'Geometria plana', 'Estatística básica', 'Probabilidade', 'Funções'] },
    { nome: 'Direito Administrativo', peso: 3, questoes: 15, cor: '#FF9898',
      topicos: ['Princípios administrativos', 'Poderes administrativos', 'Atos administrativos', 'Licitações', 'Servidores públicos'] },
    { nome: 'Direito Constitucional', peso: 3, questoes: 15, cor: '#FF90BB',
      topicos: ['Princípios fundamentais', 'Direitos e garantias fundamentais', 'Organização do Estado', 'Poder Legislativo', 'Poder Executivo', 'Poder Judiciário'] },
    { nome: 'Raciocínio Lógico', peso: 1, questoes: 5, cor: '#FF6363',
      topicos: ['Estruturas lógicas', 'Diagramas', 'Sequências', 'Argumentação'] },
    { nome: 'Informática', peso: 1, questoes: 8, cor: '#A19AD3',
      topicos: ['Sistemas operacionais', 'Pacote Office', 'Internet e redes', 'Segurança da informação'] },
    { nome: 'Legislação Específica', peso: 2, questoes: 10, cor: '#80D8C3',
      topicos: ['Lei Orgânica', 'Estatuto do Servidor', 'Regimento Interno'] },
    { nome: 'Redação', peso: 2, questoes: 15, cor: '#72BF78',
      topicos: ['Estrutura dissertativa', 'Coesão e coerência', 'Argumentação', 'Propostas de intervenção'] },
  ];

  for (const md of materiasData) {
    const materia = await prisma.materia.create({
      data: {
        nome: md.nome,
        peso: md.peso,
        questoes: md.questoes,
        cor: md.cor,
        userId: user.id,
        topicos: { create: md.topicos.map(nome => ({ nome })) },
      },
    });
    console.log(`✅ Matéria: ${materia.nome}`);
  }

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
