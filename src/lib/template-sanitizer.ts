import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'span', 'div', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code'
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
    '*': ['style'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan']
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

export function sanitizeTemplateHtml(input: string) {
    return sanitizeHtml(String(input || ''), {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedSchemes: ALLOWED_SCHEMES,
        allowedSchemesAppliedToAttributes: ['href', 'src'],
        allowProtocolRelative: false,
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
        },
    });
}

export function htmlToPlainText(html: string) {
    return sanitizeHtml(String(html || ''), {
        allowedTags: [],
        allowedAttributes: {},
    })
        .replace(/\s+/g, ' ')
        .trim();
}
