import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('delivery_challans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { project_id, jc_ids: [], driver_name, vehicle_number, destination, dispatch_date }

  const { count } = await supabase
    .from('delivery_challans')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 32;
  const challan_number = `DC-2024-${String(seq).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('delivery_challans')
    .insert({
      challan_number,
      project_id: body.project_id,
      jc_ids: body.jc_ids,
      driver_name: body.driver_name,
      vehicle_number: body.vehicle_number,
      destination: body.destination || null,
      dispatch_date: body.dispatch_date || null,
      status: 'In Transit',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark included JCs as Dispatched
  if (body.jc_ids?.length) {
    await supabase
      .from('job_cards')
      .update({ stage: 'Dispatched', status: 'Dispatched' })
      .in('jc_number', body.jc_ids);
  }

  await supabase.from('activity_log').insert({
    event_type: 'dispatched',
    description: `${challan_number} dispatched — ${body.project_id} (${(body.jc_ids || []).join(', ')})`,
  });

  return NextResponse.json(data);
}
