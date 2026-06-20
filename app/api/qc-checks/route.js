import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req) {
  const body = await req.json();
  // body: { jc_id, station_id, checklist, result, inspected_by }

  const { data, error } = await supabase
    .from('station_qc_checks')
    .insert({
      jc_id: body.jc_id,
      station_id: body.station_id,
      checklist: body.checklist,
      result: body.result,
      inspected_by: body.inspected_by,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
