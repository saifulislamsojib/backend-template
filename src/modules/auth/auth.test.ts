import { ERROR_TYPE, type ErrorType } from '@/errors/error.const';
import { userRoles } from '@/modules/user/user.constant';
import type { TUser, TUserResponse } from '@/modules/user/user.types';
import apiTester from '@/test/apiTester';
import { expectEnum, types } from '@/test/utils';
import omit from '@/utils/omit';
import type { TSuccessResponse } from '@/utils/sendResponse';
import { status } from 'http-status';

type SuccessRes = TSuccessResponse<{ user: TUser }>;
type AppSuccessRes = TSuccessResponse<{ user: TUser; token: string }>;

const baseUrl = '/api/v1/auth';

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
      expect(resBody.message).toMatch(/name/i);

      // check email validation
      const notEmailBody = omit(body, 'email');
      resBody = await apiTester({ url, method: 'post', body: notEmailBody, expected });
      expect(resBody.message).toMatch(/email/i);

      const invalidEmailBody = { ...body, email: 'abraham' };
      resBody = await apiTester({ url, method: 'post', body: invalidEmailBody, expected });
      expect(resBody.message).toMatch(/email/i);

      // check password validation
      const notPassBody = omit(body, 'password');
      resBody = await apiTester({ url, method: 'post', body: notPassBody, expected });
      expect(resBody.message).toMatch(/password/i);

      const invalidPassBody = { ...body, password: '123456' };
      resBody = await apiTester({ url, method: 'post', body: invalidPassBody, expected });
      expect(resBody.message).toMatch(/password/i);
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

      const resBody = await apiTester<SuccessRes>({
        url,
        method: 'post',
        body,
        expected,
        onResponse: (res) => {
          const cookies = res.get('Set-Cookie')!;
          expect(cookies).toBeDefined();
          const [firstCookie] = cookies;
          expect(firstCookie).toMatch(/access-token=/);
          expect(firstCookie).toMatch(/HttpOnly/i);
          const match = firstCookie?.match(/access-token=([^;]+)/);
          if (match) {
            const [, extractedToken] = match;
            token = extractedToken!;
          }
        },
      });
      expect(resBody.data).toStrictEqual({ user });
      expect(resBody.data).not.toHaveProperty('token');
    });

    // Duplication errors test
    it('Duplication errors test for Register', async () => {
      const expected = { status: status.BAD_REQUEST, success: false, type: ERROR_TYPE.appError };
      const resBody = await apiTester({ url, method: 'post', body, expected });
      expect(resBody.message).toMatch(/email/i);
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
      expect(resBody.message).toMatch(/email/i);

      const invalidEmailBody = { ...body, email: 'abraham' };
      resBody = await apiTester({ url, method: 'post', body: invalidEmailBody, expected });
      expect(resBody.message).toMatch(/email/i);

      // check password validation
      const notPassBody = omit(body, 'password');
      resBody = await apiTester({ url, method: 'post', body: notPassBody, expected });
      expect(resBody.message).toMatch(/password/i);

      const invalidPassBody = { ...body, password: '123456' };
      resBody = await apiTester({ url, method: 'post', body: invalidPassBody, expected });
      expect(resBody.message).toMatch(/password/i);
    });

    // not found user and password not match test
    it('Not found user and password not match test for login', async () => {
      const expected = {
        status: status.UNAUTHORIZED,
        success: false,
        type: ERROR_TYPE.unauthorized,
      };

      // not found user test
      const notFoundEmailBody = { ...body, email: 'abraham123@gmail.com' };
      let resBody = await apiTester({ url, method: 'post', body: notFoundEmailBody, expected });
      expect(resBody.message).toMatch(/invalid email or password/i);

      // password not matched test
      const notMatchedPassBody = { ...body, password: '123456@Aa1' };
      resBody = await apiTester({ url, method: 'post', body: notMatchedPassBody, expected });
      expect(resBody.message).toMatch(/invalid email or password/i);
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

      const resBody = await apiTester<SuccessRes>({
        url,
        method: 'post',
        body,
        expected,
        onResponse: (res) => {
          const cookies = res.get('Set-Cookie')!;
          expect(cookies).toBeDefined();
          const [firstCookie] = cookies;
          expect(firstCookie).toMatch(/access-token=/);
          const match = firstCookie?.match(/access-token=([^;]+)/);
          if (match) {
            const [, extractedToken] = match;
            token = extractedToken!;
          }
        },
      });
      expect(resBody.data).toStrictEqual({ user });
      expect(resBody.data).not.toHaveProperty('token');
    });

    it('returns a token to a client with a valid app key', async () => {
      const resBody = await apiTester<AppSuccessRes>({
        url,
        method: 'post',
        body,
        isApp: true,
      });

      expect(resBody.data.token).toStrictEqual(types.string);
      expect(resBody.data.user.email).toBe(body.email);
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
      expect(resBody.message).toMatch(/invalid token/i);

      // check invalid token validation
      const invalidToken = 'eyJhbGciOiJIUzI';
      resBody = await apiTester({ url, method: 'post', body, expected, cookie: invalidToken });
      expect(resBody.message).toMatch(/invalid token/i);
    });

    // change password Validation Error test
    it('Validation Error Test for change-password', async () => {
      const expected = {
        status: status.BAD_REQUEST as 400 | 401,
        success: false,
        type: ERROR_TYPE.validationError as ErrorType,
      };

      // check currentPassword validation
      const notCurrPass = omit(body, 'currentPassword');
      let resBody = await apiTester({
        url,
        method: 'post',
        body: notCurrPass,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/currentPassword/i);

      const invalidCurrPass = { ...body, currentPassword: '12345678' };
      resBody = await apiTester({
        url,
        method: 'post',
        body: invalidCurrPass,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/Current Password/i);

      // check newPassword validation
      const notNewPassBody = omit(body, 'newPassword');
      resBody = await apiTester({
        url,
        method: 'post',
        body: notNewPassBody,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/newPassword/i);

      const invalidNewPassBody = { ...body, newPassword: '12345678' };
      resBody = await apiTester({
        url,
        method: 'post',
        body: invalidNewPassBody,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/New Password/i);

      // check now app errors
      expected.type = ERROR_TYPE.appError;

      // check same pass validation
      const samePassBody = { ...body, newPassword: body.currentPassword };
      resBody = await apiTester({
        url,
        method: 'post',
        body: samePassBody,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/same/i);

      // password not matched
      expected.status = status.UNAUTHORIZED;
      expected.type = ERROR_TYPE.unauthorized;
      const notMatchPassBody = { ...body, currentPassword: '123456@Aa100' };
      resBody = await apiTester({
        url,
        method: 'post',
        body: notMatchPassBody,
        expected,
        cookie: token,
      });
      expect(resBody.message).toMatch(/password/i);
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

      const resBody = await apiTester<SuccessRes>({
        url,
        method: 'post',
        body,
        expected,
        cookie: token,
        onResponse: (res) => {
          const cookies = res.get('Set-Cookie')!;
          expect(cookies).toBeDefined();
          const [firstCookie] = cookies;
          expect(firstCookie).toMatch(/access-token=/);
          const match = firstCookie?.match(/access-token=([^;]+)/);
          if (match) {
            const [, extractedToken] = match;
            token = extractedToken!;
          }
        },
      });
      expect(resBody.data).toStrictEqual({ user });
      expect(resBody.data).not.toHaveProperty('token');
    });
  });

  // current user api test
  describe(`GET API = ${baseUrl}/me (current user)`, () => {
    const url = `${baseUrl}/me`;

    // Authorization test for current user
    it('Authorization Test for current user', async () => {
      const expected = {
        status: status.UNAUTHORIZED,
        success: false,
        type: ERROR_TYPE.unauthorized,
      };

      const resBody = await apiTester({ url, expected });
      expect(resBody.message).toMatch(/invalid token/i);
    });

    // current user Successful test
    it('Current user Successful test with valid token', async () => {
      const expected = { status: status.OK, success: true };

      const resBody = await apiTester<TSuccessResponse<AnyObject>>({
        url,
        expected,
        cookie: token,
      });

      expect(resBody.data).toMatchObject({
        name: testUser.name,
        email: testUser.email,
        role: expectEnum(userRoles),
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      });
      expect(resBody.data).not.toHaveProperty('exp');
      expect(resBody.data).not.toHaveProperty('iat');
    });
  });
});
