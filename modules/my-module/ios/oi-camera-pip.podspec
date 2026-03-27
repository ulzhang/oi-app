Pod::Spec.new do |s|
  s.name           = 'oi-camera-pip'
  s.version        = '1.0.0'
  s.summary        = 'Oi Camera PiP native module for Expo'
  s.description    = 'Streams rear camera to a Picture-in-Picture window on iOS'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'AVFoundation', 'AVKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
