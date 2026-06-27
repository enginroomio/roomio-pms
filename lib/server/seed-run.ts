import { seedDatabaseIfEmpty } from './seed';
import { seedSecondaryPropertyIfEmpty } from './seed-secondary-property';

seedDatabaseIfEmpty()
  .then(async (created) => {
    await seedSecondaryPropertyIfEmpty();
    console.log(created ? 'Seed tamamlandı.' : 'Veritabanı zaten dolu.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
