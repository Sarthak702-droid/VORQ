// The previous password-only acceptance runner is superseded by mandatory MFA.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
execFileSync('python3', [fileURLToPath(new URL('../../tests/verify_auth_live.py', import.meta.url))], { stdio: 'inherit' });
