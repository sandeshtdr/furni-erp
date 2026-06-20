import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import { nextStage } from '../../../../../lib/constants';

// PATCH /api/jc/[id]/advance
export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json(); // { moved_by, notes }

  const { data: jc, error: fetchErr } = await supabase
    .from('job_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const newStage = nextStage(jc.stage);
  const isDispatched = newStage === 'Dispatched';

  const { data, error } = await supabase
    .from('job_cards')
    .update({
      stage: newStage,
      status: isDispatched ? 'Dispatched' : 'Active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('jc_stage_history').insert({
    jc_id: id,
    from_stage: jc.stage,
    to_stage: newStage,
    moved_by: body.moved_by || 'Unknown',
    notes: body.notes || null,
  });

  await supabase.from('activity_log').insert({
    event_type: 'jc_advanced',
    description: `${jc.jc_number} advanced: ${jc.stage} → ${newStage}`,
    jc_id: id,
  });

  return NextResponse.json(data);
}
