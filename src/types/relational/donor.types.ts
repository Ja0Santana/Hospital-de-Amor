export type DonationPaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BOLETO'
  | 'CRYPTO';

export type DonationStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type DonationType = 'SINGLE' | 'RECURRING';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type LoyaltyTierLevel =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND';

export type LoyaltyTransactionType =
  | 'EARNED_FROM_DONATION'
  | 'REDEEMED_REWARD'
  | 'EXPIRED'
  | 'MANUAL_ADJUSTMENT';

export type TaxIncentiveFund = 'PRONON' | 'FIA' | 'ELDERLY';

export type CorporateProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONFIRMED';

export type RepresentativePermission = 'ADMIN' | 'VIEWER';

export interface DonorProfile {
  userId: string;
  isAnonymousDefault: boolean;
  referredByDonorUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringSubscription {
  id: string;
  donorUserId: string;
  amount: number;
  targetProjectId?: string;
  status: SubscriptionStatus;
  cardMaskedNumber: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  donorUserId: string;
  subscriptionId?: string;
  amount: number;
  paymentMethod: DonationPaymentMethod;
  status: DonationStatus;
  donationType: DonationType;
  transactionHash: string;
  gatewayTransactionId?: string;
  failureReason?: string;
  taxReceiptNumber?: string;
  targetProjectId?: string;
  endToEndId?: string;
  pixCopiaECola?: string;
  pixExpiresAt?: string;
  boletoBarcode?: string;
  boletoDueDate?: string;
  cryptoWalletAddress?: string;
  cryptoTransactionNetwork?: string;
  cryptoAmount?: number;
  exchangeRateBrl?: number;
  quoteExpiresAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface DonorLoyaltyAccount {
  donorUserId: string;
  currentPointsBalance: number;
  lifetimeAccumulatedPoints: number;
  loyaltyTier: LoyaltyTierLevel;
  prestigeLevel: number;
  pointsExpiresAt?: string;
  updatedAt: string;
}

export interface LoyaltyPointsTransaction {
  id: string;
  donorUserId: string;
  donationId?: string;
  rewardRedemptionId?: string;
  pointsDelta: number;
  transactionType: LoyaltyTransactionType;
  balanceAfterTransaction: number;
  createdAt: string;
}

export interface LoyaltyBadgeCatalog {
  id: string;
  name: string;
  description: string;
  costPoints: number;
  minimumTierRequired: LoyaltyTierLevel;
  isActive: boolean;
}

export interface RedeemedLoyaltyReward {
  id: string;
  donorUserId: string;
  badgeId: string;
  costPointsPaid: number;
  prestigeAtAcquisition: number;
  voucherCode: string;
  voucherHash: string;
  redeemedAt: string;
}

export interface SupportMessage {
  id: string;
  donorUserId: string;
  messageText: string;
  isPublicDisplayAuthorized: boolean;
  isApprovedByModerator: boolean;
  moderatedByStaffUserId?: string;
  moderatedAt?: string;
  createdAt: string;
}

export interface CorporateSponsor {
  cnpj: string;
  companyName: string;
  tradeName: string;
  contactName: string;
  email: string;
  phone: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateProposal {
  id: string;
  corporateCnpj: string;
  intentAmount: number;
  taxIncentiveFund: TaxIncentiveFund;
  status: CorporateProposalStatus;
  contractDueDate?: string;
  hasSocialSealIssued: boolean;
  socialSealExpiresAt?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateRepresentative {
  id: string;
  corporateCnpj: string;
  representativeUserId?: string;
  cpf?: string;
  name: string;
  email: string;
  roleDescription: string;
  permissionLevel: RepresentativePermission;
  createdAt: string;
}
