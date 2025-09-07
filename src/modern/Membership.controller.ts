import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  getResponse,
  MembershipBillingInterval,
  MembershipPaymentMethod,
  MembershipRequest,
  PostResponse,
} from '../types/Membership';
import { MembershipService } from './Membership.service';

@Controller('memberships')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Post()
  async createNewMembership(
    @Body(new ValidationPipe()) membershipToCreate: MembershipRequest,
  ): Promise<PostResponse> {
    this.validateMembershipData(membershipToCreate);

    return await this.membershipService.addMembership(membershipToCreate);
  }

  @Get()
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
