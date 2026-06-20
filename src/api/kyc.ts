import type { AxiosInstance } from 'axios';
import { normalizeError, RelayApiError } from './errors';

/** True for the `403 kyc_required` issuance gate (POST /payments/sessions). */
export function isKycRequiredError(e: unknown): boolean {
  return e instanceof RelayApiError && e.status === 403 && /kyc_required/i.test(e.message);
}

export type KycStatus =
  | 'NEW'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DECLINED'
  | 'EXPIRED';

export const KYC_TERMINAL: KycStatus[] = ['APPROVED', 'DECLINED', 'EXPIRED'];

export type KycPictureType = 'document_front' | 'document_back';

/**
 * Local async-push pipeline state, returned alongside the CardsPro status. While
 * the worker pushes a buffered application to CardsPro the verification status
 * reads NEW, so the funnel keys off this instead.
 *   submitted/processing — in flight; failed — the push exhausted retries.
 */
export type KycSubmitStatus = 'draft' | 'submitted' | 'processing' | 'done' | 'failed';

export interface KycRefItem {
  code: string;
  label: string;
}

export interface KycCountry {
  code: string;
  name: string;
}

export interface KycReferences {
  occupations: KycRefItem[];
  documentTypes: KycRefItem[];
  genders: KycRefItem[];
  countries: KycCountry[];
}

export interface KycStartRequest {
  sort?: string;
  callback_url?: string;
}

export interface KycStartResponse {
  uuid: string;
  urlForUser: string;
}

export interface KycStatusResponse {
  status: KycStatus;
  reason: string;
  uuid: string;
  kycExternalUserId: string;
  /** Local push-pipeline state — present once the funnel has buffered data. */
  submitStatus?: KycSubmitStatus;
  /** Failure reason when submitStatus === 'failed'. */
  submitReason?: string;
}

/** The 18 required set-data fields. Coded fields take the code STRING, not free text. */
export interface KycData {
  documentCode: '1' | '2'; // 1 = ID card, 2 = passport
  documentNumber: string;
  documentIssuePlace: string;
  fullName: string;
  fullNameEn: string;
  genderCode: '1' | '2'; // 1 = male, 2 = female
  birthDate: string; // YYYY-MM-DD
  occupationCode: string; // "1".."13"
  nationality: string; // ISO 3166-1 alpha-2, uppercase
  country: string; // ISO 3166-1 alpha-2, uppercase
  province: string;
  addressLine: string;
  addressEn: string;
  city: string;
  postalCode: string;
  areaCode: string; // e.g. "+49"
  phone: string;
  email: string; // max 29 chars
}

export interface KycApi {
  references(): Promise<KycReferences>;
  start(body?: KycStartRequest): Promise<KycStartResponse>;
  setData(uuid: string, data: KycData): Promise<void>;
  uploadPicture(uuid: string, type: KycPictureType, jpeg: Blob): Promise<void>;
  confirm(uuid: string): Promise<{ status: string }>;
  statusByUuid(uuid: string): Promise<KycStatusResponse>;
}

export function createKycApi(http: AxiosInstance): KycApi {
  return {
    async references() {
      try {
        const { data } = await http.get<KycReferences>('/v1/relay/kyc/references');
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async start(body = {}) {
      try {
        const { data } = await http.post<KycStartResponse>('/v1/relay/kyc/start', {
          sort: body.sort ?? '',
          callback_url: body.callback_url ?? '',
        });
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async setData(uuid, payload) {
      try {
        await http.post(`/v1/relay/kyc/${uuid}/data`, payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async uploadPicture(uuid, type, jpeg) {
      try {
        // Raw JPEG bytes in the body — NOT multipart.
        await http.post(`/v1/relay/kyc/${uuid}/picture/${type}`, jpeg, {
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async confirm(uuid) {
      try {
        // Returns { status: 'submitted' } immediately; the worker pushes to
        // CardsPro in the background.
        const { data } = await http.post<{ status: string }>(`/v1/relay/kyc/${uuid}/confirm`);
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async statusByUuid(uuid) {
      try {
        const { data } = await http.get<KycStatusResponse>(
          `/v1/relay/kyc/status-by-uuid/${uuid}`,
        );
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
