async function getLists() {
  const response = await fetch('http://localhost:3000/api/lists');
  if (!response.ok) throw new Error('Failed to fetch lists');
  return response.json();
}

async function createList(name: string, description?: string) {
  const response = await fetch('http://localhost:3000/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) throw new Error('Failed to create list');
  return response.json();
}

export { getLists, createList };
