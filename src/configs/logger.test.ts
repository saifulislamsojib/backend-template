import logger from './logger';

describe('logger configuration', () => {
  it('is defined and has level logging functions', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });

  it('formats log messages without throwing', () => {
    expect(() => {
      logger.info(
        {
          userEmail: 'sensitive@example.com',
          password: 'supersecretpassword',
          req: { headers: { authorization: 'Bearer secret' } },
        },
        'Test log message with sensitive data',
      );
    }).not.toThrow();
  });
});
