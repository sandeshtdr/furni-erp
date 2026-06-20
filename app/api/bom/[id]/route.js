import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

// PATCH /api/bom/[id]
// Used to update a single BoM line item's PO tracking fields
// (po_number, eta, po_status) without touching the rest of the row.
export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json(); // { po_number?, eta?, po_status? }

  const updates = {};
  if (body.po_number !== undefined) updates.po_number = body.po_number;
  if (body.eta !== undefined) updates.eta = body.eta || null;
  if (body.po_status !== undefined) updates.po_status = body.po_status;

  const { data, error } = await supabase
    .from('bom_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
