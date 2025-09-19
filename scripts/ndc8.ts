import { extractNDCData } from './ndc-extractor.js';

extractNDCData({
  version: 'ndc8',
  inputFileName: 'tmp/ndc8.ttl',
  outputFileName: 'src/assets/ndc8.json',
}).catch(console.error);
