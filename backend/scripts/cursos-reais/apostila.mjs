// Gera a apostila em PDF de um módulo com o jsPDF, no padrão visual do
// CursoLab (azul #2563eb, azul-marinho #102a43, quinas retas).
//
// O conteúdo vem em blocos:
//   { h: 'Título da seção' }
//   { p: 'Parágrafo com **negrito** opcional.' }
//   { ul: ['Item com **termo**: explicação', ...] }
//   { code: 'linhas\nde código' }
//   { tip: 'Texto do quadro de destaque', label: 'Para praticar' }
import { jsPDF } from 'jspdf';

const colors = {
  ink: [15, 31, 51],
  navy: [16, 42, 67],
  blue: [37, 99, 235],
  blueSoft: [239, 245, 255],
  muted: [91, 107, 128],
  line: [227, 233, 241],
  bg: [246, 248, 251],
};

const page = { width: 210, height: 297, margin: 20, bottom: 280 };
const contentWidth = page.width - page.margin * 2;
const mmPerPt = 0.3528;

// As fontes padrão do PDF só cobrem Latin-1. Caracteres tipográficos fora dele
// são trocados por equivalentes simples para não saírem quebrados.
const toLatin1 = (text) => String(text)
  .replace(/[–—]/g, '-')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/…/g, '...')
  .replace(/→/g, '->')
  .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');

const setColor = (doc, kind, color) => {
  if (kind === 'text') doc.setTextColor(...color);
  if (kind === 'fill') doc.setFillColor(...color);
  if (kind === 'draw') doc.setDrawColor(...color);
};

// Quebra um texto com trechos em **negrito** em linhas que cabem na largura.
const layoutRichText = (doc, text, width, size) => {
  // Cada palavra guarda se vem depois de um espaço; assim a pontuação colada
  // ao fim de um trecho em negrito ("**JSX**,") não ganha espaço extra.
  const words = [];
  let pendingSpace = false;
  toLatin1(text).split('**').forEach((chunk, index) => {
    chunk.split(/(\s+)/).filter(Boolean).forEach((part) => {
      if (/^\s+$/.test(part)) {
        pendingSpace = true;
        return;
      }
      words.push({ word: part, bold: index % 2 === 1, spaced: pendingSpace });
      pendingSpace = false;
    });
  });

  const lines = [];
  let line = [];
  let lineWidth = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  const spaceWidth = doc.getTextWidth(' ');
  words.forEach((token) => {
    doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
    const wordWidth = doc.getTextWidth(token.word);
    if (line.length > 0 && token.spaced && lineWidth + spaceWidth + wordWidth > width) {
      lines.push(line);
      line = [];
      lineWidth = 0;
    }
    const gap = line.length > 0 && token.spaced ? spaceWidth : 0;
    line.push({ ...token, x: lineWidth + gap });
    lineWidth += gap + wordWidth;
  });
  if (line.length > 0) lines.push(line);
  return lines;
};

const drawRichLines = (doc, lines, x, y, size, lineHeight, color = colors.ink) => {
  doc.setFontSize(size);
  setColor(doc, 'text', color);
  lines.forEach((line, index) => {
    line.forEach((token) => {
      doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
      doc.text(token.word, x + token.x, y + index * lineHeight);
    });
  });
};

export const buildHandout = ({ courseTitle, moduleNumber, moduleTitle, credit, videos, blocks }) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: toLatin1(`Apostila - ${courseTitle} - Módulo ${moduleNumber}`),
    subject: toLatin1(moduleTitle),
    author: 'CursoLab',
    creator: 'CursoLab',
  });

  // Capa: faixa azul-marinho com o curso e o módulo.
  setColor(doc, 'fill', colors.navy);
  doc.rect(0, 0, page.width, 62, 'F');
  setColor(doc, 'fill', colors.blue);
  doc.rect(page.margin, 18, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setColor(doc, 'text', [255, 255, 255]);
  doc.text('CursoLab', page.margin + 7, 21.4);
  doc.setFontSize(8.5);
  setColor(doc, 'text', [147, 197, 253]);
  doc.text(toLatin1(`APOSTILA DE APOIO  ·  MÓDULO ${moduleNumber}`), page.margin, 33);
  doc.setFontSize(20);
  setColor(doc, 'text', [255, 255, 255]);
  const titleLines = doc.splitTextToSize(toLatin1(moduleTitle), contentWidth);
  doc.text(titleLines, page.margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  setColor(doc, 'text', [203, 213, 225]);
  doc.text(toLatin1(courseTitle), page.margin, 42 + titleLines.length * 8);

  let y = 76;
  const ensureSpace = (height) => {
    if (y + height <= page.bottom) return;
    doc.addPage();
    y = page.margin + 4;
  };

  blocks.forEach((block) => {
    if (block.h) {
      ensureSpace(16);
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      setColor(doc, 'text', colors.navy);
      doc.text(toLatin1(block.h), page.margin, y);
      setColor(doc, 'fill', colors.blue);
      doc.rect(page.margin, y + 2, 12, 0.8, 'F');
      y += 9;
      return;
    }

    if (block.p) {
      const size = 10.5;
      const lineHeight = size * mmPerPt * 1.5;
      const lines = layoutRichText(doc, block.p, contentWidth, size);
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        drawRichLines(doc, [line], page.margin, y, size, lineHeight);
        y += lineHeight;
      });
      y += 3;
      return;
    }

    if (block.ul) {
      const size = 10.5;
      const lineHeight = size * mmPerPt * 1.5;
      block.ul.forEach((item) => {
        const lines = layoutRichText(doc, item, contentWidth - 7, size);
        ensureSpace(lineHeight * Math.min(lines.length, 2));
        setColor(doc, 'fill', colors.blue);
        doc.rect(page.margin + 1, y - 2.2, 1.6, 1.6, 'F');
        lines.forEach((line) => {
          ensureSpace(lineHeight);
          drawRichLines(doc, [line], page.margin + 7, y, size, lineHeight);
          y += lineHeight;
        });
        y += 1.2;
      });
      y += 2;
      return;
    }

    if (block.code) {
      const size = 9.5;
      const lineHeight = size * mmPerPt * 1.45;
      const lines = toLatin1(block.code).split('\n');
      const height = lines.length * lineHeight + 8;
      ensureSpace(height);
      setColor(doc, 'fill', colors.bg);
      doc.rect(page.margin, y - 3, contentWidth, height, 'F');
      setColor(doc, 'fill', colors.blue);
      doc.rect(page.margin, y - 3, 1, height, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(size);
      setColor(doc, 'text', colors.ink);
      lines.forEach((line, index) => doc.text(line, page.margin + 6, y + 2.5 + index * lineHeight));
      y += height + 3;
      return;
    }

    if (block.tip) {
      const size = 10;
      const lineHeight = size * mmPerPt * 1.5;
      const lines = layoutRichText(doc, block.tip, contentWidth - 12, size);
      const height = lines.length * lineHeight + 14;
      ensureSpace(height);
      setColor(doc, 'fill', colors.blueSoft);
      doc.rect(page.margin, y - 3, contentWidth, height, 'F');
      setColor(doc, 'fill', colors.blue);
      doc.rect(page.margin, y - 3, 1, height, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setColor(doc, 'text', colors.blue);
      doc.text(toLatin1((block.label || 'Para praticar').toUpperCase()), page.margin + 6, y + 3);
      drawRichLines(doc, lines, page.margin + 6, y + 9.5, size, lineHeight);
      y += height + 4;
    }
  });

  // Vídeos do módulo, com link para o original no YouTube.
  ensureSpace(20 + videos.length * 11);
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(doc, 'text', colors.navy);
  doc.text(toLatin1('Vídeos deste módulo'), page.margin, y);
  setColor(doc, 'fill', colors.blue);
  doc.rect(page.margin, y + 2, 12, 0.8, 'F');
  y += 10;
  videos.forEach((video, index) => {
    ensureSpace(11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, 'text', colors.ink);
    doc.text(toLatin1(`${index + 1}. ${video.title}`), page.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, 'text', colors.blue);
    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    doc.textWithLink(url, page.margin + 4.5, y + 4.6, { url });
    y += 11;
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(doc, 'text', colors.muted);
  const creditLines = doc.splitTextToSize(toLatin1(`Vídeos produzidos e publicados por ${credit}, incorporados ao CursoLab com o player oficial do YouTube. Todos os direitos sobre os vídeos pertencem aos autores. O texto desta apostila é material próprio do CursoLab.`), contentWidth);
  ensureSpace(creditLines.length * 4.4);
  doc.text(creditLines, page.margin, y + 1);

  // Rodapé com o curso e a numeração das páginas.
  const totalPages = doc.getNumberOfPages();
  for (let number = 1; number <= totalPages; number += 1) {
    doc.setPage(number);
    setColor(doc, 'draw', colors.line);
    doc.setLineWidth(0.3);
    doc.line(page.margin, 287, page.width - page.margin, 287);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, 'text', colors.muted);
    doc.text(toLatin1(`CursoLab  ·  ${courseTitle}  ·  Módulo ${moduleNumber}`), page.margin, 292);
    doc.text(toLatin1(`Página ${number} de ${totalPages}`), page.width - page.margin, 292, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
};
