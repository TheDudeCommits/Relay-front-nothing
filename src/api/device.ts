import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export type DeviceStatus = 'pending' | 'approved' | 'denied' | 'consumed';

export interface DeviceLookupResponse {
  client_name: string;
  status: DeviceStatus;
  expires_at: string;
  is_expired: boolean;
}

export interface DeviceApi {
  /** Public — look up a device authorization request by its user_code. */
  lookup(userCode: string): Promise<DeviceLookupResponse>;
  /** Bearer — approve the request for the authenticated user. */
  approve(userCode: string): Promise<void>;
  /** Bearer — deny the request. */
  deny(userCode: string): Promise<void>;
}

export function createDeviceApi(http: AxiosInstance): DeviceApi {
  return {
    async lookup(userCode) {
      try {
        const { data } = await http.post<DeviceLookupResponse>(
          '/v1/relay/device/lookup',
          { user_code: userCode },
        );
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async approve(userCode) {
      try {
        await http.post('/v1/relay/device/approve', { user_code: userCode });
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async deny(userCode) {
      try {
        await http.post('/v1/relay/device/deny', { user_code: userCode });
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
