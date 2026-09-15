import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import ChallanClient from './ChallanClient';

export default async function InspectorPage() {
  const token = cookies().get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'INSPECTOR') {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, staffId: true, town: true },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="py-6">
      <div className="mb-6 px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">New Challan</h1>
        <p className="text-neutral-500 mt-1">Issue a new digital warning notice for waste management violations.</p>
      </div>
      <ChallanClient user={{ name: user.name, staffId: user.staffId, town: user.town || 'Unassigned' }} />
    </div>
  );
}
