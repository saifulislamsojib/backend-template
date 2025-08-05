import configs from '@/configs/index.js';
import { ERROR_TYPE, type ErrorType } from '@/errors/error.const.js';
import { userRoles } from '@/modules/user/user.constant.js';
import type { TUser, TUserResponse } from '@/modules/user/user.types.js';
import apiTester from '@/test/apiTester.js';
import { expectEnum, types } from '@/test/utils.js';
import omit from '@/utils/omit.js';
import type { TSuccessResponse } from '@/utils/sendResponse.js';
import status from 'http-status';

type SuccessRes = TSuccessResponse<{ token: string; user: TUser }, AnyObject>;

const baseUrl = `${configs.api_route}/auth` as const;

// test fake user
const testUser = {
  name: 'john abraham',
  email: 'abraham@gmail.com',
  password: '123456@Aa',
};

let token: string;

describe(`Auth apis test, API = ${baseUrl}`, () => {
  // register api test
  describe(`POST API = ${baseUrl}/register (register)`, () => {
    const url = `${baseUrl}/register`;
    const body = testUser;

    // Register Validation Error test
    it('Validation Error Test for register', async () => {
      const expected = {
        status: status.BAD_REQUEST,
        success: false,
        type: ERROR_TYPE.validationError,
      };

      // check name validation
      const notNameBody = omit(body, 'name');
      let resBody = await apiTester({ url, method: 'post', body: notNameBody, expected });
      expect(resBody?.message).toMatch(/name/i);

      // check email validation
      const notEmailBody = omit(body, 'email');
      resBody = await apiTester({ url, method: 'post', body: notEmailBody, expected });
      expect(resBody?.message).toMatch(/email/i);

      const invalidEmailBody = { ...body, email: 'abraham' };
      resBody = await apiTester({ url, method: 'post', body: invalidEmailBody, expected });
      expect(resBody?.message).toMatch(/email/i);

      // check password validation
      const notPassBody = omit(body, 'password');
      resBody = await apiTester({ url, method: 'post', body: notPassBody, expected });
      expect(resBody?.message).toMatch(/password/i);

      const invalidPassBody = { ...body, password: '123456' };
      resBody = await apiTester({ url, method: 'post', body: invalidPassBody, expected });
      expect(resBody?.message).toMatch(/password/i);
    });

    // Register Successful test
    it('Register Successful test with all proper data', async () => {
      const user: Partial<TUserResponse> = {
        ...body,
        role: 'user',
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };
      delete user.password;

      const expected = { status: status.CREATED, success: true };

      const resBody = await apiTester<SuccessRes>({ url, method: 'post', body, expected });
      expect(resBody?.data).toStrictEqual(expect.objectContaining({ token: types.string, user }));
      token = resBody?.data.token;
    });

    // Duplication errors test
    it('Duplication errors test for Register', async () => {
      const expected = { status: status.BAD_REQUEST, success: false, type: ERROR_TYPE.appError };
      const resBody = await apiTester({ url, method: 'post', body, expected });
      expect(resBody?.message).toMatch(/email/i);
    });
  });

  // login api test
  describe(`POST API = ${baseUrl}/login (login)`, () => {
    const url = `${baseUrl}/login`;
    const body = omit(testUser, 'name');

    // login Validation Error test
    it('Validation Error Test for login', async () => {
      const expected = {
        status: status.BAD_REQUEST,
        success: false,
        type: ERROR_TYPE.validationError,
      };

      // check email validation
      const notEmailBody = omit(body, 'email');
      let resBody = await apiTester({ url, method: 'post', body: notEmailBody, expected });
      expect(resBody?.message).toMatch(/email/i);

      const invalidEmailBody = { ...body, email: 'abraham' };
      resBody = await apiTester({ url, method: 'post', body: invalidEmailBody, expected });
      expect(resBody?.message).toMatch(/email/i);

      // check password validation
      const notPassBody = omit(body, 'password');
      resBody = await apiTester({ url, method: 'post', body: notPassBody, expected });
      expect(resBody?.message).toMatch(/password/i);

      const invalidPassBody = { ...body, password: '123456' };
      resBody = await apiTester({ url, method: 'post', body: invalidPassBody, expected });
      expect(resBody?.message).toMatch(/password/i);
    });

    // not found user and password not match test
    it('Not found user and password not match test for login', async () => {
      const expected = {
        status: status.NOT_FOUND as number,
        success: false,
        type: ERROR_TYPE.notFound as ErrorType,
      };

      // not found user test
      const notFoundEmailBody = { ...body, email: 'abraham123@gmail.com' };
      let resBody = await apiTester({ url, method: 'post', body: notFoundEmailBody, expected });
      expect(resBody?.message).toMatch(/not found/i);

      // password not matched test
      expected.type = ERROR_TYPE.appError;
      expected.status = status.BAD_REQUEST;
      const notMatchedPassBody = { ...body, password: '123456@Aa1' };
      resBody = await apiTester({ url, method: 'post', body: notMatchedPassBody, expected });
      expect(resBody?.message).toMatch(/password/i);
    });

    // login Successful test
    it('login Successful test with all proper data', async () => {
      const user = {
        name: testUser.name,
        email: body.email,
        role: expectEnum(userRoles),
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };

      const expected = { status: status.OK, success: true };

      const resBody = await apiTester<SuccessRes>({ url, method: 'post', body, expected });
      expect(resBody?.data).toStrictEqual(expect.objectContaining({ token: types.string, user }));
      token = resBody.data.token;
    });
  });

  // change password api test
  describe(`POST API = ${baseUrl}/change-password (change-password)`, () => {
    const url = `${baseUrl}/change-password`;
    const body = {
      currentPassword: testUser.password,
      newPassword: '123456@Aa500',
    };

    // change password Validation Error test
    it('Authorization Test for change-password', async () => {
      const expected = {
        status: status.UNAUTHORIZED,
        success: false,
        type: ERROR_TYPE.unauthorized,
      };

      let resBody = await apiTester({ url, method: 'post', body, expected });
      expect(resBody?.message).toMatch(/invalid token/i);

      // check invalid token validation
      const invalidToken = 'eyJhbGciOiJIUzI';
      resBody = await apiTester({ url, method: 'post', body, expected, token: invalidToken });
      expect(resBody?.message).toMatch(/invalid token/i);
    });

    // change password Validation Error test
    it('Validation Error Test for change-password', async () => {
      const expected = {
        status: status.BAD_REQUEST,
        success: false,
        type: ERROR_TYPE.validationError as ErrorType,
      };

      // check currentPassword validation
      const notCurrPass = omit(body, 'currentPassword');
      let resBody = await apiTester({ url, method: 'post', body: notCurrPass, expected, token });
      expect(resBody?.message).toMatch(/currentPassword/i);

      const invalidCurrPass = { ...body, currentPassword: '12345678' };
      resBody = await apiTester({ url, method: 'post', body: invalidCurrPass, expected, token });
      expect(resBody?.message).toMatch(/Current Password/i);

      // check newPassword validation
      const notNewPassBody = omit(body, 'newPassword');
      resBody = await apiTester({ url, method: 'post', body: notNewPassBody, expected, token });
      expect(resBody?.message).toMatch(/newPassword/i);

      const invalidNewPassBody = { ...body, newPassword: '12345678' };
      resBody = await apiTester({ url, method: 'post', body: invalidNewPassBody, expected, token });
      expect(resBody?.message).toMatch(/New Password/i);

      // check now app errors
      expected.type = ERROR_TYPE.appError;

      // check same pass validation
      const samePassBody = { ...body, newPassword: body.currentPassword };
      resBody = await apiTester({ url, method: 'post', body: samePassBody, expected, token });
      expect(resBody?.message).toMatch(/same/i);

      // password not matched
      expected.status = status.BAD_REQUEST;
      const notMatchPassBody = { ...body, currentPassword: '123456@Aa100' };
      resBody = await apiTester({ url, method: 'post', body: notMatchPassBody, expected, token });
      expect(resBody?.message).toMatch(/password/i);
    });

    // change password Successful test
    it('change password Successful test with all proper data', async () => {
      const user = {
        name: testUser.name,
        email: testUser.email,
        role: expectEnum(userRoles),
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };

      const expected = { status: status.OK, success: true };

      const resBody = await apiTester<SuccessRes>({ url, method: 'post', body, expected, token });
      expect(resBody?.data).toStrictEqual(expect.objectContaining({ token: types.string, user }));
      token = resBody.data.token;
    });
  });
});
