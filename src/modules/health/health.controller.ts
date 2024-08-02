import packageJson from '@/../package.json';
import catchAsync from '@/utils/catchAsync';

const health = catchAsync((_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is up and running',
    version: packageJson.version,
  });
});

export default health;
