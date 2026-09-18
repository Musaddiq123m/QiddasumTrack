import * as fs from 'fs';
import * as path from 'path';

const csvPath = path.join(__dirname, '..', 'activities.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8');

// Parse lines properly considering CSV
const lines = rawContent.split(/\r?\n/);
console.log(`Read ${lines.length} lines from activities.csv`);

const header = lines[0];
const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);

console.log(`Total data rows: ${dataLines.length}`);

// We want 161 continuous days ending on Sep 18, 2026
// Row 0 -> Sep 18, 2026
// Row 1 -> Sep 17, 2026
// ...
// Row 160 -> 160 days before Sep 18, 2026

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sep 18, 2026
const startDate = new Date(2026, 8, 18); // 8 is September (0-indexed)

const updatedLines: string[] = [header];

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];

  // The second column is quoted: "Sep 18, 2026, 4:00:34 PM"
  // Let's find the first quoted substring
  const quoteStart = line.indexOf('"');
  const quoteEnd = line.indexOf('"', quoteStart + 1);

  if (quoteStart === -1 || quoteEnd === -1) {
    console.error(`Row ${i} missing quoted date: ${line.slice(0, 50)}`);
    updatedLines.push(line);
    continue;
  }

  const originalDateStr = line.substring(quoteStart + 1, quoteEnd);

  // Target date for this row: startDate minus i days
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() - i);

  const mName = months[targetDate.getMonth()];
  const dayNum = targetDate.getDate();
  const yearNum = targetDate.getFullYear();

  // Extract the time portion from originalDateStr
  // originalDateStr looks like: "Sep 18, 2026, 4:00:34 PM" or "2026-05-11 07:15:00"
  let timePortion = '4:00:00 PM';
  const parts = originalDateStr.split(', ');
  if (parts.length >= 3) {
    timePortion = parts.slice(2).join(', ');
  } else if (originalDateStr.includes(' ')) {
    const spaceParts = originalDateStr.split(' ');
    timePortion = spaceParts.slice(1).join(' ');
  }

  const newDateStr = `${mName} ${dayNum}, ${yearNum}, ${timePortion}`;

  // Replace the original quoted date with newDateStr
  const before = line.substring(0, quoteStart);
  const after = line.substring(quoteEnd + 1);
  const updatedLine = `${before}"${newDateStr}"${after}`;

  updatedLines.push(updatedLine);

  if (i === 0 || i === dataLines.length - 1 || i < 5) {
    console.log(`Row ${i}: "${originalDateStr}" -> "${newDateStr}"`);
  }
}

// Write back to activities.csv
const backupPath = path.join(__dirname, '..', 'activities_backup.csv');
fs.writeFileSync(backupPath, rawContent, 'utf8');
console.log(`Backed up original activities.csv to ${backupPath}`);

fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf8');
console.log(`Successfully updated ${dataLines.length} rows in ${csvPath}!`);
