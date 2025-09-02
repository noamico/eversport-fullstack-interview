import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  Membership,
  MembershipBillingInterval,
  MembershipPaymentMethod,
  MembershipRequest,
  MembershipState,
} from '../types/Membership';
import {
  MembershipPeriod,
  MembershipPeriodState,
} from '../types/MembershipPeriod';
import membershipsData from '../data/memberships.json';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

const memberships: Membership[] = membershipsData as Membership[];

@Controller('membership')
export class MembershipController {
  @Post('/')
  async createNewMembership(
    @Body(new ValidationPipe()) membershipToCreate: MembershipRequest,
  ): Promise<{
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  }> {
    this.validateMembershipData(membershipToCreate);

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

  @Get('/')
  async getMemberships(): Promise<Membership[]> {
    return memberships;
  }

  private validateMembershipData(membership: MembershipRequest) {
    if (
      membership.recurringPrice > 100 &&
      membership.paymentMethod === MembershipPaymentMethod.CASH
    ) {
      throw new BadRequestException('cashPriceBelow100');
    }
    if (membership.billingInterval === MembershipBillingInterval.MONTHLY) {
      if (membership.billingPeriods > 12) {
        throw new BadRequestException('billingPeriodsMoreThan12Months');
      }
      if (membership.billingPeriods < 6) {
        throw new BadRequestException('billingPeriodsLessThan6Months');
      }
    } else if (
      membership.billingInterval === MembershipBillingInterval.YEARLY
    ) {
      if (membership.billingPeriods > 3) {
        if (membership.billingPeriods > 10) {
          throw new BadRequestException('billingPeriodsMoreThan10Years');
        } else {
          throw new BadRequestException('billingPeriodsLessThan3Years');
        }
      }
    } else {
      throw new BadRequestException('invalidBillingPeriods');
    }
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
        membershipId: newMembership.id,
        start: validFrom,
        end: validUntil,
        state: MembershipPeriodState.PLANNED,
      };
      membershipPeriods.push(period);
      periodStart = validUntil;
    }
    return membershipPeriods;
  }
}
