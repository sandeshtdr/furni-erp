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

  // Determine next sequence number for Project ID (still purely sequential)
  const { count } = await supabase
    .from('manufacturing_orders')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1 + 41; // demo data starts at 042; remove +41 once demo seed is cleared
  const project_id = genProjectId(seq);

  // Build MO number from client name: MO-<first 5 letters, uppercase, letters only>-<suffix>
  const clientLetters = (body.client_name || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5)
    .padEnd(5, 'X'); // pad short names (e.g. "Abc" -> "ABCXX") so the format stays consistent

  // Count existing MOs for this same client prefix to pick the next suffix
  const { count: clientCount } = await supabase
    .from('manufacturing_orders')
    .select('*', { count: 'exact', head: true })
    .ilike('mo_number', `MO-${clientLetters}-%`);

  const suffix = String((clientCount || 0) + 1).padStart(2, '0');
  const mo_number = `MO-${clientLetters}-${suffix}`;

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

  // Auto-create blank Job Cards based on num_products
  const numProducts = parseInt(body.num_products, 10) || 0;
  if (numProducts > 0) {
    const newJcs = Array.from({ length: numProducts }, (_, i) => ({
      jc_number: `${project_id}-JC${String(i + 1).padStart(2, '0')}`,
      mo_id: data.id,
      project_id,
      product_name: `Product ${i + 1} (pending details)`,
      stage: 'JC Created',
      status: 'Active',
    }));

    const { error: jcError } = await supabase.from('job_cards').insert(newJcs);

    if (!jcError) {
      await supabase.from('activity_log').insert({
        event_type: 'jc_created',
        description: `${numProducts} Job Card${numProducts > 1 ? 's' : ''} auto-created for ${project_id} (${mo_number})`,
      });
    }
  }

  return NextResponse.json(data);
}