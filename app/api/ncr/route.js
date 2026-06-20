import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('ncr_reports')
    .select('*, job_cards(jc_number)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { jc_id, defect_description, severity, root_cause, corrective_action }

  const { count } = await supabase
    .from('ncr_reports')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 7;
  const ncr_number = `NCR-2024-${String(seq).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('ncr_reports')
    .insert({
      ncr_number,
      jc_id: body.jc_id,
      defect_description: body.defect_description,
      severity: body.severity || 'Minor',
      root_cause: body.root_cause || null,
      corrective_action: body.corrective_action || null,
      status: 'Open',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('job_cards').update({ status: 'QC Hold' }).eq('id', body.jc_id);

  const { data: jc } = await supabase.from('job_cards').select('jc_number').eq('id', body.jc_id).single();

  await supabase.from('activity_log').insert({
    event_type: 'ncr_raised',
    description: `${ncr_number} raised on ${jc?.jc_number || 'JC'} — ${body.defect_description}`,
    jc_id: body.jc_id,
  });

  return NextResponse.json(data);
}
