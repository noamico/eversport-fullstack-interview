import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Membership } from '../types/Membership';

@Controller('membership')
export class MembershipController {
  @Post('/')
  async scrapeOne(
    @Body() body: Membership,
    @Res() response: Response,
  ): Promise<null> {}

  // new api - that returns the new fields
  @Get('')
  async scraping(
    @Body() body: Request,
    @Res() response: Response,
  ): Promise<null> {}
}
