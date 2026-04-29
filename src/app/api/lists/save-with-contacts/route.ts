import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { isValidEmail, parseContactsText } from '@/lib/contact-import';

async function findOrCreateList(name: string, description: string | null) {
    const { data: existing, error: findError } = await supabase
        .from('contact_lists')
        .select('*')
        .ilike('name', name)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        if (description && description !== existing.description) {
            const { data: updated, error: updateError } = await supabase
                .from('contact_lists')
                .update({ description })
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) throw updateError;
            return updated;
        }

        return existing;
    }

    const { data: created, error: createError } = await supabase
        .from('contact_lists')
        .insert({ name, description })
        .select()
        .single();

    if (createError) throw createError;
    return created;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const listName = String(formData.get('list_name') || '').trim();
        const descriptionValue = String(formData.get('description') || '').trim();
        const description = descriptionValue || null;

        if (!listName) {
            return NextResponse.json({ error: 'List name is required' }, { status: 400 });
        }

        const list = await findOrCreateList(listName, description);
        const contacts: any[] = [];

        const email = String(formData.get('email') || '').trim().toLowerCase();
        if (email) {
            if (!isValidEmail(email)) {
                return NextResponse.json({ error: 'Single contact email is invalid' }, { status: 400 });
            }

            contacts.push({
                email,
                first_name: String(formData.get('first_name') || '').trim() || null,
                last_name: String(formData.get('last_name') || '').trim() || null,
                list_id: list.id,
            });
        }

        const file = formData.get('file') as File | null;
        if (file && file.size > 0) {
            const text = await file.text();
            contacts.push(...parseContactsText(text, file.name, list.id));
        }

        const unique = new Map<string, any>();
        for (const contact of contacts) {
            if (contact.email && isValidEmail(contact.email)) {
                unique.set(`${String(contact.email).toLowerCase()}::${list.id}`, {
                    ...contact,
                    email: String(contact.email).toLowerCase(),
                    list_id: list.id,
                });
            }
        }

        const contactsPayload = Array.from(unique.values());
        let added = 0;

        if (contactsPayload.length) {
            const { data, error } = await supabase
                .from('contacts')
                .upsert(contactsPayload, { onConflict: 'email,list_id' })
                .select('id');

            if (error) throw error;
            added = data?.length || contactsPayload.length;
        }

        return NextResponse.json({
            success: true,
            list,
            added,
            skipped: contacts.length - contactsPayload.length,
            message: `${list.name} saved${added ? ` with ${added} contact${added === 1 ? '' : 's'}` : ''}.`,
        });
    } catch (error: any) {
        console.error('Save list with contacts error:', error);
        return NextResponse.json(
            { error: 'Failed to save list and contacts', details: error?.message || null },
            { status: 500 }
        );
    }
}
