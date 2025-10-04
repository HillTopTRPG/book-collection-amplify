import type { NdlSearchResult } from '@/store/fetchNdlSearchSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import type { FetchProcessResult } from '@/utils/fetch';
import ndc8Map from '@/assets/ndc8.json';
import ndc9Map from '@/assets/ndc9.json';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import { getKeys } from '@/utils/type.ts';

const NDC_MAPS = {
  ndc8: ndc8Map,
  ndc9: ndc9Map,
} as const;

const NDL_XML_QUERY = {
  numberOfRecords: 'numberOfRecords',
  nextRecordPosition: 'nextRecordPosition',
  resource: 'recordData > RDF',
  adminResource: 'BibAdminResource',
  about: 'rdf:about',
  records: 'records > record',
  isbn: 'BibResource > identifier',
  datatype: 'rdf:datatype',
  isbnDatatype: 'h' + 'ttp://ndl.go.jp/dcndl/terms/ISBN',
  title: 'BibResource > title > Description > value',
  publisher: 'BibResource > publisher > Agent > name',
  creators: 'BibResource > creator > Agent > name',
  creator: 'BibResource > creator',
  date: 'BibResource > date',
  volume: 'BibResource > volume > Description > value',
  volumeTitle: 'BibResource > volumeTitle > Description > value',
  seriesTitle: 'BibResource > seriesTitle > Description > value',
  edition: 'BibResource > edition',
  extent: 'BibResource > extent',
  ndc: 'BibResource > subject',
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
      .flatMap(raw => {
        const sp = raw.split('/');
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
    const dataMap: Record<string, string> = NDC_MAPS[ndcType];
    const ndc = `${ndcType}:${ndcCode}`;

    // １文字ずつ増やして分類のラベルを取得していく
    return [...Array(ndc.length - 5)].flatMap((_, i) => {
      const code = ndc.slice(0, 6 + i);
      if (code.endsWith('.')) return [];
      const text = code in dataMap ? dataMap[code] : undefined;

      return text ? [text] : [];
    });
  })();

  return [
    {
      apiId: xml.getAttribute('adminResource', 'about')?.replace('https://ndlsearch.ndl.go.jp/books/', '') ?? '',
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
          case 'startRecord':
          default:
            return [];
        }
      })
      .join(' and ') + ' and sortBy=issued_date/sort.ascending'
  );
};

export const callNdlSearchApi = async (optionsStr: string): Promise<FetchProcessResult<NdlSearchResult>> => {
  const options = JSON.parse(optionsStr) as NdlFetchOptions;
  const query = getNdlQueryStr(options);
  const params = [
    ['operation', 'searchRetrieve'],
    ['version', '1.2'],
    ['recordPacking', 'xml'],
    ['recordSchema', 'dcndl'],
    ['startRecord', options.startRecord?.toString() ?? '1'],
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
      return {
        value: { list: [], numberOfRecords: null, nextRecordPosition: null },
        error: 'Too Many Requests',
        retry: true,
      };
    }
    const text = await response.text();
    const document = parser.parseFromString(text, 'text/xml');

    const numberOfRecordsStr = document.querySelector(NDL_XML_QUERY.numberOfRecords)?.textContent;
    const nextRecordPositionStr = document.querySelector(NDL_XML_QUERY.nextRecordPosition)?.textContent;

    return {
      value: {
        list: Array.from(document.querySelectorAll(NDL_XML_QUERY.records)).flatMap(getNdlBooks),
        numberOfRecords: numberOfRecordsStr ? parseInt(numberOfRecordsStr) : null,
        nextRecordPosition: nextRecordPositionStr ? parseInt(nextRecordPositionStr) : null,
      },
      error: null,
      retry: false,
    };
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    return { value: { list: [], numberOfRecords: null, nextRecordPosition: null }, error: 'network?', retry: false };
  }
};

export class XmlProcessor<T extends Record<string, string>> {
  constructor(
    private readonly parentElm: Element,
    private readonly queryMap: T
  ) {
    this.parentElm = parentElm;
    this.queryMap = queryMap;
  }

  public getContents(query: keyof T) {
    return this.parentElm.querySelector(this.queryMap[query])?.textContent?.trim() ?? null;
  }

  public getAttribute(query: keyof T, attribute: keyof T) {
    const elm = this.parentElm.querySelector(this.queryMap[query]);
    if (!elm) return null;
    return elm.getAttribute(this.queryMap[attribute]);
  }

  public getAllContents(query: keyof T) {
    return Array.from(this.parentElm.querySelectorAll(this.queryMap[query])).flatMap(elm =>
      elm.textContent ? [elm.textContent] : []
    );
  }

  public getContentsByAttribute(query: keyof T, attribute: keyof T, match: keyof T) {
    return Array.from(this.parentElm.querySelectorAll(this.queryMap[query])).find(
      elm => elm.getAttribute(this.queryMap[attribute]) === this.queryMap[match]
    )?.textContent;
  }

  public getAllAttributes(query: keyof T, attribute: keyof T) {
    return Array.from(this.parentElm.querySelectorAll(this.queryMap[query])).flatMap(elm => {
      const attr = elm.getAttribute(this.queryMap[attribute]);

      return attr ? [attr] : [];
    });
  }
}
