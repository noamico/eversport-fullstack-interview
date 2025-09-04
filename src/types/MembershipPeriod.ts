export enum MembershipPeriodState {
  ISSUED = 'issued',
  PLANNED = 'planned',
}

export type MembershipPeriod = {
  id: number;
  uuid: string;
  membership: number;
  start: string; // Date;
  end: string; //Date;
  state: MembershipPeriodState;
};
