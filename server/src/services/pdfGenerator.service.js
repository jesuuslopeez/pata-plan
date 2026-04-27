const PDFDocument = require('pdfkit');

const COLORS = {
  primary600: '#1A7A5C',
  primary800: '#0B5D45',
  gray50: '#F3F1EC',
  gray100: '#E2E0D8',
  gray600: '#6B6A65',
  gray900: '#1E1E1D',
  danger: '#DC3545',
  success: '#28A745',
};

const PAGE_MARGIN = 50;
const FOOTER_RESERVED = 40;
const A4_WIDTH = 595.28;
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2;

const SPECIES_LABELS = { DOG: 'Perro', CAT: 'Gato', OTHER: 'Otro' };
const SEX_LABELS = { MALE: 'Macho', FEMALE: 'Hembra', UNKNOWN: 'Desconocido' };
const STATUS_LABELS = {
  PENDING: 'Pendiente',
  COMPLETED: 'Realizado',
  OVERDUE: 'Vencido',
  SKIPPED: 'Omitido',
};
const CATEGORY_LABELS = {
  VACCINE: 'Vacuna',
  DEWORMING_INTERNAL: 'Desp. interna',
  DEWORMING_EXTERNAL: 'Desp. externa',
  TREATMENT: 'Tratamiento',
  CHECKUP: 'Revisión',
};
const EXPENSE_CATEGORY_LABELS = {
  VACCINE: 'Vacunas',
  DEWORMING: 'Desparasitación',
  SURGERY: 'Cirugía',
  MEDICATION: 'Medicación',
  FOOD: 'Alimentación',
  OTHER: 'Otros',
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (isNaN(n)) return '—';
  return n.toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const toNumber = (decimal) => (decimal == null ? 0 : Number(decimal));

const ensureSpace = (doc, neededHeight) => {
  const maxY = doc.page.height - doc.page.margins.bottom - FOOTER_RESERVED;
  if (doc.y + neededHeight > maxY) {
    doc.addPage();
  }
};

const sectionDivider = (doc) => {
  doc.moveDown(0.5);
  const y = doc.y;
  doc
    .save()
    .strokeColor(COLORS.gray100)
    .lineWidth(0.5)
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y)
    .stroke()
    .restore();
  doc.moveDown(0.8);
};

const sectionTitle = (doc, title) => {
  ensureSpace(doc, 30);
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.primary800)
    .text(title, PAGE_MARGIN, doc.y);
  doc.fillColor(COLORS.gray900).font('Helvetica').fontSize(10);
  doc.moveDown(0.4);
};

const drawHeader = (doc, animalName, generatedAt) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(COLORS.gray900)
    .text('PataPlan — Informe Sanitario', PAGE_MARGIN, PAGE_MARGIN, {
      width: CONTENT_WIDTH,
    });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.gray600)
    .text(animalName, PAGE_MARGIN, doc.y + 4, { width: CONTENT_WIDTH * 0.6, continued: false });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.gray600)
    .text(`Generado el ${formatDateTime(generatedAt)}`, PAGE_MARGIN, PAGE_MARGIN + 28, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  const lineY = PAGE_MARGIN + 56;
  doc
    .save()
    .strokeColor(COLORS.primary600)
    .lineWidth(2)
    .moveTo(PAGE_MARGIN, lineY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY)
    .stroke()
    .restore();

  doc.fillColor(COLORS.gray900).font('Helvetica').fontSize(10);
  doc.y = lineY + 14;
  doc.x = PAGE_MARGIN;
};

const drawKeyValueTable = (doc, rows) => {
  const labelCol = 140;
  const rowHeight = 18;

  rows.forEach(([label, value], index) => {
    ensureSpace(doc, rowHeight);
    const y = doc.y;

    if (index % 2 === 0) {
      doc
        .save()
        .fillColor(COLORS.gray50)
        .rect(PAGE_MARGIN, y - 2, CONTENT_WIDTH, rowHeight)
        .fill()
        .restore();
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(label, PAGE_MARGIN + 8, y + 2, { width: labelCol - 8 });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(String(value), PAGE_MARGIN + labelCol, y + 2, {
        width: CONTENT_WIDTH - labelCol - 8,
      });

    doc.y = y + rowHeight;
  });

  doc.moveDown(0.5);
};

const drawTable = (doc, columns, rows) => {
  const headerHeight = 22;
  const rowHeight = 20;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const offsetX = PAGE_MARGIN;

  const drawHeaderRow = () => {
    const y = doc.y;
    doc
      .save()
      .fillColor(COLORS.gray50)
      .rect(offsetX, y, totalWidth, headerHeight)
      .fill()
      .restore();

    let cx = offsetX;
    columns.forEach((col) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(COLORS.gray900)
        .text(col.label, cx + 6, y + 6, {
          width: col.width - 12,
          align: col.align || 'left',
          ellipsis: true,
          lineBreak: false,
        });
      cx += col.width;
    });

    doc
      .save()
      .strokeColor(COLORS.gray100)
      .lineWidth(0.5)
      .rect(offsetX, y, totalWidth, headerHeight)
      .stroke()
      .restore();

    doc.y = y + headerHeight;
  };

  ensureSpace(doc, headerHeight + rowHeight);
  drawHeaderRow();

  rows.forEach((row, idx) => {
    ensureSpace(doc, rowHeight);
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - FOOTER_RESERVED) {
      doc.addPage();
      drawHeaderRow();
    }

    const y = doc.y;
    if (idx % 2 === 0) {
      doc
        .save()
        .fillColor('#FAFAF8')
        .rect(offsetX, y, totalWidth, rowHeight)
        .fill()
        .restore();
    }

    let cx = offsetX;
    columns.forEach((col, ci) => {
      const cell = row[ci];
      const cellColor = cell && cell.color ? cell.color : COLORS.gray900;
      const text = cell && typeof cell === 'object' ? cell.text : (cell ?? '');
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(cellColor)
        .text(String(text), cx + 6, y + 5, {
          width: col.width - 12,
          align: col.align || 'left',
          ellipsis: true,
          lineBreak: false,
        });
      cx += col.width;
    });

    doc
      .save()
      .strokeColor(COLORS.gray100)
      .lineWidth(0.3)
      .moveTo(offsetX, y + rowHeight)
      .lineTo(offsetX + totalWidth, y + rowHeight)
      .stroke()
      .restore();

    doc.fillColor(COLORS.gray900);
    doc.y = y + rowHeight;
  });

  doc.moveDown(0.6);
};

const statusCell = (status) => {
  let color = COLORS.gray600;
  if (status === 'COMPLETED') color = COLORS.success;
  else if (status === 'OVERDUE') color = COLORS.danger;
  return { text: STATUS_LABELS[status] || status, color };
};

const buildAnimalRows = (animal) => {
  const rows = [['Nombre', animal.name]];
  if (animal.species) rows.push(['Especie', SPECIES_LABELS[animal.species] || animal.species]);
  if (animal.breed) rows.push(['Raza', animal.breed]);
  if (animal.sex) rows.push(['Sexo', SEX_LABELS[animal.sex] || animal.sex]);
  if (animal.dateOfBirth) rows.push(['Fecha de nacimiento', formatDate(animal.dateOfBirth)]);
  if (animal.microchip) rows.push(['Microchip', animal.microchip]);
  if (animal.group?.name) rows.push(['Grupo', animal.group.name]);
  if (animal.notes) rows.push(['Notas', animal.notes]);
  return rows;
};

const renderVaccines = (doc, events) => {
  const rows = events
    .filter((e) => e.eventType.category === 'VACCINE')
    .map((e) => [
      formatDate(e.scheduledDate),
      e.eventType.name,
      e.product || '—',
      e.vetName || '—',
      statusCell(e.status),
    ]);

  if (rows.length === 0) return;

  sectionTitle(doc, 'Historial de vacunas');
  drawTable(
    doc,
    [
      { label: 'Fecha', width: 70 },
      { label: 'Vacuna', width: 130 },
      { label: 'Producto', width: 110 },
      { label: 'Veterinario', width: 110 },
      { label: 'Estado', width: 75 },
    ],
    rows
  );
  sectionDivider(doc);
};

const renderDewormings = (doc, events) => {
  const rows = events
    .filter(
      (e) =>
        e.eventType.category === 'DEWORMING_INTERNAL' ||
        e.eventType.category === 'DEWORMING_EXTERNAL'
    )
    .map((e) => [
      formatDate(e.scheduledDate),
      CATEGORY_LABELS[e.eventType.category],
      e.product || '—',
      statusCell(e.status),
    ]);

  if (rows.length === 0) return;

  sectionTitle(doc, 'Historial de desparasitaciones');
  drawTable(
    doc,
    [
      { label: 'Fecha', width: 90 },
      { label: 'Tipo', width: 130 },
      { label: 'Producto', width: 200 },
      { label: 'Estado', width: 75 },
    ],
    rows
  );
  sectionDivider(doc);
};

const renderTreatments = (doc, events) => {
  const rows = events
    .filter((e) => e.eventType.category === 'TREATMENT')
    .map((e) => [
      formatDate(e.scheduledDate),
      e.product || '—',
      e.vetName || '—',
      e.notes || '—',
      statusCell(e.status),
    ]);

  if (rows.length === 0) return;

  sectionTitle(doc, 'Tratamientos');
  drawTable(
    doc,
    [
      { label: 'Fecha', width: 70 },
      { label: 'Producto', width: 110 },
      { label: 'Veterinario', width: 100 },
      { label: 'Notas', width: 140 },
      { label: 'Estado', width: 75 },
    ],
    rows
  );
  sectionDivider(doc);
};

const renderVisits = (doc, visits) => {
  if (!visits || visits.length === 0) return;

  sectionTitle(doc, 'Visitas veterinarias');

  const limited = visits.slice(0, 10);
  limited.forEach((visit, idx) => {
    ensureSpace(doc, 70);

    const headerLine = `${formatDate(visit.visitDate)}${visit.vetName ? ` — ${visit.vetName}` : ''}`;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(headerLine, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });

    doc.font('Helvetica').fontSize(10);
    doc.text(`Motivo: ${visit.reason}`, PAGE_MARGIN, doc.y + 2, { width: CONTENT_WIDTH });
    if (visit.diagnosis) {
      doc.text(`Diagnóstico: ${visit.diagnosis}`, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
    }
    if (visit.treatment) {
      doc.text(`Tratamiento: ${visit.treatment}`, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
    }
    if (visit.observations) {
      doc.text(`Observaciones: ${visit.observations}`, PAGE_MARGIN, doc.y, {
        width: CONTENT_WIDTH,
      });
    }

    if (idx < limited.length - 1) {
      doc.moveDown(0.6);
    }
  });

  if (visits.length > 10) {
    doc
      .moveDown(0.4)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(COLORS.gray600)
      .text(
        `Mostrando las 10 visitas más recientes (${visits.length} en total).`,
        PAGE_MARGIN,
        doc.y,
        { width: CONTENT_WIDTH }
      );
    doc.fillColor(COLORS.gray900).font('Helvetica');
  }

  sectionDivider(doc);
};

const renderWeights = (doc, weights) => {
  if (!weights || weights.length === 0) return;

  sectionTitle(doc, 'Evolución de peso');

  const rows = weights.map((w) => [
    formatDate(w.recordedAt),
    `${formatNumber(toNumber(w.valueKg))} kg`,
    w.isAnomaly
      ? { text: 'Anomalía detectada', color: COLORS.danger }
      : '—',
  ]);

  drawTable(
    doc,
    [
      { label: 'Fecha', width: 130 },
      { label: 'Peso (kg)', width: 130, align: 'right' },
      { label: 'Observaciones', width: 225 },
    ],
    rows
  );

  const values = weights.map((w) => toNumber(w.valueKg)).filter((n) => !isNaN(n));
  if (values.length > 0) {
    const current = toNumber(weights[0].valueKg);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    ensureSpace(doc, 60);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray900);
    doc.text(`Peso actual: ${formatNumber(current)} kg`, PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
    });
    doc.text(`Peso medio: ${formatNumber(avg)} kg`, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
    doc.text(
      `Mínimo / Máximo: ${formatNumber(min)} kg / ${formatNumber(max)} kg`,
      PAGE_MARGIN,
      doc.y,
      { width: CONTENT_WIDTH }
    );
  }

  sectionDivider(doc);
};

const renderExpenses = (doc, expenses) => {
  if (!expenses || expenses.length === 0) return;

  sectionTitle(doc, 'Resumen de gastos');

  const total = expenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category;
    if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
    acc[cat].total += toNumber(e.amount);
    acc[cat].count += 1;
    return acc;
  }, {});

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.gray900)
    .text(`Gasto total: ${formatNumber(total)} €`, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.font('Helvetica').fontSize(10);
  doc.moveDown(0.4);

  const rows = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, info]) => [
      EXPENSE_CATEGORY_LABELS[cat] || cat,
      `${formatNumber(info.total)} €`,
      String(info.count),
    ]);

  drawTable(
    doc,
    [
      { label: 'Categoría', width: 250 },
      { label: 'Importe', width: 130, align: 'right' },
      { label: 'Nº registros', width: 105, align: 'right' },
    ],
    rows
  );
};

const drawFooters = (doc, generatedAt) => {
  const range = doc.bufferedPageRange();
  const generatedLabel = formatDateTime(generatedAt);
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.gray600)
      .text(
        `PataPlan — Generado el ${generatedLabel}      Página ${i + 1} de ${range.count}`,
        PAGE_MARGIN,
        doc.page.height - 30,
        { width: CONTENT_WIDTH, align: 'center' }
      );
    doc.page.margins.bottom = oldBottom;
  }
};

const generateReport = (data) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Informe sanitario — ${data.animal.name}`,
      Author: 'PataPlan',
    },
  });

  const generatedAt = new Date();

  drawHeader(doc, data.animal.name, generatedAt);

  sectionTitle(doc, 'Datos del animal');
  drawKeyValueTable(doc, buildAnimalRows(data.animal));
  sectionDivider(doc);

  const hasAdditional =
    data.healthEvents.length > 0 ||
    data.vetVisits.length > 0 ||
    data.weightRecords.length > 0 ||
    data.expenses.length > 0;

  if (!hasAdditional) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor(COLORS.gray600)
      .text('No hay registros adicionales para este animal.', PAGE_MARGIN, doc.y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
  } else {
    renderVaccines(doc, data.healthEvents);
    renderDewormings(doc, data.healthEvents);
    renderTreatments(doc, data.healthEvents);
    renderVisits(doc, data.vetVisits);
    renderWeights(doc, data.weightRecords);
    renderExpenses(doc, data.expenses);
  }

  drawFooters(doc, generatedAt);

  doc.end();
  return doc;
};

const buildFilename = (animalName) => {
  const slug =
    String(animalName)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'animal';
  const today = new Date().toISOString().slice(0, 10);
  return `informe-${slug}-${today}.pdf`;
};

module.exports = { generateReport, buildFilename };
