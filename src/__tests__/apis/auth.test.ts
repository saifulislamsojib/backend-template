import TUser from '@/modules/user/user.types';
import { apiTester, apiUrl, pick, types } from '../utils';

const baseUrl = `${apiUrl}/auth`;

describe(`Auth apis test, API = ${baseUrl}`, () => {
  // register api test
  const url = `${baseUrl}/register`;
  describe(`POST API = ${url} (register)`, () => {
    const body = {
      name: 'john abraham',
      email: 'abraham@gmail.com',
      password: '123456@Aa',
    };
    it('Register a user with all proper data', async () => {
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

    // Register Validation Error test
    it('Validation Error Test for register', async () => {
      const expected = {
        status: 400,
        success: false,
        message: /required/i,
        type: /validation error/i,
      };
      // check name validation
      const notNameBody = pick(body, 'email', 'password');
      expected.message = /name/i;
      await apiTester({ url, method: 'post', body: notNameBody, expected });

      // check email validation
      const notEmailBody = pick(body, 'name', 'password');
      expected.message = /email/i;
      await apiTester({ url, method: 'post', body: notEmailBody, expected });
      // invalid email
      const invalidEmailBody = { ...body, email: 'abraham' };
      expected.message = /email/i;
      await apiTester({ url, method: 'post', body: invalidEmailBody, expected });

      // check password validation
      const notPassBody = pick(body, 'name', 'email');
      expected.message = /password/i;
      await apiTester({ url, method: 'post', body: notPassBody, expected });
      // invalid password
      const invalidPassBody = { ...body, password: '123456' };
      expected.message = /password/i;
      await apiTester({ url, method: 'post', body: invalidPassBody, expected });
    });
  });
});
