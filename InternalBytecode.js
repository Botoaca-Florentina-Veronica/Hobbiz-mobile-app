// Stub file to satisfy Metro/@expo/metro-runtime lookups for worklet bytecode.
// Some versions of the Metro runtime (used by Expo + reanimated/worklets)
// expect this file to exist at the project root when symbolication or
// worklet bytecode handling happens. Creating a small stub prevents
// ENOENT errors during bundling/symbolication.

// Intentionally empty string export. CommonJS is used because Metro
// may `require` this file in some runtime paths.
module.exports = "";
