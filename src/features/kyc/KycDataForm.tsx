import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { KycData } from '../../api/kyc';
import { useKycReferences } from './hooks';

// Fallbacks used until the reference endpoint responds (these two lists are
// tiny and fixed). Occupations/countries come from the backend so they always
// match the codes CardsPro expects.
const DOC_TYPE_FALLBACK = [
  { code: '1', label: 'ID card' },
  { code: '2', label: 'Passport' },
];
const GENDER_FALLBACK = [
  { code: '1', label: 'Male' },
  { code: '2', label: 'Female' },
];

type FormState = Record<keyof KycData, string>;

const EMPTY: FormState = {
  documentCode: '2',
  documentNumber: '',
  documentIssuePlace: '',
  fullName: '',
  fullNameEn: '',
  genderCode: '1',
  birthDate: '',
  occupationCode: '1',
  nationality: '',
  country: '',
  province: '',
  addressLine: '',
  addressEn: '',
  city: '',
  postalCode: '',
  areaCode: '',
  phone: '',
  email: '',
};

const inputCls =
  'w-full rounded-md border border-line bg-black/40 px-3 py-2.5 text-sm text-ink placeholder:text-faint focus-visible:border-line-strong focus-visible:outline-none';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-faint">{label}</span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-faint">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface KycDataFormProps {
  defaultEmail?: string;
  pending: boolean;
  error?: string | null;
  onSubmit: (data: KycData) => void;
}

export function KycDataForm({ defaultEmail, pending, error, onSubmit }: KycDataFormProps) {
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    email: (defaultEmail ?? '').slice(0, 29),
  });
  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const refs = useKycReferences();
  const occupations = refs.data?.occupations ?? [];
  const countries = refs.data?.countries ?? [];
  const documentTypes = refs.data?.documentTypes ?? DOC_TYPE_FALLBACK;
  const genders = refs.data?.genders ?? GENDER_FALLBACK;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form as unknown as KycData);
      }}
      className="flex flex-col gap-7"
    >
      <Group title="Document">
        <Field label="Document type">
          <select
            value={form.documentCode}
            onChange={(e) => set('documentCode')(e.target.value)}
            className={inputCls}
          >
            {documentTypes.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Document number">
          <input required value={form.documentNumber} onChange={(e) => set('documentNumber')(e.target.value)} className={inputCls} placeholder="P1234567" />
        </Field>
        <Field label="Place of issue">
          <input required value={form.documentIssuePlace} onChange={(e) => set('documentIssuePlace')(e.target.value)} className={inputCls} placeholder="Berlin" />
        </Field>
      </Group>

      <Group title="Identity">
        <Field label="Full name (original language)">
          <input required value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} className={inputCls} placeholder="Max Mustermann" />
        </Field>
        <Field label="Full name (English)">
          <input required value={form.fullNameEn} onChange={(e) => set('fullNameEn')(e.target.value)} className={inputCls} placeholder="Max Mustermann" />
        </Field>
        <Field label="Gender">
          <select value={form.genderCode} onChange={(e) => set('genderCode')(e.target.value)} className={inputCls}>
            {genders.map((g) => (
              <option key={g.code} value={g.code}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date of birth">
          <input required type="date" value={form.birthDate} onChange={(e) => set('birthDate')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Occupation">
          <select required value={form.occupationCode} onChange={(e) => set('occupationCode')(e.target.value)} className={inputCls}>
            {occupations.length === 0 && <option value="">Loading…</option>}
            {occupations.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nationality">
          <select required value={form.nationality} onChange={(e) => set('nationality')(e.target.value)} className={inputCls}>
            <option value="">Select country…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Group>

      <Group title="Address">
        <Field label="Country of residence">
          <select required value={form.country} onChange={(e) => set('country')(e.target.value)} className={inputCls}>
            <option value="">Select country…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="State / province">
          <input required value={form.province} onChange={(e) => set('province')(e.target.value)} className={inputCls} placeholder="Berlin" />
        </Field>
        <Field label="City">
          <input required value={form.city} onChange={(e) => set('city')(e.target.value)} className={inputCls} placeholder="Berlin" />
        </Field>
        <Field label="Postal code">
          <input required value={form.postalCode} onChange={(e) => set('postalCode')(e.target.value)} className={inputCls} placeholder="10115" />
        </Field>
        <Field label="Address">
          <input required value={form.addressLine} onChange={(e) => set('addressLine')(e.target.value)} className={inputCls} placeholder="Musterstrasse 1" />
        </Field>
        <Field label="Address (English)">
          <input required value={form.addressEn} onChange={(e) => set('addressEn')(e.target.value)} className={inputCls} placeholder="Musterstrasse 1" />
        </Field>
      </Group>

      <Group title="Contact">
        <Field label="Calling code">
          <input required value={form.areaCode} onChange={(e) => set('areaCode')(e.target.value)} className={inputCls} placeholder="+49" />
        </Field>
        <Field label="Phone (without calling code)">
          <input required value={form.phone} onChange={(e) => set('phone')(e.target.value)} className={inputCls} placeholder="1701234567" />
        </Field>
        <Field label="Email (max 29 chars)">
          <input required type="email" maxLength={29} value={form.email} onChange={(e) => set('email')(e.target.value)} className={inputCls} placeholder="max@example.com" />
        </Field>
      </Group>

      {error && (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Continue to documents
      </Button>
    </form>
  );
}
