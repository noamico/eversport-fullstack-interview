import { Module } from '@nestjs/common';
import { MembershipService } from './Membership.service';
import { MembershipController } from './Membership.controller';

@Module({
  providers: [MembershipService],
  controllers: [MembershipController],
})
export class MembershipModule {}
