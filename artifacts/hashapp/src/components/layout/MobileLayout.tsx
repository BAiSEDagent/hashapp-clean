import { Link, useLocation } from 'wouter';
import { Activity, Bot, ShieldCheck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#000000] w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[430px] bg-background min-h-screen relative flex flex-col shadow-2xl border-x border-border/30">
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
        </main>

        <nav className="absolute bottom-0 w-full h-20 bg-background/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-6 z-50">
          <NavItem href="/money" icon={<DollarSign size={24} />} label="Money" />
          <NavItem href="/" icon={<Activity size={24} />} label="Activity" />
          <NavItem href="/agent" icon={<Bot size={24} />} label="Scout" />
          <NavItem href="/rules" icon={<ShieldCheck size={24} />} label="Rules" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  const [location] = useLocation();
  const isActive = href === '/' ? location === '/' : location.startsWith(href);

  return (
    <Link 
      href={href} 
      data-testid={`nav-${label.toLowerCase()}`}
      className={cn(
        "flex flex-col items-center justify-center w-16 gap-1.5 transition-all duration-200",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        isActive ? "scale-110" : "scale-100"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
