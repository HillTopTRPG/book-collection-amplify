import ndc8Map from '@/assets/ndc8.json';
import ndc9Map from '@/assets/ndc9.json';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { XmlProcessor } from '@/utils/data.ts';
import type { FetchProcessResult } from '@/utils/fetch';
import { getIsbn13, getIsbnCode } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

const NDC_MAPS = {
  ndc8: ndc8Map,
  ndc9: ndc9Map,
} as const;

const NDL_XML_QUERY = {
  resource: 'recordData > RDF > BibResource',
  records: 'records > record',
  isbn: 'identifier',
  datatype: 'rdf:datatype',
  isbnDatatype: 'h' + 'ttp://ndl.go.jp/dcndl/terms/ISBN',
  title: 'title > Description > value',
  publisher: 'publisher > Agent > name',
  creators: 'creator > Agent > name',
  creator: 'creator',
  date: 'date',
  volume: 'volume > Description > value',
  volumeTitle: 'volumeTitle > Description > value',
  seriesTitle: 'seriesTitle > Description > value',
  edition: 'edition',
  extent: 'extent',
  ndc: 'subject',
  resourceAttr: 'rdf:resource',
} as const;

const parser = new DOMParser();

const getNdlBooks = (recordElm: Element): [BookData] | [] => {
  const resourceElm = recordElm.querySelector(NDL_XML_QUERY.resource);
  if (!resourceElm) return [];
  const xml = new XmlProcessor(resourceElm, NDL_XML_QUERY);

  const maybeIsbn = getIsbnCode(xml.getContentsByAttribute('isbn', 'datatype', 'isbnDatatype'));
  if (!maybeIsbn) return [];

  // creator
  const creator = xml.getAllContents('creators');
  if (!creator.length) {
    const creatorText = xml
      .getContents('creator')
      ?.replace(/\/?[ \u{3000}]*著$/u, '')
      .trim();
    if (creatorText) creator.push(creatorText);
  }

  // ndc
  const ndcInfo =
    xml
      .getAllAttributes('ndc', 'resourceAttr')
      .flatMap(sp => {
        const rawNdcType = sp.at(-2);
        const ndcCode = sp.at(-1);
        const ndcType: 'ndc8' | 'ndc9' = rawNdcType === 'ndc8' ? 'ndc8' : 'ndc9';
        if (!rawNdcType?.startsWith('ndc') || !ndcCode) return [];

        return [{ rawNdcType, ndcCode, ndcType }];
      })
      .at(0) ?? null;

  const ndc = ndcInfo ? `${ndcInfo.rawNdcType}:${ndcInfo.ndcCode}` : null;
  const ndcLabels = ((): string[] => {
    if (!ndcInfo) return [];
    const { ndcType, ndcCode } = ndcInfo;
    const dataMap = NDC_MAPS[ndcType];
    const ndc = `${ndcType}:${ndcCode}`;

    // １文字ずつ増やして分類のラベルを取得していく
    return [...Array(ndc.length - 5)].flatMap((_, i) => {
      const code = ndc.slice(0, 6 + i);
      if (code.endsWith('.')) return [];
      const text = dataMap[code as keyof typeof dataMap];

      return text ? [text] : [];
    });
  })();

  return [
    {
      isbn: getIsbn13(maybeIsbn),
      title: xml.getContents('title'),
      volume: xml.getContents('volume'),
      volumeTitle: xml.getContents('volumeTitle'),
      creator,
      publisher: xml.getContents('publisher'),
      seriesTitle: xml.getContents('seriesTitle'),
      edition: xml.getContents('edition'),
      date: xml.getContents('date'),
      ndc,
      ndcLabels,
      extent: xml.getContents('extent'),
      cover: null,
    } as const satisfies BookData,
  ];
};

const getNdlQueryStr = (options: NdlFetchOptions): string => {
  options.dpid ||= 'book';
  options.mediatype ||= 'books';

  return (
    getKeys(options)
      .flatMap(key => {
        const value = options[key];
        if (!value) return [];
        switch (key) {
          case 'dpid':
          case 'mediatype':
          case 'title':
          case 'creator':
          case 'publisher':
          case 'anywhere':
            return [`${key}="${value}"`];
          case 'isbn':
            return [`${key}=${value}`];
          default:
            return [];
        }
      })
      .join(' and ') + ' and sortBy=issued_date/sort.ascending'
  );
};

export const callNdlSearchApi = async (optionsStr: string): Promise<FetchProcessResult<BookData[]>> => {
  const options = JSON.parse(optionsStr) as NdlFetchOptions;
  const query = getNdlQueryStr(options);
  console.log(query);
  const params = [
    ['operation', 'searchRetrieve'],
    ['version', '1.2'],
    ['recordPacking', 'xml'],
    ['recordSchema', 'dcndl'],
    ['startRecord', '1'],
    ['maximumRecords', '200'],
    ['query', encodeURIComponent(query)],
  ]
    .map(param => param.join('='))
    .join('&');

  const url = `https://ndlsearch.ndl.go.jp/api/sru?${params}`;

  try {
    const response = await fetch(url);
    if (response.status === 429) {
      console.log('Too Many Requests', url);
      return { value: [], error: 'Too Many Requests', retry: true };
    }
    const text = await response.text();
    const document = parser.parseFromString(text, 'text/xml');

    return {
      value: Array.from(document.querySelectorAll(NDL_XML_QUERY.records)).flatMap(getNdlBooks),
      error: null,
      retry: false,
    };
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    return { value: [], error: 'network?', retry: false };
  }
};
