import { Bell, LogOut } from 'lucide-react';
import { useLogout } from '../auth/useLogout';
import { Logo } from '../components/brand/Logo';
import { useProfile } from '../features/dashboard/hooks';
import { Overview } from '../features/dashboard/Overview';
import { KycSection } from '../features/dashboard/KycSection';
import { CardsSection } from '../features/dashboard/CardsSection';
import { ActivitySection } from '../features/dashboard/ActivitySection';
import { ConnectedAppsSection } from '../features/connected-apps/ConnectedAppsSection';
import { ApiKeysSection } from '../features/api-keys/ApiKeysSection';
import { ConnectSection } from '../features/connect/ConnectSection';

export function Dashboard() {
  const logout = useLogout();
  const profile = useProfile();
  const displayName = profile.data?.profile_name ?? profile.data?.username;
  const initial = (displayName ?? profile.data?.email ?? 'R').charAt(0).toUpperCase();

  return (
    <div className="relay-bg min-h-dvh">
      {/* Top nav */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5">
          <Logo size={28} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
            >
              <Bell className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className="flex items-center gap-2 rounded-md border border-line py-1 pl-1 pr-2.5">
              {profile.data?.avatar_url ? (
                <img
                  src={profile.data.avatar_url}
                  alt=""
                  className="size-7 rounded-sm object-cover"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-sm bg-surface-2 font-mono text-xs font-medium text-ink">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-40 truncate text-sm text-muted sm:inline">
                {profile.data?.email ?? displayName ?? 'Account'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
              aria-label="Log out"
            >
              <LogOut className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        {/* Greeting */}
        <div className="relay-rise">
          <p className="text-sm text-muted">Welcome back{displayName ? `, ${displayName}` : ''}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Your account
          </h1>
        </div>

        <Overview />
        <KycSection />
        <CardsSection />
        <ConnectSection variant="dashboard" />
        <ConnectedAppsSection />
        <ApiKeysSection />
        <ActivitySection />
      </main>
    </div>
  );
}
