// component/GoogleSignIn.tsx
// "Continue with Google" above a login, sign-up or invitation form (the children).
// - Someone with an account (or an address matching one) is signed in.
// - An invitation is accepted with the Google account (it must be the invited address).
// - Someone new is asked for their company's name first; the form is swapped for that step.
'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { ApiError, type GoogleSignIn as GoogleSignInValues } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useGoAfterSignIn, useGoogleSignInMutation } from '@/lib/auth/session';
import { useIsDesktop } from '@/lib/desktop';
import DesktopGoogleButton from './desktop/DesktopGoogleButton';
import GoogleButton, { GOOGLE_CLIENT_ID } from './GoogleButton';

type Props = {
  /** The email form under "or" (none: Google only). */
  children?: ReactNode;
  /** The login form's "remember me". */
  remember?: boolean;
  /** On the invitation page: join this invitation instead. */
  invitationToken?: string;
  /** The invitation stopped working (used, revoked or expired). */
  onInvitationDead?: () => void;
  /** Instead of going to the app once signed in (the desktop app's browser page). */
  onSignedIn?: () => void;
};

export default function GoogleSignIn(props: Props) {
  // Not set up (no client id): just the form.
  if (!GOOGLE_CLIENT_ID) return <>{props.children}</>;
  return <WithGoogle {...props} />;
}

type NewAccount = { credential: string; email: string; fullName: string };

function WithGoogle({ children, remember = false, invitationToken, onInvitationDead, onSignedIn }: Props) {
  const t = useTranslations('Auth.google');
  const goAfterSignIn = useGoAfterSignIn();
  // The desktop app signs in with Google through the computer's browser instead.
  const isDesktop = useIsDesktop();
  const errorMessage = useApiErrorMessage();
  const signIn = useGoogleSignInMutation();
  const [error, setError] = useState<string | null>(null);
  // Google knows the person but Mizan doesn't: waiting for the company name.
  const [newAccount, setNewAccount] = useState<NewAccount | null>(null);

  async function submit(values: GoogleSignInValues) {
    setError(null);
    try {
      await signIn.mutateAsync(values);
      (onSignedIn ?? goAfterSignIn)();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setError(errorMessage(err));
      } else if (err.code === 'GOOGLE_NO_ACCOUNT') {
        setNewAccount({
          credential: values.credential,
          email: err.details?.email ?? '',
          fullName: err.details?.fullName ?? '',
        });
      } else if (err.code === 'INVALID_INVITATION' && onInvitationDead) {
        onInvitationDead();
      } else if (err.code === 'GOOGLE_EMAIL_MISMATCH') {
        // The address is isolated (FSI…PDI) so it reads left to right inside Arabic text.
        setError(t('emailMismatch', { email: `⁨${err.details?.email ?? ''}⁩` }));
      } else {
        // Google's token lasts an hour: past that, the person signs in with Google again.
        if (err.code === 'GOOGLE_TOKEN_INVALID') setNewAccount(null);
        setError(errorMessage(err));
      }
    }
  }

  if (newAccount) {
    return (
      <CompanyStep
        account={newAccount}
        error={error}
        onBack={() => {
          setNewAccount(null);
          setError(null);
        }}
        onCreate={(companyName) => submit({ credential: newAccount.credential, remember, companyName })}
      />
    );
  }

  return (
    <div className="mt-8">
      <div className="relative">
        {isDesktop ? (
          <DesktopGoogleButton invitationToken={invitationToken} />
        ) : (
          <GoogleButton
            context={invitationToken ? 'use' : 'signin'}
            onCredential={(credential) => submit({ credential, remember, ...(invitationToken ? { invitationToken } : {}) })}
          />
        )}
        {signIn.isPending && (
          <div role="status" className="bg-surface/80 absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold">
            <Loader2 className="size-4 animate-spin" />
            {t('signingIn')}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="bg-danger-soft text-danger rounded-btn mt-3 px-3 py-2.5 text-sm font-semibold">
          {error}
        </p>
      )}
      {children && (
        <>
          <div className="text-muted my-6 flex items-center gap-3 text-xs font-semibold">
            <span className="bg-line h-px flex-1" />
            {t('or')}
            <span className="bg-line h-px flex-1" />
          </div>
          {/* The forms carry their own top margin for when they stand alone. */}
          <div className="[&>form]:mt-0">{children}</div>
        </>
      )}
    </div>
  );
}

/** One step more for someone new: the company they're creating (they'll be its owner). */
function CompanyStep({
  account,
  error,
  onBack,
  onCreate,
}: {
  account: NewAccount;
  error: string | null;
  onBack: () => void;
  onCreate: (companyName: string) => Promise<void>;
}) {
  const t = useTranslations('Auth.google');
  const tRegister = useTranslations('Auth.register');
  const [companyName, setCompanyName] = useState('');
  const [terms, setTerms] = useState(false);
  const [problems, setProblems] = useState<{ company?: string; terms?: string }>({});
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    const name = companyName.trim();
    const found = {
      ...(name ? {} : { company: tRegister('errors.companyRequired') }),
      ...(terms ? {} : { terms: tRegister('errors.termsRequired') }),
    };
    setProblems(found);
    if (found.company || found.terms) return;
    setBusy(true);
    try {
      await onCreate(name);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

  return (
    <form onSubmit={create} className="mt-8 space-y-5" noValidate>
      <div className="bg-brand-soft/60 border-brand/15 rounded-2xl border p-4">
        <p className="text-ink text-base font-extrabold">{t('welcome', { name: account.fullName })}</p>
        <p className="text-body mt-1 text-sm leading-6">
          {t.rich('noAccount', {
            email: account.email,
            b: (chunks) => (
              <b dir="ltr" className="text-ink font-bold">
                {chunks}
              </b>
            ),
          })}
        </p>
        <p className="text-muted mt-2 text-xs leading-5">{t('employeeHint')}</p>
      </div>

      <div>
        <Label htmlFor="google-company" className="text-ink mb-2 text-sm font-bold">
          {tRegister('companyName')}
        </Label>
        <Input
          id="google-company"
          autoComplete="organization"
          autoFocus
          maxLength={150}
          placeholder={tRegister('companyPlaceholder')}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          aria-invalid={!!problems.company}
          className={inputClass}
        />
        {problems.company && (
          <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
            {problems.company}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="google-terms"
            checked={terms}
            onCheckedChange={(checked) => setTerms(checked === true)}
            aria-invalid={!!problems.terms}
          />
          <Label htmlFor="google-terms" className="text-body block text-sm leading-6 font-normal">
            {tRegister.rich('terms', {
              terms: (chunks) => (
                <Link href="/terms" className="text-brand font-bold hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-brand font-bold hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </Label>
        </div>
        {problems.terms && (
          <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
            {problems.terms}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="rounded-btn bg-brand hover:bg-brand/90 h-12 w-full font-bold text-white shadow-sm"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('creating')}
            </>
          ) : (
            t('create')
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy} className="text-muted h-10 text-sm font-bold">
          {t('back')}
        </Button>
      </div>
    </form>
  );
}
