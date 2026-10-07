// Gera o certificado de conclusão em PDF no navegador. Os dados vêm da API
// (GET /api/enrollments/:courseId/certificate), que verifica se o aluno pode
// emiti-lo. O jsPDF é carregado sob demanda para não pesar no carregamento
// inicial do site.

const formatLongDate = (value) => new Date(value || Date.now()).toLocaleDateString('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const safeFileName = (text) => text.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'curso';

// Monta o documento; separado do download para poder ser testado fora do navegador.
export const buildCertificatePdf = async (certificate) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const center = width / 2;

  // Moldura
  doc.setFillColor(245, 248, 252);
  doc.rect(0, 0, width, height, 'F');
  doc.setDrawColor(16, 42, 67);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.4);
  doc.rect(14, 14, width - 28, height - 28);

  // Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('CURSOLAB', center, 34, { align: 'center' });

  doc.setFontSize(30);
  doc.setTextColor(16, 42, 67);
  doc.text('CERTIFICADO DE CONCLUSÃO', center, 54, { align: 'center' });

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(center - 30, 61, center + 30, 61);

  // Corpo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(70, 85, 105);
  doc.text('Certificamos que', center, 80, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(16, 42, 67);
  doc.text(certificate.studentName, center, 96, { align: 'center', maxWidth: width - 60 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(70, 85, 105);
  doc.text('concluiu o curso', center, 110, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(16, 42, 67);
  const titleLines = doc.splitTextToSize(certificate.courseTitle, width - 80);
  doc.text(titleLines, center, 122, { align: 'center' });

  const afterTitle = 122 + (titleLines.length - 1) * 8;
  const hours = certificate.workloadHours === 1 ? '1 hora' : `${certificate.workloadHours} horas`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(70, 85, 105);
  doc.text(
    `com carga horária de ${hours}, concluído em ${formatLongDate(certificate.completedAt)}.`,
    center,
    afterTitle + 14,
    { align: 'center' },
  );

  // Assinatura
  const signatureY = height - 42;
  doc.setDrawColor(150, 160, 175);
  doc.setLineWidth(0.3);
  doc.line(center - 40, signatureY, center + 40, signatureY);
  doc.setFontSize(11);
  doc.setTextColor(16, 42, 67);
  doc.text('Equipe CursoLab', center, signatureY + 6, { align: 'center' });

  // Selo dourado, o mesmo da aba de certificados do painel
  const sealX = width - 62;
  const sealY = signatureY - 6;
  doc.setFillColor(245, 158, 11);
  doc.circle(sealX, sealY, 15, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sealY, 12, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('CL', sealX, sealY + 1, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('CONCLUÍDO', sealX, sealY + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Rodapé
  doc.setFontSize(9);
  doc.setTextColor(110, 120, 135);
  doc.text(`Código de verificação: ${certificate.code}`, 22, height - 20);
  doc.text(`Emitido em ${formatLongDate()}`, width - 22, height - 20, { align: 'right' });

  return doc;
};

export const downloadCertificatePdf = async (certificate) => {
  const doc = await buildCertificatePdf(certificate);
  doc.save(`Certificado - ${safeFileName(certificate.courseTitle)}.pdf`);
};
