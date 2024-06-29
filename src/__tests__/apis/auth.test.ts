import { userRoles } from '@/modules/user/user.constant';
import TUser from '@/modules/user/user.types';
import omit from '@/utils/omit';
import { apiTester, apiUrl, expectEnum, types } from '../utils';

const baseUrl = `${apiUrl}/auth`;

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
        status: 400,
        success: false,
        message: /required/i,
        type: /validation error/i,
      };
      // check name validation
      const notNameBody = omit(body, 'name');
      expected.message = /name/i;
      await apiTester({ url, method: 'post', body: notNameBody, expected });

      // check email validation
      const notEmailBody = omit(body, 'email');
      const invalidEmailBody = { ...body, email: 'abraham' };
      expected.message = /email/i;
      await apiTester({ url, method: 'post', body: notEmailBody, expected });
      await apiTester({ url, method: 'post', body: invalidEmailBody, expected });

      // check password validation
      const notPassBody = omit(body, 'password');
      const invalidPassBody = { ...body, password: '123456' };
      expected.message = /password/i;
      await apiTester({ url, method: 'post', body: notPassBody, expected });
      await apiTester({ url, method: 'post', body: invalidPassBody, expected });
    });

    // Register Successful test
    it('Register Successful test with all proper data', async () => {
      const expectedUser: Partial<TUser> = {
        ...body,
        role: 'user',
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };
      delete expectedUser.password;

      const expected = {
        status: 201,
        success: true,
        data: { token: types.string, user: expectedUser },
      };

      const { body: resBody } = await apiTester({ url, method: 'post', body, expected });
      token = resBody.data.token;
    });

    // Duplication errors test
    it('Duplication errors test for Register', async () => {
      const expected = {
        status: 400,
        success: false,
        message: /email/i,
        type: /app error/i,
      };

      await apiTester({ url, method: 'post', body, expected });
    });
  });

  // login api test
  describe(`POST API = ${baseUrl}/login (login)`, () => {
    const url = `${baseUrl}/login`;
    const body = omit(testUser, 'name');

    // login Validation Error test
    it('Validation Error Test for login', async () => {
      const expected = {
        status: 400,
        success: false,
        message: /required/i,
        type: /validation error/i,
      };

      // check email validation
      const notEmailBody = omit(body, 'email');
      const invalidEmailBody = { ...body, email: 'abraham' };
      expected.message = /email/i;
      await apiTester({ url, method: 'post', body: notEmailBody, expected });
      await apiTester({ url, method: 'post', body: invalidEmailBody, expected });

      // check password validation
      const notPassBody = omit(body, 'password');
      const invalidPassBody = { ...body, password: '123456' };
      expected.message = /password/i;
      await apiTester({ url, method: 'post', body: notPassBody, expected });
      await apiTester({ url, method: 'post', body: invalidPassBody, expected });
    });

    // not found user and password not match test
    it('Not found user and password not match test for login', async () => {
      const expected = {
        status: 404,
        success: false,
        message: /not found/i,
        type: /app error/i,
      };

      // not found user test
      const notFoundEmailBody = { ...body, email: 'abraham1@gmail.com' };
      await apiTester({ url, method: 'post', body: notFoundEmailBody, expected });

      // password not matched test
      expected.status = 400;
      expected.message = /password/i;
      const notMatchedPassBody = { ...body, password: '123456@Aa1' };
      await apiTester({ url, method: 'post', body: notMatchedPassBody, expected });
    });

    // login Successful test
    it('login Successful test with all proper data', async () => {
      const expectedUser = {
        name: testUser.name,
        email: body.email,
        role: expectEnum(userRoles),
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };

      const expected = {
        status: 200,
        success: true,
        data: { token: types.string, user: expectedUser },
      };

      const { body: resBody } = await apiTester({ url, method: 'post', body, expected });
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
        status: 401,
        success: false,
        message: /permissions/i,
        type: /unauthorized access/i,
      };

      await apiTester({ url, method: 'post', body, expected });
      // check invalid token validation
      const invalidToken = 'eyJhbGciOiJIUzI';
      await apiTester({ url, method: 'post', body, expected, token: invalidToken });
    });

    // change password Validation Error test
    it('Validation Error Test for change-password', async () => {
      const expected = {
        status: 400,
        success: false,
        message: /required/i,
        type: /validation error/i,
      };

      // check currentPassword validation
      const notCurrPassBody = omit(body, 'currentPassword');
      const invalidCurrPassBody = { ...body, currentPassword: '12345678' };
      expected.message = /currentPassword/i;
      await apiTester({ url, method: 'post', body: notCurrPassBody, expected, token });
      await apiTester({ url, method: 'post', body: invalidCurrPassBody, expected, token });

      // check newPassword validation
      const notNewPassBody = omit(body, 'newPassword');
      const invalidNewPassBody = { ...body, newPassword: '12345678' };
      expected.message = /newPassword/i;
      await apiTester({ url, method: 'post', body: notNewPassBody, expected, token });
      await apiTester({ url, method: 'post', body: invalidNewPassBody, expected, token });

      // check now app errors
      expected.type = /app error/i;

      // check same pass validation
      const samePassBody = { ...body, newPassword: body.currentPassword };
      expected.message = /same/i;
      await apiTester({ url, method: 'post', body: samePassBody, expected, token });

      // password not matched
      expected.status = 400;
      expected.message = /password/i;
      const notMatchPassBody = { ...body, currentPassword: '123456@Aa100' };
      await apiTester({ url, method: 'post', body: notMatchPassBody, expected, token });
    });

    // change password Successful test
    it('change password Successful test with all proper data', async () => {
      const expectedUser = {
        name: testUser.name,
        email: testUser.email,
        role: expectEnum(userRoles),
        _id: types.string,
        createdAt: types.string,
        updatedAt: types.string,
      };

      const expected = {
        status: 200,
        success: true,
        data: expectedUser,
      };

      await apiTester({ url, method: 'post', body, expected, token });
    });
  });
});
