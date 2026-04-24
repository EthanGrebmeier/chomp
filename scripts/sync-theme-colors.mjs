import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssPath = path.resolve(__dirname, '../global.css');
const themePath = path.resolve(__dirname, '../lib/theme.ts');

const preferredOrder = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'border',
  'input',
  'ring',
  'radius',
  'chart1',
  'chart2',
  'chart3',
  'chart4',
  'chart5',
];

function extractBlock(css, selector) {
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`);
  const match = css.match(regex);
  if (!match) {
    throw new Error(`Could not find "${selector}" block in global.css`);
  }
  return match[1];
}

function toThemeKey(cssVar) {
  return cssVar.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function normalizeValue(key, rawValue) {
  const value = rawValue.trim();
  if (key === 'radius') {
    return value;
  }
  if (/^(hsl|rgb|oklch)\(/.test(value) || value.startsWith('#')) {
    return value;
  }
  return `hsl(${value})`;
}

function parseVariables(block) {
  const vars = {};
  const declarationRegex = /^\s*--([a-z0-9-]+)\s*:\s*([^;]+);/gm;
  for (const match of block.matchAll(declarationRegex)) {
    const [, cssVar, rawValue] = match;
    const key = toThemeKey(cssVar);
    vars[key] = normalizeValue(key, rawValue);
  }
  return vars;
}

function orderedKeys(themeObject) {
  const keys = Object.keys(themeObject);
  const preferred = preferredOrder.filter((key) => keys.includes(key));
  const extras = keys
    .filter((key) => !preferredOrder.includes(key))
    .sort((a, b) => a.localeCompare(b));
  return [...preferred, ...extras];
}

function buildThemeExport(lightTheme, darkTheme) {
  const lightKeys = orderedKeys(lightTheme);
  const darkKeys = orderedKeys(darkTheme);

  const lines = ['export const THEME = {', '  light: {'];
  for (const key of lightKeys) {
    lines.push(`    ${key}: '${lightTheme[key]}',`);
  }
  lines.push('  },', '  dark: {');
  for (const key of darkKeys) {
    lines.push(`    ${key}: '${darkTheme[key]}',`);
  }
  lines.push('  },', '};');
  return lines.join('\n');
}

function findThemeExportRange(themeFileText) {
  const exportToken = 'export const THEME = ';
  const start = themeFileText.indexOf(exportToken);
  if (start === -1) {
    throw new Error('Could not find `export const THEME` in lib/theme.ts');
  }

  const openBrace = themeFileText.indexOf('{', start);
  if (openBrace === -1) {
    throw new Error('Could not find opening brace for THEME export');
  }

  let depth = 0;
  let closeBrace = -1;
  for (let i = openBrace; i < themeFileText.length; i += 1) {
    const char = themeFileText[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      closeBrace = i;
      break;
    }
  }

  if (closeBrace === -1) {
    throw new Error('Could not find closing brace for THEME export');
  }

  let end = closeBrace + 1;
  while (end < themeFileText.length && /\s/.test(themeFileText[end])) {
    end += 1;
  }
  if (themeFileText[end] === ';') {
    end += 1;
  }

  return { start, end };
}

async function main() {
  const [cssText, themeText] = await Promise.all([
    readFile(cssPath, 'utf8'),
    readFile(themePath, 'utf8'),
  ]);

  const rootBlock = extractBlock(cssText, ':root');
  const darkBlock = extractBlock(cssText, '\\.dark:root');

  const lightTheme = parseVariables(rootBlock);
  const darkTheme = {
    ...lightTheme,
    ...parseVariables(darkBlock),
  };
  const nextThemeExport = buildThemeExport(lightTheme, darkTheme);

  const range = findThemeExportRange(themeText);
  const nextThemeText =
    themeText.slice(0, range.start) + nextThemeExport + themeText.slice(range.end);

  await writeFile(themePath, nextThemeText, 'utf8');
  console.log('Synced `lib/theme.ts` from `global.css` color variables.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
