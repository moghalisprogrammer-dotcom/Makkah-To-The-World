// Print the current approved agenda and matching discovery poster.
import './build-themed-print.mjs';
import { execFileSync } from 'node:child_process';
execFileSync('python', ['scripts/finalize-print.py'], { stdio: 'inherit' });
