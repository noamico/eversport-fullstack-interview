import { Injectable } from '@nestjs/common';
import {
  Membership,
  MembershipBillingInterval,
  MembershipRequest,
} from '../types/Membership';
import {
  MembershipPeriod,
  MembershipPeriodState,
} from '../types/MembershipPeriod';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class MembershipCalculator {
  public getNewPeriodIntervalItem(
    initialDate: Date,
    periodIndex: number,
    billingInterval: MembershipBillingInterval,
  ) {
    if (periodIndex === 0) return initialDate;
    const intervalItem = new Date(initialDate); //new Date(validFrom);
    const intervalMap = {
      [MembershipBillingInterval.MONTHLY]: () =>
        intervalItem.setMonth(intervalItem.getMonth() + periodIndex),
      [MembershipBillingInterval.YEARLY]: () =>
        intervalItem.setMonth(intervalItem.getMonth() + periodIndex * 12),
      [MembershipBillingInterval.WEEKLY]: () =>
        intervalItem.setDate(intervalItem.getDate() + periodIndex * 7),
    };
    intervalMap[billingInterval]();
    return intervalItem;
  }

  public getValidationInterval(membership: MembershipRequest) {
    const validFrom = membership.validFrom
      ? new Date(membership.validFrom)
      : new Date();
    const validUntil = new Date(validFrom);
    if (membership.billingInterval === MembershipBillingInterval.MONTHLY) {
      validUntil.setMonth(validFrom.getMonth() + membership.billingPeriods);
    } else if (
      membership.billingInterval === MembershipBillingInterval.YEARLY
    ) {
      validUntil.setMonth(
        validFrom.getMonth() + membership.billingPeriods * 12,
      );
    } else if (
      membership.billingInterval === MembershipBillingInterval.WEEKLY
    ) {
      validUntil.setDate(validFrom.getDate() + membership.billingPeriods * 7);
    }
    return { validFrom, validUntil };
  }

  public getNewMembershipPeriods(
    newMembership: Membership,
    validFrom: Date,
  ): MembershipPeriod[] {
    return Array.from({ length: newMembership.billingPeriods }, (_, index) => {
      const periodStart = this.getNewPeriodIntervalItem(
        validFrom,
        index,
        newMembership.billingInterval,
      );
      const periodEnd = this.getNewPeriodIntervalItem(
        periodStart,
        1,
        newMembership.billingInterval,
      );

      return {
        id: index + 1,
        uuid: uuidv4(),
        membership: newMembership.id,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        state: MembershipPeriodState.PLANNED,
      };
    });
  }
}
