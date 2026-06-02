import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

// Helper to parse CSV cells correctly in Node.js
function parseEnglishCSV(text: string) {
  const list = [];
  const rows = text.split(/\r?\n/);
  if (rows.length === 0) return [];

  // Helper to extract tokens of a line safely
  const getCellsOfLine = (line: string) => {
    const cells = [];
    let currentVal = '';
    let insideQuotes = false;
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const c = line[charIndex];
      if (c === '"') {
        insideQuotes = !insideQuotes;
      } else if ((c === ',' || c === ';') && !insideQuotes) {
        cells.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += c;
      }
    }
    cells.push(currentVal.trim().replace(/^"|"$/g, ''));
    return cells;
  };

  const firstLine = rows[0]?.trim();
  if (!firstLine) return [];
  const firstRowCells = getCellsOfLine(firstLine);

  // Check if first row contains headers
  const isHeaderRow = firstRowCells.some(cell => {
    const lower = cell.toLowerCase().trim();
    return lower === 'portugues' || 
           lower === 'português' || 
           lower === 'translation' ||
           lower === 'english' ||
           lower === 'inglês' ||
           lower === 'ingles' ||
           lower === 'word' ||
           lower === 'vocab' ||
           lower === 'vocabulary' ||
           lower === 'term' ||
           lower === 'level' ||
           lower === 'cefr';
  });

  let en_idx = -1;
  let pt_idx = -1;
  let meaning_idx = -1;
  let trans_meaning_idx = -1;
  let ex1_idx = -1;
  let ex2_idx = -1;
  let trans_e1_idx = -1;
  let trans_e2_idx = -1;

  if (isHeaderRow) {
    const findIdx = (queries: string[]) => {
      // 1. Try exact matches first
      const exactIndex = firstRowCells.findIndex(cell => {
        const val = cell.toLowerCase().trim();
        return queries.some(q => val === q.toLowerCase().trim());
      });
      if (exactIndex !== -1) return exactIndex;

      // 2. Fallback to includes
      return firstRowCells.findIndex(cell => {
        const val = cell.toLowerCase().trim();
        return queries.some(q => val.includes(q.toLowerCase().trim()));
      });
    };

    en_idx = findIdx(['word', 'english', 'ingles', 'inglês', 'en', 'vocab', 'term']);
    pt_idx = findIdx(['translation', 'portugues', 'português', 'pt']);
    meaning_idx = findIdx(['meaning', 'significado', 'definition', 'definicao', 'explicação']);
    trans_meaning_idx = findIdx(['translation meaning', 'significado_pt', 'definicao_pt', 'definição_pt']);
    ex1_idx = findIdx(['example 1', 'example1', 'english example', 'exemplo_en']);
    ex2_idx = findIdx(['example 2', 'example2']);
    trans_e1_idx = findIdx(['translation e1', 'translatione1', 'portuguese example', 'exemplo_pt']);
    trans_e2_idx = findIdx(['translation e2', 'translatione2']);
  }

  // Determine fallbacks if indices are unmatched
  if (en_idx === -1) en_idx = 1;
  if (pt_idx === -1) pt_idx = 0;

  // Prevent index boundaries issue
  if (en_idx >= firstRowCells.length) en_idx = 0;
  if (pt_idx >= firstRowCells.length) pt_idx = 0;

  const startIdx = isHeaderRow ? 1 : 0;
  for (let i = startIdx; i < rows.length; i++) {
    const line = rows[i].trim();
    if (!line) continue;

    const cells = getCellsOfLine(line);
    if (cells.length === 0) continue;

    const enWord = cells[en_idx] || '';
    const ptWord = cells[pt_idx] || '';

    if (enWord || ptWord) {
      let meaningVal = meaning_idx !== -1 ? cells[meaning_idx] : undefined;
      let transMeaningVal = trans_meaning_idx !== -1 ? cells[trans_meaning_idx] : undefined;
      let ex1Val = ex1_idx !== -1 ? cells[ex1_idx] : undefined;
      let ex2Val = ex2_idx !== -1 ? cells[ex2_idx] : undefined;
      let transE1Val = trans_e1_idx !== -1 ? cells[trans_e1_idx] : undefined;
      let transE2Val = trans_e2_idx !== -1 ? cells[trans_e2_idx] : undefined;

      // Compatibility fields fallbacks
      const ptExample = transE1Val || (cells.length > 2 ? cells.filter((_, idx) => idx !== en_idx && idx !== pt_idx)[0] : undefined);
      const enExample = ex1Val || (cells.length > 3 ? cells.filter((_, idx) => idx !== en_idx && idx !== pt_idx)[1] : undefined);

      list.push({
        portuguese: ptWord || enWord,
        english: enWord || ptWord,
        portugueseExample: ptExample,
        englishExample: enExample,
        meaning: meaningVal,
        translationMeaning: transMeaningVal,
        example1: ex1Val || enExample,
        example2: ex2Val,
        translationE1: transE1Val || ptExample,
        translationE2: transE2Val
      });
    }
  }
  return list;
}

// Scans Flashcards Sets / flashcards folder to generate decks
function generateDecks() {
  const possibleDirs = ['Flashcards Sets', 'flashcards'];
  let targetDir = '';
  for (const dirName of possibleDirs) {
    const fullPath = path.resolve(process.cwd(), dirName);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      targetDir = fullPath;
      break;
    }
  }

  // Fallback: If neither exists, let's create "Flashcards Sets"
  if (!targetDir) {
    targetDir = path.resolve(process.cwd(), 'Flashcards Sets');
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(targetDir);
  const csvFiles = files.filter(f => f.toLowerCase().endsWith('.csv'));

  const DECK_COLORS = [
    '#FFA022', '#0EB880', '#D088B5', '#4FBEC9', '#FFCD46', '#5E75AE', '#5E4797', '#F3B8D6', 
    '#FF6569', '#FF5FA9', '#3C59C2', '#039547', '#FFBC5D', '#7389F7', '#1A946F', 
    '#A7DEF7', '#35C4FE', '#46B29D', '#8C3C77', '#EF4770', '#EE964D', '#6692FE', 
    '#625BF8', '#9C89B5', '#454A6F'
  ];

  const parsedDecks = [];

  for (let index = 0; index < csvFiles.length; index++) {
    const fileName = csvFiles[index];
    const filePath = path.join(targetDir, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    const cards = parseEnglishCSV(content);

    if (cards.length > 0) {
      const colorCode = DECK_COLORS[index % DECK_COLORS.length];
      const rawName = fileName
        .replace(/\.csv$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/^\d+/, '') // strip numbers
        .trim();
      const displayName = rawName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      parsedDecks.push({
        id: `local_csv_${index}_${fileName}`,
        name: displayName || fileName,
        color: colorCode,
        cards: cards,
        isCustom: true
      });
    }
  }

  // Ensure src/ directory exists
  const srcDir = path.resolve(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  const generatedPath = path.join(srcDir, 'flashcards_generated.json');
  fs.writeFileSync(generatedPath, JSON.stringify(parsedDecks, null, 2), 'utf-8');
  console.log(`[CSV DECK GENERATOR] Successfully compiled ${parsedDecks.length} decks from "${targetDir}"`);
}

// Simple Vite custom plugin to watch and trigger compilation
function csvWatcherPlugin() {
  return {
    name: 'csv-watcher-plugin',
    buildStart() {
      generateDecks();
    },
    configureServer(server: any) {
      const pathsToWatch = [
        path.resolve(process.cwd(), 'Flashcards Sets'),
        path.resolve(process.cwd(), 'flashcards')
      ];

      pathsToWatch.forEach(p => {
        if (fs.existsSync(p)) {
          server.watcher.add(p);
        }
      });

      server.watcher.on('all', (event: string, filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv') || filePath.includes('Flashcards Sets') || filePath.includes('flashcards')) {
          console.log(`[CSV WATCHER] File event "${event}" on "${filePath}". Regenerating JSON...`);
          try {
            generateDecks();
          } catch (e) {
            console.error('Error auto-generating CSV decks:', e);
          }
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      csvWatcherPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
