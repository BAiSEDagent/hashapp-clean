import { Link, useLocation } from 'wouter';
import { Activity, Bot, ShieldCheck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { AgentAvatar } from '@/components/AgentAvatar';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const { threads, connectedAgent } = useDemo();
  const hasUnread = threads.some(t =>
    t.messages.some(m => m.role === 'assistant' && !m.read)
  );

  const agentBadge = hasUnread ? (
    <span
      className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full"
      style={{ background: '#7F77DD', border: '1.5px solid hsl(var(--background))' }}
    />
  ) : undefined;

  return (
    <div className="min-h-screen bg-[#000000] w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[430px] bg-background min-h-screen relative flex flex-col shadow-2xl border-x border-white/[0.04]">
        {connectedAgent && (
          <div className="absolute top-12 right-6 z-20">
            <div className="relative">
              <AgentAvatar size="sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
        </main>

        <nav className="absolute bottom-0 w-full h-[72px] bg-background/85 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-6 z-50">
          <NavItem href="/" icon={<DollarSign size={22} />} label="Money" exact />
          <NavItem href="/activity" icon={<Activity size={22} />} label="Activity" />
          <NavItem href="/agent" icon={<Bot size={22} />} label="Agent" badge={agentBadge} />
          <NavItem href="/rules" icon={<ShieldCheck size={22} />} label="Rules" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, badge, exact = false }: { href: string, icon: React.ReactNode, label: string, badge?: React.ReactNode, exact?: boolean }) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);

  return (
    <Link
      href={href}
      data-testid={`nav-${label.toLowerCase()}`}
      className={cn(
        "flex flex-col items-center justify-center w-14 gap-1 transition-all duration-200",
        isActive ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground/80"
      )}
    >
      <div className={cn(
        "relative transition-transform duration-300",
        isActive ? "scale-105" : "scale-100"
      )}>
        {icon}
        {badge}
      </div>
      <span className="text-[9px] font-medium tracking-wider uppercase">{label}</span>
    </Link>
  );
}
