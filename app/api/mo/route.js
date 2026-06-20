import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { genProjectId } from '../../../lib/constants';

export async function GET() {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .select('*, job_cards(count)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();

  // Determine next sequence number for MO + Project ID
  const { count } = await supabase
    .from('manufacturing_orders')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 41; // demo data starts at 042; remove +41 once demo seed is cleared
  const mo_number = `MO-2024-${String(seq).padStart(3, '0')}`;
  const project_id = genProjectId(seq);

  const { data, error } = await supabase
    .from('manufacturing_orders')
    .insert({
      mo_number,
      project_id,
      client_name: body.client_name,
      project_type: body.project_type,
      delivery_date: body.delivery_date || null,
      notes: body.notes || null,
      status: 'Procurement',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    event_type: 'mo_created',
    description: `${mo_number} created — Project ID ${project_id} assigned (${body.client_name})`,
  });

  return NextResponse.json(data);
}
