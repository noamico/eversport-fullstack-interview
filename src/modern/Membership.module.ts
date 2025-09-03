import { Module } from '@nestjs/common';
import { MembershipService } from './Membership.service';
import { MembershipController } from './Membership.controller';

@Module({
  imports: [], // other modules can be imported here
  providers: [MembershipService],
  controllers: [MembershipController],
})
export class MembershipModule {}
