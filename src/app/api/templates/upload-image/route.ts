import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

const BUCKET = 'template-images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Unsupported image type. Use JPG, PNG, WEBP, or GIF.' }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'Image too large. Max size is 5MB.' }, { status: 400 });
        }

        const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
        const safeExt = String(ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
        const filePath = `templates/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt || 'bin'}`;

        const bytes = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, Buffer.from(bytes), {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: publicUrlData.publicUrl, path: filePath });
    } catch (error) {
        console.error('Template image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
