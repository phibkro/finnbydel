# Patches

`bun patch` files that `bun install` applies, listed under `patchedDependencies` in `package.json`.

## `alchemy@2.0.0-beta.84.patch` (temporary)

**Drop at alchemy 2.0.0-beta.85**: delete the patch file, this entry and the `patchedDependencies` line, then bump Alchemy as usual.

Effect 4.1.0 replaced the `effect/Crypto` module with per-family services under `effect/crypto/*` and no longer includes crypto in the platform `*Services` layers ([Effect-TS/effect@8f23668](https://github.com/Effect-TS/effect/commit/8f236683ad92bc4b4f58e16e91d40ce713c20578)). Alchemy 2.0.0-beta.84 still imports `effect/Crypto`, so under Effect 4.1 the CLI (`alchemy dev`, `plan`, `deploy`) fails when it loads, while type checks with `skipLibCheck` still pass.

The patch backports the `packages/alchemy` part of [alchemy-run/alchemy@9d0709d](https://github.com/alchemy-run/alchemy/commit/9d0709d22af080035dce48856b3c31cfc43bd938) (`fix: support effect 4.1 (#2754)`), which is on Alchemy's main but not in a release yet:

- `src/Auth/OAuthFlow.ts`: OAuth state and PKCE use `SecureRandom` and `Digest` (`Digest.sha256`), and `OAuthCryptoError` is removed, as upstream does.
- `src/Stack.ts`: `StackServices` names `Digest | SecureRandom` instead of `Crypto`.
- `src/Util/PlatformServices.ts`: provides `SecureRandom.layerWebCrypto` and `Digest.layerWebCrypto` beside the Bun or Node services.
- `lib/`: the compiled JavaScript of those files, and the emitted declarations that named `import("effect/Crypto").Crypto`.

Alchemy resolves `src/` under the `bun` export condition and `lib/` otherwise, so both are patched. No other installed `alchemy` or `@alchemy.run/*` package uses an Effect API that 4.1 removed.

To change it: `bun patch alchemy@2.0.0-beta.84`, edit `node_modules/alchemy`, then `bun patch --commit node_modules/alchemy` (with Bun 1.3.13, so `bun.lock` stays at `lockfileVersion: 1`).
