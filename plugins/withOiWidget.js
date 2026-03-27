const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const WIDGET_NAME = "OiWidget";

function withOiWidget(config) {
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;
      const bundleId = config.ios?.bundleIdentifier || "com.oi.walkpip";
      const widgetDir = path.join(iosDir, WIDGET_NAME);

      // Create widget directory
      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true });
      }

      // Copy widget Swift source
      const srcWidget = path.join(projectRoot, "targets", "widget", "OiWidget.swift");
      if (fs.existsSync(srcWidget)) {
        fs.copyFileSync(srcWidget, path.join(widgetDir, "OiWidget.swift"));
      }

      // Create Info.plist for widget extension
      const widgetInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Oi</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
</dict>
</plist>`;
      fs.writeFileSync(path.join(widgetDir, "Info.plist"), widgetInfoPlist);

      // Use Ruby script to add widget target to Xcode project via xcodeproj gem
      // This is more reliable than the node xcode library
      const rubyScript = `
require 'xcodeproj'

project_path = '${path.join(iosDir, "Oi.xcodeproj")}'
project = Xcodeproj::Project.open(project_path)

# Check if target already exists
if project.targets.any? { |t| t.name == '${WIDGET_NAME}' }
  puts 'Widget target already exists, skipping'
  exit 0
end

# Create widget extension target
widget_target = project.new_target(:app_extension, '${WIDGET_NAME}', :ios, '16.0')
widget_target.build_configurations.each do |bc|
  bc.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = '${bundleId}.widget'
  bc.build_settings['SWIFT_VERSION'] = '5.0'
  bc.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  bc.build_settings['INFOPLIST_FILE'] = '${WIDGET_NAME}/Info.plist'
  bc.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  bc.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  bc.build_settings['MARKETING_VERSION'] = '1.0.0'
  bc.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
  bc.build_settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  bc.build_settings['SKIP_INSTALL'] = 'YES'
  bc.build_settings['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  bc.build_settings['ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME'] = 'WidgetBackground'
  bc.build_settings['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
end

# Add group and source file
widget_group = project.main_group.new_group('${WIDGET_NAME}', '${WIDGET_NAME}')
swift_ref = widget_group.new_reference('OiWidget.swift')
widget_target.source_build_phase.add_file_reference(swift_ref)

# Embed widget in main app
main_target = project.targets.find { |t| t.name == 'Oi' }
if main_target
  embed_phase = main_target.new_copy_files_build_phase('Embed App Extensions')
  embed_phase.dst_subfolder_spec = '13' # PlugIns folder
  embed_phase.add_file_reference(widget_target.product_reference, true)

  # Add target dependency
  main_target.add_dependency(widget_target)
end

project.save
puts 'Widget target added successfully'
`;

      const rubyScriptPath = path.join(iosDir, "_add_widget.rb");
      fs.writeFileSync(rubyScriptPath, rubyScript);

      try {
        const result = execSync(`/usr/bin/ruby "${rubyScriptPath}"`, {
          cwd: iosDir,
          stdio: "pipe",
        });
        console.log(result.toString());
      } catch (e) {
        console.warn("Widget target setup warning:", e.message);
      }

      // Clean up
      if (fs.existsSync(rubyScriptPath)) {
        fs.unlinkSync(rubyScriptPath);
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withOiWidget;
