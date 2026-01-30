import { UserButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart3 } from 'lucide-react';
import { hasActiveSubscription } from '../utils/trialTracking';

const TRIAL_REPORT_STORAGE_PREFIX = 'trial_report_';

/**
 * User avatar dropdown menu.
 * Paid users: Dashboard (first), then Manage account, Sign out.
 * Trial users: Trial report (if saved), then Manage account, Sign out.
 */
export default function UserMenu({ afterSignOutUrl = '/login' }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const isPaidUser = hasActiveSubscription(user);
  const savedSessionId = typeof window !== 'undefined' && user?.id
    ? localStorage.getItem(TRIAL_REPORT_STORAGE_PREFIX + user.id)
    : null;
  const trialReportHref = savedSessionId ? `/?report=${savedSessionId}` : null;
  const showTrialReportLink = trialReportHref && !isPaidUser;
  const hasCustomItems = isPaidUser || showTrialReportLink;

  if (!user) return null;

  return (
    <UserButton afterSignOutUrl={afterSignOutUrl}>
      {hasCustomItems && (
        <UserButton.MenuItems>
          {isPaidUser && (
            <UserButton.Action
              label="Dashboard"
              labelIcon={<BarChart3 className="w-4 h-4" />}
              onClick={() => navigate('/dashboard')}
            />
          )}
          {showTrialReportLink && (
            <UserButton.Link
              label="Trial report"
              labelIcon={<FileText className="w-4 h-4" />}
              href={trialReportHref}
            />
          )}
        </UserButton.MenuItems>
      )}
    </UserButton>
  );
}
