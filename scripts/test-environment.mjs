// Node's test workers each receive isolated bridge/config storage before imports.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.PET_DATA_DIR = mkdtempSync(join(tmpdir(), 'pet-test-'));
process.env.DSH_HOME = join(process.env.PET_DATA_DIR, 'dsh');
