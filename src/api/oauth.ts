import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export interface IssueCodeRequest {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
}

export interface IssueCodeResponse {
  code: string;
}

export interface OAuthApi {
  /** Mint an authorization code after the user consents (§2B). */
  issueCode(body: IssueCodeRequest): Promise<IssueCodeResponse>;
}

export function createOAuthApi(http: AxiosInstance): OAuthApi {
  return {
    async issueCode(body) {
      try {
        const { data } = await http.post<IssueCodeResponse>(
          '/v1/relay/oauth/issue-code',
          body,
        );
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
