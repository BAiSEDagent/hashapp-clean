import { Link, useLocation } from 'wouter';
import { Activity, Bot, ShieldCheck, DollarSign } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { cn } from '@/lib/utils';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const { threads } = useDemo();
  const hasUnread = threads.some(thread => thread.messages.some(message => message.role === 'assistant' && !message.read));
  return (
    <div className="min-h-screen bg-[#000000] w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[430px] bg-background min-h-screen relative flex flex-col shadow-2xl border-x border-white/[0.04]">
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
        </main>

        <nav className="absolute bottom-0 w-full h-[72px] bg-background/85 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-6 z-50">
          <NavItem href="/money" icon={<DollarSign size={22} />} label="Money" />
          <NavItem href="/" icon={<Activity size={22} />} label="Activity" />
          <NavItem href="/agent" icon={<Bot size={22} />} label="Scout" badge={hasUnread} />
          <NavItem href="/rules" icon={<ShieldCheck size={22} />} label="Rules" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, badge = false }: { href: string, icon: React.ReactNode, label: string, badge?: boolean }) {
  const [location] = useLocation();
  const isActive = href === '/' ? location === '/' : location.startsWith(href);

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
        "transition-transform duration-300 relative",
        isActive ? "scale-105" : "scale-100"
      )}>
        {icon}
        {badge && (
          <span className="absolute -top-0.5 -right-1.5 w-[7px] h-[7px] rounded-full bg-[#7F77DD] border-[1.5px] border-background" />
        )}
      </div>
      <span className="text-[9px] font-medium tracking-wider uppercase">{label}</span>
    </Link>
  );
}
