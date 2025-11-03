// Stub file to satisfy Metro/@expo/metro-runtime lookups for worklet bytecode.
// Some versions of the Metro runtime (used by Expo + reanimated/worklets)
// expect this file to exist at the project root when symbolication or
// worklet bytecode handling happens. Creating a small stub prevents
// ENOENT errors during bundling/symbolication.

// Intentionally empty. If you need actual bytecode embedding in the future,
// a build step or metro plugin should populate this file.

module.exports = '';
