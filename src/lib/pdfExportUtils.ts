/**
 * PDF Export Utilities - Export PDF complet
 * Pattern: Stripe invoices, Monday.com reports
 * 
 * Deux types d'export:
 * 1. Tabulaire (tableaux professionnels)
 * 2. Visuel (capture dashboard)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// =====================================================
// Types
// =====================================================

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  includeDate?: boolean;
  logo?: string;
  footer?: string;
}

export interface PDFTableData {
  [key: string]: string | number;
}

// =====================================================
// 1. Export PDF Tabulaire (Pattern Stripe)
// =====================================================

/**
 * Crée un PDF avec tableau professionnel
 */
export async function exportTableToPDF(
  data: PDFTableData[],
  columns: PDFTableColumn[],
  options: PDFExportOptions
): Promise<void> {
  const {
    title,
    subtitle,
    filename = 'rapport.pdf',
    orientation = 'portrait',
    includeDate = true,
    footer,
  } = options;

  // Créer le document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // En-tête - Titre principal
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Sous-titre
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Date de génération
  if (includeDate) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Tableau avec autoTable
  autoTable(doc, {
    startY: yPosition,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => String(row[col.dataKey] || ''))),
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    margin: { left: 15, right: 15 },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });

  // Pied de page
  if (footer) {
    const finalY = (doc as any).lastAutoTable.finalY || yPosition;
    if (finalY < pageHeight - 20) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  // Numérotation des pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Télécharger le PDF
  doc.save(filename);
}

// =====================================================
// 2. Export Dashboard Visuel (Pattern Monday.com)
// =====================================================

/**
 * Capture un élément HTML et l'exporte en PDF
 */
export async function exportDashboardToPDF(
  elementId: string,
  options: PDFExportOptions
): Promise<void> {
  const {
    title,
    filename = 'dashboard.pdf',
    orientation = 'landscape',
    includeDate = true,
  } = options;

  try {
    // Trouver l'élément à capturer
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Capturer l'élément en canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Haute résolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Créer le PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Titre
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Date
    if (includeDate) {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    // Calculer les dimensions pour l'image
    const imgWidth = pageWidth - 20; // Marges de 10mm de chaque côté
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Vérifier si l'image tient sur une page
    const availableHeight = pageHeight - yPosition - 15;
    
    if (imgHeight <= availableHeight) {
      // Tient sur une page
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    } else {
      // Diviser en plusieurs pages si nécessaire
      const imgData = canvas.toDataURL('image/png');
      let currentY = yPosition;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(availableHeight, remainingHeight);
        const sourceHeight = (sliceHeight / imgHeight) * canvas.height;

        // Créer un canvas temporaire pour cette section
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          const sliceData = tempCanvas.toDataURL('image/png');
          doc.addImage(sliceData, 'PNG', 10, currentY, imgWidth, sliceHeight);
        }

        remainingHeight -= sliceHeight;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          doc.addPage();
          currentY = 15;
        }
      }
    }

    // Télécharger le PDF
    doc.save(filename);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
}

// =====================================================
// 3. Export Hybride (Tableau + Métriques)
// =====================================================

/**
 * Export PDF avec métriques en haut et tableau en bas
 */
export async function exportHybridPDF(
  metrics: Array<{ label: string; value: string | number }>,
  tableData: PDFTableData[],
  tableColumns: PDFTableColumn[],
  options: PDFExportOptions
): Promise<void> {
  const {
    title,
    subtitle,
    filename = 'rapport-complet.pdf',
    orientation = 'portrait',
    includeDate = true,
    footer,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  if (includeDate) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 8;

  // Section Métriques (KPIs)
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Métriques Clés', 15, yPosition);
  yPosition += 8;

  // Afficher les métriques en grille
  const metricsPerRow = 2;
  const metricWidth = (pageWidth - 40) / metricsPerRow;
  
  metrics.forEach((metric, index) => {
    const col = index % metricsPerRow;
    const row = Math.floor(index / metricsPerRow);
    const x = 15 + col * metricWidth;
    const y = yPosition + row * 15;

    // Encadré pour la métrique
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(x, y - 5, metricWidth - 5, 12, 'F');

    // Label
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(metric.label, x + 3, y);

    // Valeur
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246); // blue-500
    doc.text(String(metric.value), x + 3, y + 6);
  });

  yPosition += Math.ceil(metrics.length / metricsPerRow) * 15 + 10;

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 8;

  // Section Tableau
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Données Détaillées', 15, yPosition);
  yPosition += 8;

  // Tableau
  autoTable(doc, {
    startY: yPosition,
    head: [tableColumns.map((col) => col.header)],
    body: tableData.map((row) => tableColumns.map((col) => String(row[col.dataKey] || ''))),
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 15, right: 15 },
  });

  // Pied de page
  if (footer) {
    const finalY = (doc as any).lastAutoTable.finalY || yPosition;
    if (finalY < pageHeight - 20) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  // Numérotation
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  doc.save(filename);
}
