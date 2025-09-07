import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  getResponse,
  Membership,
  MembershipBillingInterval,
  MembershipRequest,
  MembershipState,
  PostResponse,
} from '../types/Membership';
import {
  MembershipPeriod,
  MembershipPeriodState,
} from '../types/MembershipPeriod';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class MembershipService implements OnModuleInit {
  private memberships: Membership[] = [];
  private membershipPeriods: MembershipPeriod[] = [];

  constructor() {
    console.log('MembershipService constructor called');
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const membershipsPath = join(process.cwd(), 'src/data/memberships.json');
      const periodsPath = join(
        process.cwd(),
        'src/data/membership-periods.json',
      );

      const [membershipsData, periodsData] = await Promise.all([
        readFile(membershipsPath, 'utf-8'),
        readFile(periodsPath, 'utf-8'),
      ]);

      this.memberships = JSON.parse(membershipsData);
      this.membershipPeriods = JSON.parse(periodsData);
    } catch (error: any) {
      throw new Error(`Failed to load data: ${error.message}`);
    }
  }

  async addMembership(
    membershipToCreate: MembershipRequest,
  ): Promise<PostResponse> {
    const { validFrom, validUntil } =
      this.getValidationInterval(membershipToCreate);
    const newMembership = this.createNewMembershipObj(
      membershipToCreate,
      validFrom,
      validUntil,
    );

    // instead of saving in DB
    this.memberships.push(newMembership);

    const membershipPeriods = this.getNewMembershipPeriods(
      newMembership,
      validFrom,
    );

    return { membership: newMembership, membershipPeriods };
  }

  async getAllMemberships(): Promise<getResponse> {
    const rows = [];
    for (const membership of this.memberships) {
      const periods = this.membershipPeriods.filter(
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
      id: this.memberships.length + 1,
      uuid: uuidv4() as string,
      name: membershipToCreate.name,
      state,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      userId: 2000,
      paymentMethod: membershipToCreate.paymentMethod,
      recurringPrice: membershipToCreate.recurringPrice,
      billingPeriods: membershipToCreate.billingPeriods,
      billingInterval: membershipToCreate.billingInterval,
      assignedBy: membershipToCreate.assignedBy,
    };
  }

  private getNewPeriodIntervalItem(
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

  private getNewMembershipPeriods(
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
