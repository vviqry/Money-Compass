import { Search, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/AuthContext';

interface HeaderProps {
  onSearchOpen: () => void;
  onQuickAdd: () => void;
}

export function Header({ onSearchOpen, onQuickAdd }: HeaderProps) {
  const { user, signOutUser } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="flex items-center justify-between px-4 md:px-8 h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{greeting} 👋</h2>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="rounded-xl"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Quick add button (desktop) */}
        <Button
          onClick={onQuickAdd}
          size="sm"
          className="hidden md:flex rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-1.5 shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Quick Add
        </Button>

        {/* User avatar + sign out */}
        {user && (
          <div className="flex items-center gap-1.5 pl-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="w-8 h-8 rounded-full border border-border/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-600">
                {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOutUser}
              className="rounded-xl text-muted-foreground hover:text-foreground"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
