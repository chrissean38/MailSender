async function getTemplates() {
  const response = await fetch('http://localhost:3000/api/templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

async function createTemplate(name: string, subject: string, content: string) {
  const response = await fetch('http://localhost:3000/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, subject, content }),
  });

  if (!response.ok) throw new Error('Failed to create template');
  return response.json();
}

export { getTemplates, createTemplate };
