import { seedDatabaseIfEmpty } from './seed';

seedDatabaseIfEmpty()
  .then((created) => {
    console.log(created ? 'Seed tamamlandı.' : 'Veritabanı zaten dolu.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
