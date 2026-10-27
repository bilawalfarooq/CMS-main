import app from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[EduCore Backend] REST API listening on http://localhost:${PORT}`);
  console.log(`[EduCore Backend] Health check available at http://localhost:${PORT}/api/v1/health`);
});
