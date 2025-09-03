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
} from '../types/Membership';
import { MembershipPeriod } from '../types/MembershipPeriod';
import { MembershipService } from './Membership.service';

export type postResponse = {
  membership: Membership;
  membershipPeriods: MembershipPeriod[];
};

export type getResponse = {
  membership: Membership;
  periods: MembershipPeriod[];
}[];

//TODO: better if the types would be the same (same name for "membershipPeriods" / "periods"),
// but it has to be exactly the same as the legacy

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('/')
  async createNewMembership(
    @Body(new ValidationPipe()) membershipToCreate: MembershipRequest,
  ): Promise<postResponse> {
    this.validateMembershipData(membershipToCreate);

    return await this.membershipService.addMembership(membershipToCreate);
  }

  @Get('/')
  async getMemberships(): Promise<getResponse> {
    return await this.membershipService.getAllMemberships();
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
}
