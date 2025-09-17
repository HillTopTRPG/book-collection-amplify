import fs from 'fs';
import path from 'path';

interface NDCExtractionOptions {
  version: string;
  inputFileName: string;
  outputFileName: string;
}

export function extractNDCData(options: NDCExtractionOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const inputPath = path.join(process.cwd(), options.inputFileName);
      const outputPath = path.join(process.cwd(), options.outputFileName);

      console.log(`Reading ${options.inputFileName} file...`);
      const content = fs.readFileSync(inputPath, 'utf-8');
      const lines = content.split('\n');

      const ndcMap = new Map<string, string>();
      const ndcPattern = new RegExp(`^(${options.version}:[0-9.]+) a [^;]+;$`);
      const labelPattern = /^\s*skos:prefLabel "(.+?)"@ja/;

      let currentCode: string | null = null;
      let processedCount = 0;

      console.log('Processing lines...');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const ndcMatch = line.match(ndcPattern);
        if (ndcMatch) {
          currentCode = ndcMatch[1];

          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];

            if (nextLine.trim() === '' || nextLine.trim() === '.') {
              break;
            }

            const labelMatch = nextLine.match(labelPattern);
            if (labelMatch && currentCode) {
              ndcMap.set(currentCode, labelMatch[1]);
              processedCount++;
              if (processedCount % 1000 === 0) {
                console.log(`Processed ${processedCount} entries...`);
              }
              break;
            }
          }
          currentCode = null;
        }
      }

      console.log(`Found ${ndcMap.size} NDC entries`);

      const result = Object.fromEntries(ndcMap);

      console.log(`Writing to ${options.outputFileName}...`);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log(`Successfully extracted ${ndcMap.size} NDC entries to ${outputPath}`);
      resolve();

    } catch (error) {
      console.error('Error processing NDC data:', error);
      reject(error);
    }
  });
}