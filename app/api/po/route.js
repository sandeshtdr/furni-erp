import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, vendors(name), job_cards(jc_number)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { project_id, jc_id, material_name, vendor_id, quantity, unit, expected_eta }

  const { count } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 90;
  const po_number = `PO-2024-${String(seq).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      po_number,
      project_id: body.project_id,
      jc_id: body.jc_id || null,
      vendor_id: body.vendor_id || null,
      material_name: body.material_name,
      quantity: body.quantity,
      unit: body.unit,
      expected_eta: body.expected_eta || null,
      status: 'Pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    event_type: 'po_raised',
    description: `${po_number} raised for ${body.material_name} (${body.project_id})`,
  });

  return NextResponse.json(data);
}
