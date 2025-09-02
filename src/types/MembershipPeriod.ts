export enum MembershipPeriodState {
  ISSUED = 'issued',
  PLANNED = 'planned',
}

export type MembershipPeriod = {
  id: number;
  uuid: string;
  membershipId: number;
  start: Date;
  end: Date;
  state: MembershipPeriodState;
};
