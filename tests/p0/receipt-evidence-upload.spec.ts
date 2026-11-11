import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), create: vi.fn(), find: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/prisma', () => ({ prisma: { receiptEvidenceFile: { create: m.create, findFirst: m.find } } }));

import { POST } from '@/app/api/v2/evidence/files/route';
import { GET } from '@/app/api/v2/evidence/files/[fileId]/route';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

describe('private receipt photo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    m.permission.mockResolvedValue(undefined);
    m.create.mockResolvedValue({ id: 'file-1', sha256: 'abc', contentType: 'image/jpeg', byteSize: jpeg.length });
  });

  it('stores a jpeg for the receiving organization and returns no bytes', async () => {
    const body = new FormData();
    body.set('file', new File([jpeg], 'receipt.jpg', { type: 'image/jpeg' }));
    const response = await POST(new Request('https://hotelsvendors.test/api/v2/evidence/files', { method: 'POST', body }));
    expect(response.status).toBe(201);
    const saved = await response.json();
    expect(saved).toEqual({ id: 'file-1', sha256: 'abc', contentType: 'image/jpeg', byteSize: jpeg.length });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'hotel-1', uploadedById: 'receiver-1', contentType: 'image/jpeg' }),
    }));
    expect(JSON.stringify(saved)).not.toContain('bytes');
  });

  it('refuses a department head and a non-image before writing', async () => {
    m.actor.mockResolvedValue({ id: 'dept-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'DEPARTMENT_HEAD' });
    const denied = new FormData();
    denied.set('file', new File([jpeg], 'receipt.jpg', { type: 'image/jpeg' }));
    expect((await POST(new Request('https://hotelsvendors.test/api/v2/evidence/files', { method: 'POST', body: denied }))).status).toBe(403);
    expect(m.create).not.toHaveBeenCalled();

    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    const text = new FormData();
    text.set('file', new File(['hello'], 'note.txt', { type: 'text/plain' }));
    expect((await POST(new Request('https://hotelsvendors.test/api/v2/evidence/files', { method: 'POST', body: text }))).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('returns the photo only to the owning organization', async () => {
    m.find.mockResolvedValue({ bytes: jpeg, contentType: 'image/jpeg' });
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/evidence/files/file-1'), { params: Promise.resolve({ fileId: 'file-1' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toContain('private');
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'file-1', tenantId: 'hotel-1' }) }));
  });
});
