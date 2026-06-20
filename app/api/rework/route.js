import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('rework_log')
    .select('*, job_cards(jc_number), stations(name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { jc_id, station_id, defect_description, panels_affected, escalation_level }

  const { data, error } = await supabase
    .from('rework_log')
    .insert({
      jc_id: body.jc_id,
      station_id: body.station_id,
      defect_description: body.defect_description,
      panels_affected: body.panels_affected,
      escalation_level: body.escalation_level || 'L1',
      status: body.escalation_level && body.escalation_level !== 'L1' ? 'Escalated' : 'Open',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark the JC as in rework
  await supabase.from('job_cards').update({ status: 'Rework' }).eq('id', body.jc_id);

  const { data: jc } = await supabase.from('job_cards').select('jc_number').eq('id', body.jc_id).single();

  await supabase.from('activity_log').insert({
    event_type: 'rework_logged',
    description: `Rework logged on ${jc?.jc_number || 'JC'} — ${body.defect_description}`,
    jc_id: body.jc_id,
  });

  return NextResponse.json(data);
}
