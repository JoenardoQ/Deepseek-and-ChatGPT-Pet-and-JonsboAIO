import { readFileSync } from 'node:fs';

// Wire format changes independently from the release version.
export const PROTOCOL_VERSION = 4;
export const BUILD_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// Source-only maintenance revision; does not change the reviewed art release.
export const BRIDGE_REVISION = 2;
