import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const session = vi.hoisted(() => ({ token: null as string | null, isAuthenticated: false, user: null as { role: string } | null }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => session }));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/admin-panel' }),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => <span>{to}:{String(replace)}</span>,
}));

describe('admin route protection', () => {
  beforeEach(() => { session.token = null; session.isAuthenticated = false; session.user = null; });
  const render = () => renderToStaticMarkup(<ProtectedRoute adminOnly><div>Private dashboard</div></ProtectedRoute>);
  it('redirects a logged-out history entry to login without rendering the dashboard', () => {
    expect(render()).toBe('<span>/login:true</span>');
  });
  it('rejects a regular authenticated user', () => {
    session.token = 'test-token'; session.isAuthenticated = true; session.user = { role: 'user' };
    expect(render()).toBe('<span>/explore:true</span>');
  });
  it('renders the dashboard for an authenticated admin', () => {
    session.token = 'test-token'; session.isAuthenticated = true; session.user = { role: 'admin' };
    expect(render()).toBe('<div>Private dashboard</div>');
  });
});
