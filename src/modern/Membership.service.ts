import { Injectable } from '@nestjs/common';
import {
  Membership,
  MembershipBillingInterval,
  MembershipRequest,
  MembershipState,
} from '../types/Membership';
import {
  MembershipPeriod,
  MembershipPeriodState,
} from '../types/MembershipPeriod';
import membershipsData from '../data/memberships.json';
import membershipPeriodsData from '../data/membership-periods.json';
import { getResponse, postResponse } from './Membership.controller';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

const memberships = membershipsData as Membership[]; // TODO: get rid of "as"
const membershipPeriods = membershipPeriodsData as MembershipPeriod[]; // TODO: get rid of "as"

@Injectable()
export class MembershipService {
  async addMembership(
    membershipToCreate: MembershipRequest,
  ): Promise<postResponse> {
    const { validFrom, validUntil } =
      this.getValidationInterval(membershipToCreate);
    const newMembership = this.createNewMembershipObj(
      membershipToCreate,
      validFrom,
      validUntil,
    );

    // instead of saving in DB
    memberships.push(newMembership);

    const membershipPeriods = this.getNewMembershipPeriods(
      newMembership,
      validFrom,
    );

    return { membership: newMembership, membershipPeriods };
  }

  async getAllMemberships(): Promise<getResponse> {
    const rows = [];
    for (const membership of memberships) {
      const periods = membershipPeriods.filter(
        (p) => p.membership === membership.id,
      );
      rows.push({ membership, periods });
    }
    return rows;
  }

  private getValidationInterval(membership: MembershipRequest) {
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

  private createNewMembershipObj(
    membershipToCreate: MembershipRequest,
    validFrom: Date,
    validUntil: Date,
  ) {
    let state: MembershipState = MembershipState.ACTIVE;
    if (validFrom > new Date()) {
      state = MembershipState.PENDING;
    }
    if (validUntil < new Date()) {
      state = MembershipState.EXPIRED;
    }

    return {
      id: memberships.length + 1,
      uuid: uuidv4() as string,
      name: membershipToCreate.name,
      state,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      userId: membershipToCreate.userId,
      paymentMethod: membershipToCreate.paymentMethod,
      recurringPrice: membershipToCreate.recurringPrice,
      billingPeriods: membershipToCreate.billingPeriods,
      billingInterval: membershipToCreate.billingInterval,
      assignedBy: membershipToCreate.assignedBy,
    };
  }

  private getNewMembershipPeriods(
    newMembership: Membership,
    validFrom: Date,
  ): MembershipPeriod[] {
    const membershipPeriods = [];
    let periodStart = validFrom;
    for (let i = 0; i < newMembership.billingPeriods; i++) {
      const validFrom = periodStart;
      const validUntil = new Date(validFrom);
      if (newMembership.billingInterval === MembershipBillingInterval.MONTHLY) {
        validUntil.setMonth(validFrom.getMonth() + 1);
      } else if (
        newMembership.billingInterval === MembershipBillingInterval.YEARLY
      ) {
        validUntil.setMonth(validFrom.getMonth() + 12);
      } else if (
        newMembership.billingInterval === MembershipBillingInterval.WEEKLY
      ) {
        validUntil.setDate(validFrom.getDate() + 7);
      }
      const period = {
        id: i + 1,
        uuid: uuidv4(),
        membership: newMembership.id,
        start: validFrom.toISOString(),
        end: validUntil.toISOString(),
        state: MembershipPeriodState.PLANNED,
      };
      membershipPeriods.push(period);
      periodStart = validUntil;
    }
    return membershipPeriods;
  }
}
