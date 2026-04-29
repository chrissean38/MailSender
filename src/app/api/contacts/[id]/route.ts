import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const updatePayload: any = {
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            list_id: body.list_id,
            status: body.status || 'active',
            updated_at: new Date().toISOString(),
        };

        const { data: contact, error } = await supabase
            .from('contacts')
            .update(updatePayload)
            .eq('id', params.id)
            .select('*')
            .single();

        if (error) throw error;
        return NextResponse.json({ contact });
    } catch (error) {
        console.error('Update contact error:', error);
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', params.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete contact error:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}
