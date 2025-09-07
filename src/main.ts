import { NestFactory } from '@nestjs/core';
import { MembershipModule } from './modern/Membership.module';
import { GlobalExceptionFilter } from './global-exception.filter';
// because of the javascript module, we need to use require to import the legacy routes
// eslint-disable-next-line @typescript-eslint/no-var-requires
const legacyMembershipRoutes = require('./legacy/routes/membership.routes');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

const main = async () => {
  const app = await NestFactory.create(MembershipModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(express.json());
  app.use('/legacy/memberships', legacyMembershipRoutes);
  await app.listen(process.env.APP_PORT || 3099);
  return () => app.close();
};

export { main };
