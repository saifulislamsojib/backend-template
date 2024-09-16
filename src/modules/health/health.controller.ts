import packageJson from '@/../package.json';
import catchAsync from '@/utils/catchAsync';
import { OK } from 'http-status';

const health = catchAsync((_req, res) => {
  return res.status(OK).json({
    success: true,
    statusCode: OK,
    message: 'Server is up and running',
    version: packageJson.version,
  });
});

export default health;
