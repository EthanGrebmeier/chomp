// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_bent_justin_hammer.sql';
import m0001 from './0001_thin_shatterstar.sql';
import m0002 from './0002_fluffy_amazoness.sql';
import m0003 from './0003_nappy_shadowcat.sql';
import m0004 from './0004_complete_mandrill.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004
    }
  }
  