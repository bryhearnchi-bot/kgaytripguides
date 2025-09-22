const email = process.env.ADMIN_EMAIL || 'admin@atlantis.com';
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminHeaders = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json'
};

async function main() {
  // Find user by email
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: adminHeaders
  });
  if (!listRes.ok) {
    console.error('Failed to list users:', listRes.status, await listRes.text());
    process.exit(1);
  }
  const listJson = await listRes.json();
  const user = Array.isArray(listJson.users) ? listJson.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) : listJson.users?.[0] || listJson[0];
  if (!user?.id) {
    console.error('User not found for email:', email, listJson);
    process.exit(1);
  }

  // Update metadata role to super_admin
  const updRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ user_metadata: { role: 'super_admin' } })
  });
  const updText = await updRes.text();
  if (!updRes.ok) {
    console.error('Failed to update user metadata:', updRes.status, updText);
    process.exit(1);
  }
  console.log('Updated user metadata to super_admin for', email);
}

main().catch(e => { console.error(e); process.exit(1); });
