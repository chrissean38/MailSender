export type ParsedContact = {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    list_id: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
    return EMAIL_RE.test(String(email || '').trim());
}

function splitCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && quoted && next === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function normalizeHeader(header: string) {
    return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export function parseContactsText(text: string, filename: string, listId: string): ParsedContact[] {
    const ext = filename.toLowerCase().split('.').pop();
    const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    if (!lines.length) return [];

    if (ext === 'txt') {
        return lines
            .map((line) => {
                const parts = line.split(/[;,\t]/).map((part) => part.trim());
                return {
                    email: parts[0],
                    first_name: parts[1] || null,
                    last_name: parts[2] || null,
                    list_id: listId,
                };
            })
            .filter((contact) => isValidEmail(contact.email));
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);
    const contacts: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
        });

        const email = row.email || row.email_address || row.e_mail;
        if (!isValidEmail(email)) continue;

        contacts.push({
            email,
            first_name: row.first_name || row.firstname || row.first || null,
            last_name: row.last_name || row.lastname || row.last || null,
            list_id: listId,
        });
    }

    return contacts;
}
