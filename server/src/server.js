require('dotenv').config();
const app = require('./app');
const { startScheduler } = require('./scheduler');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PataPlan API running on port ${PORT}`);
  startScheduler();
});
