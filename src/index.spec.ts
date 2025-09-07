import { jest } from '@jest/globals';
import axios from 'axios';
import {
  GetResponse,
  MembershipBillingInterval,
  MembershipPaymentMethod,
  MembershipRequest,
  MembershipState,
  PostResponse,
} from './types/Membership';
import { main } from './main';

jest.setTimeout(30000);

function setEnvVars() {
  process.env.PORT = '3099';
}

describe('ComponentTests', () => {
  let serverCleanup: () => Promise<void>;

  beforeAll(async () => {
    setEnvVars();
    serverCleanup = await main();
  });

  afterAll(async () => {
    try {
      await serverCleanup();
    } catch {}
  });

  test('create new membership happy flow', async () => {
    // arrange
    const requestObject: MembershipRequest = {
      name: 'Test New Membership',
      userId: 1234567,
      recurringPrice: 789,
      validFrom: '2025-02-01',
      paymentMethod: MembershipPaymentMethod.CREDIT_CARD,
      billingInterval: MembershipBillingInterval.MONTHLY,
      billingPeriods: 9,
    };

    // act
    const legacyResult = await axios({
      method: 'post',
      url: `http://localhost:${process.env.PORT}/legacy/memberships`,
      data: requestObject,
    });

    const modernResult = await axios({
      method: 'post',
      url: `http://localhost:${process.env.PORT}/memberships`,
      data: requestObject,
    });

    const modernResultData: PostResponse = modernResult.data;
    const legacyResultData: PostResponse = legacyResult.data;

    const modernDataWithoutIds = {
      membership: omitFields(modernResultData.membership, ['id', 'uuid']),
      membershipPeriods: modernResultData.membershipPeriods.map((period: any) =>
        omitFields(period, ['id', 'uuid', 'membership']),
      ),
    };

    const legacyDataWithoutIds = {
      membership: omitFields(legacyResultData.membership, ['id', 'uuid']),
      membershipPeriods: legacyResultData.membershipPeriods.map((period: any) =>
        omitFields(period, ['id', 'uuid', 'membership']),
      ),
    };

    const getMembershipsResponse = await axios({
      method: 'get',
      url: `http://localhost:${process.env.PORT}/memberships`,
    });

    // assert
    expect(modernDataWithoutIds).toEqual(legacyDataWithoutIds);
    expect(modernResult.status).toEqual(201);
    expect(modernResultData.membershipPeriods.length).toEqual(9);
    expect(modernDataWithoutIds.membershipPeriods).toEqual(
      legacyDataWithoutIds.membershipPeriods,
    );
    expect(modernResultData.membership.state).toEqual(MembershipState.ACTIVE);
    expect(legacyResultData.membership.name).toEqual('Test New Membership');
    expect(
      getMembershipsResponse.data.some(
        (m) => m.membership.name === 'Test New Membership',
      ),
    ).toBeTruthy();
  });

  test('Error case', async () => {
    // arrange
    let legacyRespone;
    let modernResponse;
    // cash price above 100 should fail
    const requestObject: MembershipRequest = {
      name: 'Test New Membership',
      userId: 1234567,
      recurringPrice: 789,
      validFrom: '2025-02-01',
      paymentMethod: MembershipPaymentMethod.CASH,
      billingInterval: MembershipBillingInterval.MONTHLY,
      billingPeriods: 9,
    };

    // act
    try {
      await axios({
        method: 'post',
        url: `http://localhost:${process.env.PORT}/legacy/memberships`,
        data: requestObject,
      });
      fail('Expected request to throw BadRequestException');
    } catch (error: any) {
      legacyRespone = error;
    }

    try {
      await axios({
        method: 'post',
        url: `http://localhost:${process.env.PORT}/memberships`,
        data: requestObject,
      });
      fail('Expected request to throw BadRequestException');
    } catch (error: any) {
      modernResponse = error;
    }

    // assert
    expect(legacyRespone.status).toEqual(modernResponse.status);
    expect(legacyRespone.response.data.message).toEqual(
      modernResponse.response.data.message,
    );
    expect(modernResponse.status).toBe(400);
    expect(modernResponse.response.data.message).toEqual('cashPriceBelow100');
  });

  test('get memberships', async () => {
    // arrange

    // act
    const legacyResult = await axios({
      method: 'get',
      url: `http://localhost:${process.env.PORT}/legacy/memberships`,
    });

    const modernResult = await axios({
      method: 'get',
      url: `http://localhost:${process.env.PORT}/memberships`,
    });

    const modernResultData: GetResponse = modernResult.data;
    const legacyResultData: GetResponse = legacyResult.data;

    const modernDataWithoutIds = modernResultData.map((item) => {
      return {
        membership: omitFields(item.membership, ['id', 'uuid']),
        periods: item.periods.map((period: any) =>
          omitFields(period, ['id', 'uuid', 'membership']),
        ),
      };
    });

    const legacyDataWithoutIds = legacyResultData.map((item) => {
      return {
        membership: omitFields(item.membership, ['id', 'uuid']),
        periods: item.periods.map((period: any) =>
          omitFields(period, ['id', 'uuid', 'membership']),
        ),
      };
    });

    // assert
    expect(modernDataWithoutIds).toEqual(legacyDataWithoutIds);
    expect(modernResult.status).toEqual(200);
  });

  function omitFields<T>(obj: T, fields: (keyof T)[]): Partial<T> {
    const result = { ...obj };
    fields.forEach((field) => delete result[field]);
    return result;
  }
});
