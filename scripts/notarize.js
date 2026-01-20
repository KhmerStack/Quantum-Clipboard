const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "com.muyleang.quantumclipboard",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  });
};