import { UserButton, useUser } from '@clerk/clerk-react';
import { FileText } from 'lucide-react';

const TRIAL_REPORT_STORAGE_PREFIX = 'trial_report_';

/**
 * User avatar menu with a persistent "Trial report" link when the user has a saved trial report.
 * The link goes to /?report=<sessionId> so their initial trial report is always one click away.
 */
export default function UserMenu({ afterSignOutUrl = '/login' }) {
  const { user } = useUser();
  const savedSessionId = typeof window !== 'undefined' && user?.id
    ? localStorage.getItem(TRIAL_REPORT_STORAGE_PREFIX + user.id)
    : null;
  const trialReportHref = savedSessionId ? `/?report=${savedSessionId}` : null;

  if (!user) return null;

  return (
    <UserButton afterSignOutUrl={afterSignOutUrl}>
      {trialReportHref && (
        <UserButton.MenuItems>
          <UserButton.Link
            label="Trial report"
            labelIcon={<FileText className="w-4 h-4" />}
            href={trialReportHref}
          />
        </UserButton.MenuItems>
      )}
    </UserButton>
  );
}
