import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

/**
 * Strava to Tracker Converter Script
 * Usage:
 *   npx tsx scripts/convert_strava.ts <path-to-strava-activities.csv> [output.xlsx]
 */

function convertStravaCsv(inputPath: string, outputPath?: string) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found at "${inputPath}"`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(inputPath);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheetName]);

  console.log(`Read ${rows.length} total activity rows from ${inputPath}`);

  const walkingRows: {
    Date: string;
    Steps: number;
    Distance_KM: number;
    Speed_KMH: number;
    Activity_Type?: string;
  }[] = [];

  let skippedNonWalk = 0;

  for (const row of rows) {
    const activityType = (row['Activity Type'] || row['activity_type'] || row['Type'] || '').toLowerCase();
    
    // Include Walk, Hike, Run
    if (activityType && !['walk', 'walking', 'hike', 'hiking', 'run', 'running'].includes(activityType)) {
      skippedNonWalk++;
      continue;
    }

    // Parse date
    const rawDate = row['Activity Date'] || row['Date'] || row['activity_date'];
    if (!rawDate) continue;

    let formattedDate = '';
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedDate = `${y}-${m}-${day}`;
    } else if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
      formattedDate = rawDate.trim();
    }

    if (!formattedDate) continue;

    // Distance in km
    let dist = Number(row['Distance'] ?? row['Distance_KM'] ?? row['distance'] ?? 0);
    if (dist > 60) {
      // Strava exports in meters
      dist = Number((dist / 1000).toFixed(2));
    } else {
      dist = Number(dist.toFixed(2));
    }

    if (dist <= 0) continue;

    // Speed in km/h
    let speed = Number(row['Average Speed'] ?? row['Speed_KMH'] ?? row['speed'] ?? 0);
    if (speed > 0 && speed < 10) {
      // Strava exports in m/s
      speed = Number((speed * 3.6).toFixed(1));
    } else {
      speed = Number(speed.toFixed(1));
    }

    // Steps estimation if not tracked by GPS
    let steps = Number(row['Steps'] ?? row['steps'] ?? 0);
    if (!steps || isNaN(steps)) {
      steps = Math.round(dist * 1350); // standard ~1350 steps per km
    }

    walkingRows.push({
      Date: formattedDate,
      Steps: steps,
      Distance_KM: dist,
      Speed_KMH: speed,
      Activity_Type: row['Activity Type'] || 'Walk',
    });
  }

  console.log(`Filtered: ${walkingRows.length} walking/hiking activities (skipped ${skippedNonWalk} other activities like cycling/swimming).`);

  const outPath = outputPath || path.join(process.cwd(), 'strava_walking_data.xlsx');
  const outWb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(walkingRows);
  XLSX.utils.book_append_sheet(outWb, ws, 'Walking');
  XLSX.writeFile(outWb, outPath);

  console.log(`Successfully generated tracker-ready Excel file:`);
  console.log(`-> ${outPath}`);
  console.log(`You can now import this file directly in Settings -> "Import / Restore Data" on your app!`);
}

const inputArg = process.argv[2];
const outputArg = process.argv[3];

if (!inputArg) {
  console.log(`Usage: npx tsx scripts/convert_strava.ts <path-to-strava-activities.csv> [output.xlsx]`);
  console.log(`Example: npx tsx scripts/convert_strava.ts ~/Downloads/activities.csv`);
} else {
  convertStravaCsv(inputArg, outputArg);
}
