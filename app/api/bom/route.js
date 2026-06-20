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

export async function POST(req) {
  const body = await req.json();
  const { data, error } = await supabase.from('bom_items').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
