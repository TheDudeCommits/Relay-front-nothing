import type { AxiosInstance } from 'axios';
import { createAuthApi, type AuthApi } from './auth';
import { createDeviceApi, type DeviceApi } from './device';
import { createMeApi, type MeApi } from './me';
import { createBalanceApi, type BalanceApi } from './balance';
import { createDepositAddressesApi, type DepositAddressesApi } from './deposit-addresses';
import { createCardsApi, type CardsApi } from './cards';
import { createTransactionsApi, type TransactionsApi } from './transactions';
import { createKycApi, type KycApi } from './kyc';
import { createAuthorizationsApi, type AuthorizationsApi } from './authorizations';
import { createApiKeysApi, type ApiKeysApi } from './api-keys';
import { createOAuthApi, type OAuthApi } from './oauth';
import { createConfirmationsApi, type ConfirmationsApi } from './confirmations';
import { createAcpApi, type AcpApi } from './acp';

export interface RelayApi {
  auth: AuthApi;
  device: DeviceApi;
  me: MeApi;
  balance: BalanceApi;
  depositAddresses: DepositAddressesApi;
  cards: CardsApi;
  transactions: TransactionsApi;
  kyc: KycApi;
  authorizations: AuthorizationsApi;
  apiKeys: ApiKeysApi;
  oauth: OAuthApi;
  confirmations: ConfirmationsApi;
  acp: AcpApi;
  // Remaining: payments (sessions) — awaiting response-shape doc.
}

export function createRelayApi(http: AxiosInstance): RelayApi {
  return {
    auth: createAuthApi(http),
    device: createDeviceApi(http),
    me: createMeApi(http),
    balance: createBalanceApi(http),
    depositAddresses: createDepositAddressesApi(http),
    cards: createCardsApi(http),
    transactions: createTransactionsApi(http),
    kyc: createKycApi(http),
    authorizations: createAuthorizationsApi(http),
    apiKeys: createApiKeysApi(http),
    oauth: createOAuthApi(http),
    confirmations: createConfirmationsApi(http),
    acp: createAcpApi(http),
  };
}
