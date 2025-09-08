import { Module } from '@nestjs/common';
import { MembershipService } from './Membership.service';
import { MembershipController } from './Membership.controller';
import { MembershipCalculator } from '../utils/MembershipCalculator';

@Module({
  providers: [MembershipService, MembershipCalculator],
  controllers: [MembershipController],
})
export class MembershipModule {}
