/**
 * Script para atualizar os links dos tópicos com base nos CSVs extraídos do Abacus.
 * 
 * Como usar:
 *   1. Coloque os CSVs em /tmp/topicos.csv e /tmp/materias.csv
 *   2. Rode: tsx prisma/migrate-topico-links.ts
 *   3. Ou execute online: PATCH /api/topicos/[id] { link }
 * 
 * Este script faz correspondência por NOME do tópico dentro de cada matéria,
 * já que os IDs do CSV (Abacus) são diferentes dos IDs do banco.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TopicoCSV {
  concluido: string;
  id: string;
  link: string;
  materiaId: string;
  nome: string;
}

interface MateriaCSV {
  id: string;
  nome: string;
  driveLink: string;
}

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(l => l.trim());
  const result: string[][] = [];
  for (const line of lines) {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { fields.push(current); current = ''; continue; }
      current += char;
    }
    fields.push(current);
    result.push(fields);
  }
  return result;
}

async function main() {
  console.log('🔍 Lendo CSVs...');

  // Ler dados dos arquivos
  const fs = await import('fs');

  // Ler CSV de tópicos
  const topicosRaw = fs.readFileSync('/tmp/topicos.csv', 'utf-8');
  const topicosLines = parseCSV(topicosRaw);
  const topicosCSV: TopicoCSV[] = [];
  for (let i = 1; i < topicosLines.length; i++) {
    const cols = topicosLines[i];
    if (cols.length >= 6) {
      topicosCSV.push({
        concluido: cols[0],
        id: cols[3],
        link: cols[4],
        materiaId: cols[5],
        nome: cols[6],
      });
    }
  }

  // Ler CSV de matérias
  const materiasRaw = fs.readFileSync('/tmp/materias.csv', 'utf-8');
  const materiasLines = parseCSV(materiasRaw);
  const materiasCSV: MateriaCSV[] = [];
  for (let i = 1; i < materiasLines.length; i++) {
    const cols = materiasLines[i];
    if (cols.length >= 5) {
      materiasCSV.push({
        id: cols[3],
        nome: cols[4],
        driveLink: cols[2],
      });
    }
  }

  console.log(`📊 ${materiasCSV.length} matérias, ${topicosCSV.length} tópicos encontrados nos CSVs`);

  // Filtrar apenas tópicos que têm link
  const topicosComLink = topicosCSV.filter(t => t.link && t.link.trim());
  console.log(`🔗 ${topicosComLink.length} tópicos com link para atualizar`);

  // Mapa: materiaId do CSV -> nome da matéria
  const materiaMap = new Map<string, string>();
  for (const m of materiasCSV) {
    materiaMap.set(m.id, m.nome);
  }

  // Buscar todas as matérias do banco
  const materiasDB = await prisma.materia.findMany({
    include: { topicos: true },
  });

  let atualizados = 0;
  let naoEncontrados = 0;

  for (const topicoCSV of topicosComLink) {
    const nomeMateria = materiaMap.get(topicoCSV.materiaId);
    if (!nomeMateria) {
      console.log(`⚠️ Matéria não encontrada para tópico "${topicoCSV.nome}"`);
      continue;
    }

    // Encontrar matéria no banco
    const materiaDB = materiasDB.find(m => m.nome === nomeMateria);
    if (!materiaDB) {
      console.log(`⚠️ Matéria "${nomeMateria}" não encontrada no banco`);
      naoEncontrados++;
      continue;
    }

    // Encontrar tópico no banco pelo nome (case insensitive)
    const topicoDB = materiaDB.topicos.find(
      t => t.nome.toLowerCase() === topicoCSV.nome.trim().toLowerCase()
    );

    if (!topicoDB) {
      // Tentar match parcial
      const partial = materiaDB.topicos.find(
        t => t.nome.toLowerCase().includes(topicoCSV.nome.trim().toLowerCase().slice(0, 10))
      );
      if (partial) {
        await prisma.topico.update({
          where: { id: partial.id },
          data: { link: topicoCSV.link.trim() },
        });
        console.log(`✅ ${nomeMateria} » "${topicoCSV.nome}" → link atualizado (partial match: "${partial.nome}")`);
        atualizados++;
        continue;
      }
      console.log(`❌ Tópico "${topicoCSV.nome}" não encontrado em "${nomeMateria}"`);
      naoEncontrados++;
      continue;
    }

    await prisma.topico.update({
      where: { id: topicoDB.id },
      data: { link: topicoCSV.link.trim() },
    });
    console.log(`✅ ${nomeMateria} » "${topicoCSV.nome}" → link atualizado`);
    atualizados++;
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ ${atualizados} tópicos atualizados`);
  console.log(`   ❌ ${naoEncontrados} não encontrados`);
  console.log(`   📝 Total com link no CSV: ${topicosComLink.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
