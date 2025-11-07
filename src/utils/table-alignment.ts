/**
 * Utilitaires pour l'alignement automatique des colonnes de tableau
 */

let lastCalculatedWidths: number[] = [];
let lastTaskCount = 0;

export function syncTableColumnWidths() {
  // Synchronise les largeurs entre l'en-tête fixe et le corps du tableau - PARTIE TÂCHE
  const headerCells = document.querySelectorAll('.fixed-table-header th');
  const bodyRows = document.querySelectorAll('.table-body-container tbody tr');

  if (headerCells.length === 0 || bodyRows.length === 0) return;

  // Éviter les recalculs si le nombre de tâches n'a pas changé
  const currentTaskCount = bodyRows.length;
  if (currentTaskCount === lastTaskCount && lastCalculatedWidths.length > 0) {
    // console.log('⚡ Skipping recalculation - no task count change');
    return;
  }

  // Configuration des colonnes avec leurs largeurs min/max
  const columnConfig = [
    { min: 150, max: 400, name: 'Tâche' }, // Colonne 1: Tâche
    { min: 120, max: 200, name: 'Responsable' }, // Colonne 2: Responsable
    { min: 80, max: 120, name: 'Début' }, // Colonne 3: Début
    { min: 80, max: 120, name: 'Échéance' }, // Colonne 4: Échéance
    { min: 80, max: 120, name: 'Priorité' }, // Colonne 5: Priorité
    { min: 80, max: 120, name: 'Statut' }, // Colonne 6: Statut
    { min: 80, max: 120, name: 'Charge' }, // Colonne 7: Charge
    { min: 100, max: 150, name: 'Progression' }, // Colonne 8: Progression
    { min: 100, max: 150, name: 'Documents' }, // Colonne 9: Documents
    { min: 100, max: 150, name: 'Commentaires' }, // Colonne 10: Commentaires
    { min: 80, max: 100, name: 'Actions' }, // Colonne 11: Actions
  ];

  const calculatedWidths: number[] = [];

  // Calculer la largeur optimale pour chaque colonne
  columnConfig.forEach((config, columnIndex) => {
    let maxWidth = config.min;

    // Vérifier la largeur du titre de l'en-tête
    const headerCell = headerCells[columnIndex] as HTMLElement;
    if (headerCell) {
      const headerWidth = measureTextWidth(headerCell.textContent || '', headerCell);
      maxWidth = Math.max(maxWidth, headerWidth + 24); // +24 pour padding
    }

    // Vérifier la largeur du contenu dans chaque ligne
    bodyRows.forEach(row => {
      const cell = row.children[columnIndex] as HTMLElement;
      if (cell) {
        const cellWidth = measureTextWidth(cell.textContent || '', cell);
        maxWidth = Math.max(maxWidth, cellWidth + 24); // +24 pour padding
      }
    });

    // Appliquer les limites min/max
    maxWidth = Math.min(Math.max(maxWidth, config.min), config.max);
    calculatedWidths.push(maxWidth);
  });

  // Appliquer les largeurs calculées aux en-têtes et cellules
  calculatedWidths.forEach((width, index) => {
    // Appliquer à l'en-tête
    const headerCell = headerCells[index] as HTMLElement;
    if (headerCell) {
      headerCell.style.width = `${width}px`;
      headerCell.style.minWidth = `${width}px`;
      headerCell.style.maxWidth = `${width}px`;
    }

    // Appliquer à toutes les cellules de cette colonne
    bodyRows.forEach(row => {
      const cell = row.children[index] as HTMLElement;
      if (cell) {
        cell.style.width = `${width}px`;
        cell.style.minWidth = `${width}px`;
        cell.style.maxWidth = `${width}px`;
      }
    });
  });

  // Sauvegarder les valeurs pour éviter les recalculs
  lastCalculatedWidths = [...calculatedWidths];
  lastTaskCount = currentTaskCount;

  // console.log('✅ Largeurs calculées:', calculatedWidths.map((w, i) => `${columnConfig[i].name}: ${w}px`));
}

export function forceRecalculateColumnWidths() {
  // Force un nouveau calcul en réinitialisant le cache
  lastCalculatedWidths = [];
  lastTaskCount = 0;
  syncTableColumnWidths();
}

// Fonction pour calculer la largeur exacte du mot "Documentations"
export function getDocumentationsWidth(): {
  width: number;
  maxCharsPerLine: number;
  maxTotalChars: number;
} {
  const referenceText = 'Documentations';
  const tempSpan = document.createElement('span');

  // Utiliser la même police que les cellules du tableau
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.whiteSpace = 'nowrap';
  tempSpan.style.fontSize = '14px'; // Taille standard du tableau
  tempSpan.style.fontFamily = 'Inter, system-ui, sans-serif';
  tempSpan.style.fontWeight = '400';
  tempSpan.style.padding = '8px 12px'; // Padding standard des cellules

  tempSpan.textContent = referenceText;
  document.body.appendChild(tempSpan);

  const width = tempSpan.offsetWidth;
  const maxCharsPerLine = referenceText.length; // 14 caractères pour "Documentations"
  const maxTotalChars = maxCharsPerLine * 2; // 28 caractères total (2 lignes)

  document.body.removeChild(tempSpan);

  // console.log(`📏 Largeur calculée pour "${referenceText}": ${width}px`);
  // console.log(`📝 Limite: ${maxCharsPerLine} caractères/ligne, ${maxTotalChars} caractères total`);

  return { width, maxCharsPerLine, maxTotalChars };
}

// Fonction pour formater automatiquement le texte selon les critères de "Documentations"
export function formatTextToDocumentationsStandard(text: string): string {
  if (!text) return text;

  const { maxCharsPerLine, maxTotalChars } = getDocumentationsWidth();

  // Tronquer le texte si il dépasse la limite totale
  const truncatedText = text.length > maxTotalChars ? text.substring(0, maxTotalChars) : text;

  // Appliquer le retour automatique à la ligne
  if (truncatedText.length <= maxCharsPerLine) {
    return truncatedText;
  }

  // Première ligne : 14 caractères max
  const firstLine = truncatedText.substring(0, maxCharsPerLine);
  // Deuxième ligne : 14 caractères max
  const secondLine = truncatedText.substring(maxCharsPerLine, maxTotalChars);

  return firstLine + (secondLine ? '\n' + secondLine : '');
}

function measureTextWidth(text: string, referenceElement: HTMLElement): number {
  const tempSpan = document.createElement('span');
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.whiteSpace = 'nowrap';
  tempSpan.style.fontSize = window.getComputedStyle(referenceElement).fontSize;
  tempSpan.style.fontFamily = window.getComputedStyle(referenceElement).fontFamily;
  tempSpan.style.fontWeight = window.getComputedStyle(referenceElement).fontWeight;
  tempSpan.textContent = text;

  document.body.appendChild(tempSpan);
  const width = tempSpan.offsetWidth;
  document.body.removeChild(tempSpan);

  return width;
}

let isObserving = false;
let resizeTimeout: NodeJS.Timeout;

export function observeTableChanges() {
  // Éviter les observers multiples
  if (isObserving) return;

  const tableContainer = document.querySelector('.table-body-container');
  if (!tableContainer) return;

  isObserving = true;

  const observer = new MutationObserver(mutations => {
    // Filtrer seulement les changements significatifs
    const hasSignificantChange = mutations.some(
      mutation =>
        mutation.type === 'childList' &&
        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
    );

    if (hasSignificantChange) {
      // Debounce pour éviter les calculs répétitifs
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // console.log('🔄 Recalculating column widths due to significant DOM change');
        syncTableColumnWidths();
      }, 300);
    }
  });

  observer.observe(tableContainer, {
    childList: true,
    subtree: false, // Réduire la portée
    characterData: false, // Ignorer les changements de texte
  });

  return observer;
}

let isInitialized = false;
let resizeListener: (() => void) | null = null;

export function initTableAlignment() {
  // Éviter les initialisations multiples
  if (isInitialized) return;

  isInitialized = true;

  // Initialiser l'alignement des colonnes
  setTimeout(() => {
    // console.log('🎯 Initial table alignment calculation');
    syncTableColumnWidths();
    observeTableChanges();
  }, 500);

  // Éviter les event listeners multiples pour resize
  if (!resizeListener) {
    resizeListener = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // console.log('🔄 Recalculating due to window resize');
        syncTableColumnWidths();
      }, 200);
    };
    window.addEventListener('resize', resizeListener);
  }
}
