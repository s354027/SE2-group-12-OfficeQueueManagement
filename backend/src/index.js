import { createApp } from './app.js';
import { createSeededOffice } from './seedOffice.js';

const port = 3001;

const officeQueueManagement = createSeededOffice();
const app = createApp(officeQueueManagement);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});