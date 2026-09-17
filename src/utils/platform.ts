let osName: 'android' | 'ios' | 'web' | 'windows' | 'macos' = 'web';

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require('react-native');
  if (RN && RN.Platform && RN.Platform.OS) {
    osName = RN.Platform.OS;
  }
} catch {
  osName = 'web';
}

export const Platform = {
  OS: osName,
  select<T>(specifics: { [platform: string]: T }): T {
    return specifics[osName] ?? specifics.default;
  },
};
