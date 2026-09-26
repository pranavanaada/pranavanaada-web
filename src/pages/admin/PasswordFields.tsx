const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold';

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or null when the new password is acceptable. */
export function passwordProblem(password: string, confirm: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}

/** New password + confirm inputs, shared by reset-password and settings. */
export default function PasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
}) {
  return (
    <>
      <label className="block text-xs text-cream/50 mb-1">New password</label>
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(e) => onPassword(e.target.value)}
        className={`${inputClass} mb-4`}
      />
      <label className="block text-xs text-cream/50 mb-1">Confirm new password</label>
      <input
        required
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => onConfirm(e.target.value)}
        className={`${inputClass} mb-5`}
      />
    </>
  );
}
