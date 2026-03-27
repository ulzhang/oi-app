const {
  withInfoPlist,
  withXcodeProject,
  withPodfile,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withOiEntitlements = (config) => {
  // Add background modes to Info.plist
  config = withInfoPlist(config, (config) => {
    const bgModes = config.modResults.UIBackgroundModes || [];
    if (!bgModes.includes("audio")) {
      bgModes.push("audio");
    }
    if (!bgModes.includes("voip")) {
      bgModes.push("voip");
    }
    config.modResults.UIBackgroundModes = bgModes;

    // Add NSUserActivityTypes for Siri Shortcuts
    const activityTypes = config.modResults.NSUserActivityTypes || [];
    if (!activityTypes.includes("com.oi.walkpip.startPiP")) {
      activityTypes.push("com.oi.walkpip.startPiP");
    }
    config.modResults.NSUserActivityTypes = activityTypes;

    return config;
  });

  // Set deployment target to iOS 16.0 in Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
      }
    }
    return config;
  });

  // Set deployment target in Podfile.properties.json and add pod reference to Podfile
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosDir = path.join(config.modRequest.platformProjectRoot);

      // Update Podfile.properties.json
      const propsPath = path.join(iosDir, "Podfile.properties.json");
      if (fs.existsSync(propsPath)) {
        const props = JSON.parse(fs.readFileSync(propsPath, "utf8"));
        props["ios.deploymentTarget"] = "16.0";
        fs.writeFileSync(propsPath, JSON.stringify(props, null, 2) + "\n");
      }

      // Add local pod to Podfile if not already present
      const podfilePath = path.join(iosDir, "Podfile");
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, "utf8");
        if (!podfile.includes("oi-camera-pip")) {
          podfile = podfile.replace(
            "use_expo_modules!",
            "use_expo_modules!\n\n  # Local native module for camera PiP\n  pod 'oi-camera-pip', :path => '../modules/my-module/ios'"
          );
          fs.writeFileSync(podfilePath, podfile);
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withOiEntitlements;
