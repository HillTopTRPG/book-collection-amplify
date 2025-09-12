import { useEffect, useState } from 'react';

import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../amplify/data/resource.ts';

const client = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function TodoList() {
  const [todos, setTodos] = useState<Array<Schema['Todo']['type']>>([]);

  useEffect(() => {
    const todoSubscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
    return () => {
      todoSubscription.unsubscribe();
    };
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt('Todo content') });
  }

  return (
    <div>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div style={{ marginTop: '20px' }}>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
    </div>
  );
}
