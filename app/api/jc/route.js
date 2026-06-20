import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('job_cards')
    .select('*, manufacturing_orders(client_name, mo_number)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  // body: { mo_id, project_id, product_name, drawing_ref, target_completion }

  const { count } = await supabase
    .from('job_cards')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', body.project_id);

  const seq = (count || 0) + 1;
  const jc_number = `${body.project_id}-JC${String(seq).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('job_cards')
    .insert({
      jc_number,
      mo_id: body.mo_id,
      project_id: body.project_id,
      product_name: body.product_name,
      drawing_ref: body.drawing_ref || null,
      target_completion: body.target_completion || null,
      stage: 'JC Created',
      status: 'Active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    event_type: 'jc_created',
    description: `${jc_number} created for ${body.product_name}`,
    jc_id: data.id,
  });

  return NextResponse.json(data);
}
