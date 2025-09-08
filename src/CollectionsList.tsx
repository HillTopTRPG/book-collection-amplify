import {useEffect, useState} from 'react'
import type {Schema} from '../amplify/data/resource.ts'
import {generateClient} from 'aws-amplify/data'

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function CollectionsList() {
  const [collection, setCollection] = useState<Array<Schema["Collection"]["type"]>>([]);
  const [books, setBooks] = useState<Array<Schema["Book"]["type"]>>([]);

  const bookCollections = books.filter(book => collection.some(c => c.isbn === book.isbn))

  useEffect(() => {
    userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollection([...data.items]),
    });
    apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h1>My Collections</h1>
      <ul>
        {bookCollections.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
      <h1>All Books</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    </div>
  )
}
