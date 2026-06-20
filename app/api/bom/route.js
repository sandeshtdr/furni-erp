import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jc_id = searchParams.get('jc_id');

  let query = supabase.from('bom_items').select('*, job_cards(jc_number, product_name)').order('created_at', { ascending: true });
  if (jc_id) query = query.eq('jc_id', jc_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// JC stages, in order — duplicated here (rather than imported) because this
// route runs server-side where the client lib/constants.js stage order is
// the single source of truth; kept in sync manually if that list changes.
const JC_STAGES = [
  'JC Created', 'BoM', 'Procurement', 'Stores', 'Hot Press', 'Beam Saw',
  'Edge Bander', 'CNC Drill', 'Assembly', 'QC', 'Packing', 'Dispatched',
];
function stageIndex(stage) {
  const i = JC_STAGES.indexOf(stage);
  return i === -1 ? 0 : i;
}

export async function POST(req) {
  const body = await req.json();

  // Block adding new BoM line items once the Job Card has moved past the BoM stage
  if (body.jc_id) {
    const { data: jc } = await supabase.from('job_cards').select('stage').eq('id', body.jc_id).single();
    if (jc && stageIndex(jc.stage) > stageIndex('BoM')) {
      return NextResponse.json(
        { error: 'This Job Card has moved past the BoM stage. Materials can no longer be added.' },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase.from('bom_items').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
