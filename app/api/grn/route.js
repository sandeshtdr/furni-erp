import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('goods_receipt_notes')
    .select('*, purchase_orders(po_number, material_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { po_id, received_qty, qc_result, moisture_content, remarks }

  const { count } = await supabase
    .from('goods_receipt_notes')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 43;
  const grn_number = `GRN-2024-${String(seq).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('goods_receipt_notes')
    .insert({
      grn_number,
      po_id: body.po_id,
      received_qty: body.received_qty,
      qc_result: body.qc_result || 'Pending',
      moisture_content: body.moisture_content || null,
      remarks: body.remarks || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update the linked PO's status based on QC result
  const poStatus = body.qc_result === 'Pass' ? 'Received' : body.qc_result === 'Partial — shortage' ? 'Partial' : 'Pending';
  await supabase.from('purchase_orders').update({ status: poStatus }).eq('id', body.po_id);

  await supabase.from('activity_log').insert({
    event_type: 'grn_created',
    description: `${grn_number} created (QC: ${body.qc_result || 'Pending'})`,
  });

  return NextResponse.json(data);
}
