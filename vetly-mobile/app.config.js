module.exports = ({ config: base }) => ({
  ...base,
  ios: { ...base.ios, ...(process.env.VETLY_IOS_BUNDLE_ID ? {bundleIdentifier:process.env.VETLY_IOS_BUNDLE_ID} : {}) },
  android: { ...base.android, ...(process.env.VETLY_ANDROID_PACKAGE ? {package:process.env.VETLY_ANDROID_PACKAGE} : {}), ...(process.env.GOOGLE_SERVICES_JSON ? {googleServicesFile:process.env.GOOGLE_SERVICES_JSON} : {}) },
  extra: { ...base.extra, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? {eas:{projectId:process.env.EXPO_PUBLIC_EAS_PROJECT_ID}} : {}) },
});
