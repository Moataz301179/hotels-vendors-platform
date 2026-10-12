'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/v2-http';

const categories = [
  ['F_AND_B', 'Food & beverage'],
  ['CONSUMABLES', 'Consumables'],
  ['GUEST_SUPPLIES', 'Guest supplies'],
  ['FFE', 'Furniture, fixtures & equipment'],
  ['SERVICES', 'Services'],
] as const;

type Department = { id: string; name: string; code: string; categoryAccess: { id: string; category: string; revokedAt: string | null }[] };
type Policy = { id: string; departmentId: string | null; primaryApproverId: string; secondaryApproverId: string | null };
type Grant = { id: string; revokedAt: string | null; userId: string; permissionId: string; user?: { email?: string | null }; permission?: { code?: string | null } };

export function AdminControls() {
  const [departments, setDepartments] = useState<Department[]>([]), [policies, setPolicies] = useState<Policy[]>([]), [grants, setGrants] = useState<Grant[]>([]), [message, setMessage] = useState('');
  const [department, setDepartment] = useState({ name: '', code: '' });
  const [policy, setPolicy] = useState({ departmentId: '', primaryApproverId: '', secondaryApproverId: '', minAmount: '', maxAmount: '' });
  const [grant, setGrant] = useState({ userId: '', permissionCode: '' });

  async function fetchControls() {
    const [d, p, g] = await Promise.all([
      requestJson<{ departments: Department[] }>('/api/v2/admin/departments'),
      requestJson<{ policies: Policy[] }>('/api/v2/admin/procurement-approval-policies'),
      requestJson<{ grants: Grant[] }>('/api/v2/admin/user-permissions'),
    ]);
    return { departments: d.departments ?? [], policies: p.policies ?? [], grants: g.grants ?? [] };
  }
  async function load() { const controls = await fetchControls(); setDepartments(controls.departments); setPolicies(controls.policies); setGrants(controls.grants); }
  useEffect(() => { let mounted = true; void fetchControls().then(controls => { if (mounted) { setDepartments(controls.departments); setPolicies(controls.policies); setGrants(controls.grants); } }).catch(e => { if (mounted) setMessage(e instanceof Error ? e.message : 'Unable to load controls.'); }); return () => { mounted = false; }; }, []);

  async function saveDepartment(e: FormEvent) {
    e.preventDefault();
    try { await requestJson('/api/v2/admin/departments', { method: 'POST', body: JSON.stringify(department) }); setDepartment({ name: '', code: '' }); setMessage('Department saved.'); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save department.'); }
  }

  async function updateCategories(dept: Department, selected: string[]) {
    try {
      await requestJson('/api/v2/admin/department-category-access', { method: 'POST', body: JSON.stringify({ departmentId: dept.id, categories: selected }) });
      const selectedSet = new Set(selected);
      await Promise.all(dept.categoryAccess.filter(access => !access.revokedAt && !selectedSet.has(access.category)).map(access => requestJson('/api/v2/admin/department-category-access', { method: 'DELETE', body: JSON.stringify({ id: access.id }) })));
      setMessage(`${dept.name} category access updated.`); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update category access.'); }
  }

  async function savePolicy(e: FormEvent) { e.preventDefault(); try { await requestJson('/api/v2/admin/procurement-approval-policies', { method: 'POST', body: JSON.stringify({ ...policy, departmentId: policy.departmentId || null, minAmount: policy.minAmount || null, maxAmount: policy.maxAmount || null }) }); setMessage('Approval policy saved.'); setPolicy({ departmentId: '', primaryApproverId: '', secondaryApproverId: '', minAmount: '', maxAmount: '' }); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save policy.'); } }
  async function saveGrant(e: FormEvent) { e.preventDefault(); try { await requestJson('/api/v2/admin/user-permissions', { method: 'POST', body: JSON.stringify(grant) }); setMessage('Delegated permission saved and audited.'); setGrant({ userId: '', permissionCode: '' }); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save permission.'); } }
  async function revokeGrant(id: string) { try { await requestJson('/api/v2/admin/user-permissions', { method: 'DELETE', body: JSON.stringify({ grantId: id }) }); setMessage('Delegated permission revoked and audited.'); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to revoke permission.'); } }

  return <>
    <section className="card" style={{ padding: 24, marginTop: 24 }}><h2>Departments and catalog access</h2><p className="muted">Create departments and choose which catalog categories their employees can browse. Removing a category is recorded as an immutable revocation.</p>
      <form onSubmit={saveDepartment} className="workspace-form"><label>Department name<input required maxLength={80} placeholder="Food & beverage" value={department.name} onChange={e => setDepartment({ ...department, name: e.target.value })} /></label><label>Department code<input required maxLength={24} placeholder="FNB" value={department.code} onChange={e => setDepartment({ ...department, code: e.target.value.toUpperCase() })} /></label><button className="btn btn-blue">Add department</button></form>
      {departments.length === 0 && <p className="workspace-empty" style={{ marginTop: 18 }}>No departments yet. Add one, then select the catalog categories it can access.</p>}
      {departments.map(dept => { const active = new Set(dept.categoryAccess.filter(access => !access.revokedAt).map(access => access.category)); return <div key={dept.id} style={{ paddingBlock: 18, borderTop: '1px solid var(--line)' }}><div><strong>{dept.name}</strong><span className="muted"> · {dept.code}</span></div><p className="muted" style={{ margin: '6px 0 10px' }}>{active.size ? `${active.size} of ${categories.length} catalog categories allowed` : 'No catalog categories allowed (deny by default)'}</p><fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="sr-only">Allowed catalog categories for {dept.name}</legend><div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{categories.map(([value, label]) => <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" aria-label={`${label} for ${dept.name}`} checked={active.has(value)} onChange={e => { const next = new Set(active); if (e.target.checked) next.add(value); else next.delete(value); void updateCategories(dept, [...next]); }} />{label}</label>)}</div></fieldset></div>; })}
    </section>
    <section className="card" style={{ padding: 24, marginTop: 24 }}><h2>Approval policies</h2><p className="muted">Configure department and amount-based approval routing.</p><form onSubmit={savePolicy} className="workspace-form"><label>Department ID<input value={policy.departmentId} onChange={e => setPolicy({ ...policy, departmentId: e.target.value })} /></label><label>Primary approver ID<input required value={policy.primaryApproverId} onChange={e => setPolicy({ ...policy, primaryApproverId: e.target.value })} /></label><label>Secondary approver ID<input value={policy.secondaryApproverId} onChange={e => setPolicy({ ...policy, secondaryApproverId: e.target.value })} /></label><label>Minimum amount<input inputMode="decimal" value={policy.minAmount} onChange={e => setPolicy({ ...policy, minAmount: e.target.value })} /></label><label>Maximum amount<input inputMode="decimal" value={policy.maxAmount} onChange={e => setPolicy({ ...policy, maxAmount: e.target.value })} /></label><button className="btn btn-blue">Save approval policy</button></form>{policies.map(p => <p key={p.id} className="muted">{p.departmentId ?? 'All departments'} · {p.primaryApproverId}{p.secondaryApproverId ? ` + ${p.secondaryApproverId}` : ''}</p>)}</section>
    <section className="card" style={{ padding: 24, marginTop: 16 }}><h2>Delegated permissions</h2><p className="muted">Grant a specific permission to a user without changing their base role. Grants are tenant-scoped, auditable and reversible.</p><form onSubmit={saveGrant} className="workspace-form"><label>User ID <span className="muted">(database user ID)</span><input required placeholder="usr_…" value={grant.userId} onChange={e => setGrant({ ...grant, userId: e.target.value })} /></label><label>Permission code<input required list="permission-codes" placeholder="order:approve" value={grant.permissionCode} onChange={e => setGrant({ ...grant, permissionCode: e.target.value })} /></label><datalist id="permission-codes"><option value="department:manage" /><option value="order:approve" /><option value="order:create" /><option value="catalog:manage" /><option value="rfq:respond" /></datalist><button className="btn btn-blue">Grant permission</button></form>{grants.filter(g => !g.revokedAt).length === 0 && <p className="workspace-empty" style={{ marginTop: 18 }}>No active delegated permissions.</p>}<div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{grants.filter(g => !g.revokedAt).map(g => <div key={g.id} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 10 }}><span className="muted">{g.user?.email ?? g.userId} · {g.permission?.code ?? g.permissionId}</span><button type="button" className="btn btn-ghost" onClick={() => void revokeGrant(g.id)}>Revoke</button></div>)}</div>{message && <p className="workspace-status" role="status">{message}</p>}</section>
  </>;
}
