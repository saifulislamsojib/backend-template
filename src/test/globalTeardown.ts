import global from './global';

const globalTeardown = () => {
  return global.__MONGO_INSTANCE.stop();
};

export default globalTeardown;
