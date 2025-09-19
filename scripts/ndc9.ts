import { extractNDCData } from './ndc-extractor.js';

extractNDCData({
  version: 'ndc9',
  inputFileName: 'tmp/ndc9.ttl',
  outputFileName: 'src/assets/ndc9.json',
}).catch(console.error);
