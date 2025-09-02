import express from 'express';
import membershipRoutes from './modern/routes/membership.routes';
import { errorHandler } from './error-handler.middleware';

// because of the javascript module, we need to use require to import the legacy routes
const legacyMembershipRoutes = require('./legacy/routes/membership.routes');

import { NestFactory } from '@nestjs/core';
import { MembershipModule } from './modern/Membership.module';

// const app = express()
const port = 3099;
//
// app.use(express.json())
// app.use('/memberships', membershipRoutes);
// app.use('/legacy/memberships', legacyMembershipRoutes);
// app.use(errorHandler);
//
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`)
// })

(async () => {
  const http = await NestFactory.create(MembershipModule);
  await http.listen(port);
  return () => http.close();
})();
