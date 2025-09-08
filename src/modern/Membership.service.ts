import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  GetResponse,
  Membership,
  MembershipRequest,
  MembershipState,
  PostResponse,
} from '../types/Membership';
import {
  MembershipPeriod,
  MembershipPeriodState,
} from '../types/MembershipPeriod';
import { MembershipCalculator } from '../utils/MembershipCalculator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class MembershipService implements OnModuleInit {
  private memberships: Membership[] = [];
  private membershipPeriods: MembershipPeriod[] = [];

  constructor(private membershipCalculator: MembershipCalculator) {}

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
      this.membershipCalculator.getValidationInterval(membershipToCreate);
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

  async getAllMemberships(): Promise<GetResponse> {
    const rows = [];
    for (const membership of this.memberships) {
      const periods = this.membershipPeriods.filter(
        (p) => p.membership === membership.id,
      );
      rows.push({ membership, periods });
    }
    return rows;
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

  private getNewMembershipPeriods(
    newMembership: Membership,
    validFrom: Date,
  ): MembershipPeriod[] {
    return Array.from({ length: newMembership.billingPeriods }, (_, index) => {
      const periodStart = this.membershipCalculator.getNewPeriodIntervalItem(
        validFrom,
        index,
        newMembership.billingInterval,
      );
      const periodEnd = this.membershipCalculator.getNewPeriodIntervalItem(
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
