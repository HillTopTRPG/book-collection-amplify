import {useAppSelector} from './store/hooks.ts'
import {clearScannedItems, selectScannedItems} from './store/scannerSlice.ts'
import {useDispatch} from 'react-redux'
import {AppDispatch} from './store'

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scannedDataList = useAppSelector(selectScannedItems);

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px'
    }}>
      <h4>📚 スキャン履歴 (最新{scannedDataList.length}件)</h4>
      <div style={{ margin: '10px 0' }}>
        {scannedDataList.map(({ data: book }, index) => (
          <div key={index} style={{
            padding: '10px',
            margin: '8px 0',
            backgroundColor: index === 0 ? '#e8f5e8' : '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {
                book && (
                  <>
                    {book?.cover && (
                      <img
                        src={book.cover}
                        alt="表紙"
                        style={{
                          width: '50px',
                          height: '75px',
                          objectFit: 'cover',
                          borderRadius: '3px',
                          border: '1px solid #ddd'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
                        {book.title}
                      </h5>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                        {book.author} / {book.publisher}
                      </p>
                      <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>
                        {book.isbn}
                      </p>
                    </div>
                  </>
                )
              }
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          dispatch(clearScannedItems());
        }}
        style={{
          padding: '8px 12px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        履歴クリア
      </button>
    </div>
  );
}
