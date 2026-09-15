import Shell from '@/components/Shell';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="inspector">{children}</Shell>;
}
