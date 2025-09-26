export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const originalFetch = globalThis.fetch;

export const setupMockFetch = () => {
  if (!MOCK_MODE) return;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // NDL API のモック
    if (url.includes('ndlsearch.ndl.go.jp/api/sru')) {
      return mockNdlResponse();
    }

    // Google Books API のモック
    if (url.includes('googleapis.com/books/v1/volumes')) {
      return mockGoogleBooksResponse(url);
    }

    // 楽天 Books API のモック
    if (url.includes('app.rakuten.co.jp/services/api/BooksBook/Search')) {
      return mockRakutenResponse(url);
    }

    // その他のリクエストはそのまま実行
    return originalFetch(input, init);
  };
};

const mockNdlResponse = () => {
  const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
  <numberOfRecords>1</numberOfRecords>
  <records>
    <record>
      <recordData>
        <RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <BibResource>
            <identifier rdf:datatype="http://ndl.go.jp/dcndl/terms/ISBN">9784797395594</identifier>
            <title><Description><value>サンプル書籍タイトル</value></Description></title>
            <creator><Agent><name>サンプル著者</name></Agent></creator>
            <publisher><Agent><name>サンプル出版社</name></Agent></publisher>
            <date>2023-01-01</date>
            <subject rdf:resource="http://ndl.go.jp/vocab/ndc9/007.64"/>
          </BibResource>
        </RDF>
      </recordData>
    </record>
  </records>
</searchRetrieveResponse>`;

  return new Response(mockXml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
};

const mockGoogleBooksResponse = (url: string) => {
  const isbn = url.match(/isbn:(\d+)/)?.[1];

  const mockData = {
    totalItems: 1,
    items: [
      {
        volumeInfo: {
          title: `Google Books モック書籍 (ISBN: ${isbn})`,
          subtitle: '副題サンプル',
          authors: ['モック著者1', 'モック著者2'],
          publisher: 'モック出版社',
          publishedDate: '2023-01-01',
          imageLinks: {
            thumbnail: 'https://via.placeholder.com/128x192/0066cc/ffffff?text=Mock+Book',
          },
        },
      },
    ],
  };

  return new Response(JSON.stringify(mockData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const mockRakutenResponse = (url: string) => {
  const isbn = url.match(/isbn=([^&]+)/)?.[1];

  const mockData = {
    Items: [
      {
        Item: {
          isbn: isbn || '9784797395594',
          title: `楽天 Books モック書籍 (ISBN: ${isbn})`,
          subTitle: '楽天副題サンプル',
          author: '楽天モック著者',
          publisherName: '楽天モック出版社',
          salesDate: '2023/01/01',
          largeImageUrl: 'https://via.placeholder.com/200x300/ff6600/ffffff?text=Rakuten+Mock',
        },
      },
    ],
  };

  return new Response(JSON.stringify(mockData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const restoreFetch = () => {
  if (MOCK_MODE) {
    globalThis.fetch = originalFetch;
  }
};
