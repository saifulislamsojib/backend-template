import TUser from '@/modules/user/user.types';
import omit from '@/utils/omit';
import { apiTester, apiUrl, types } from '../utils';

const baseUrl = `${apiUrl}/auth`;

describe(`Auth apis test, API = ${baseUrl}`, () => {
  // register api test
  describe(`POST API = ${baseUrl}/register (register)`, () => {
    const url = `${baseUrl}/register`;
    const body = {
      name: 'john abraham',
      email: 'abraham@gmail.com',
      password: '123456@Aa',
    };

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

      await apiTester({ url, method: 'post', body, expected });
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
    const body = {
      email: 'abraham@gmail.com',
      password: '123456@Aa',
    };

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
  });
});
