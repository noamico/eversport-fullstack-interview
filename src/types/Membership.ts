export enum MembershipState {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum MembershipPaymentMethod {
  CREDIT_CARD = 'credit card',
  CASH = 'cash',
}

export enum MembershipBillingInterval {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export type Membership = {
  name: string;
  userId: number;
  recurringPrice: number;
  validFrom: Date;
  validUntil: Date;
  state: MembershipState;
  paymentMethod?: MembershipPaymentMethod;
  billingInterval: MembershipBillingInterval;
  billingPeriods: number;
};
