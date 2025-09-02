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
  id: number;
  uuid: string;
  name: string;
  userId: number;
  recurringPrice: number;
  validFrom: string;
  validUntil: string;
  state: MembershipState;
  paymentMethod?: MembershipPaymentMethod;
  billingInterval: MembershipBillingInterval;
  billingPeriods: number;
  assignedBy: string;
};

export type MembershipRequest = Omit<
  Membership,
  'id' | 'uuid' | 'validUntil' | 'state'
>;
