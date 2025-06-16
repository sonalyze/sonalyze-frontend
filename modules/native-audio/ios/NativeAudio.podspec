Pod::Spec.new do |s|
  s.name           = 'NativeAudio'
  s.version        = '1.0.0'
  s.summary        = 'High-quality audio recording and streaming for iOS'
  s.description    = 'Native module providing file-based recording and real-time audio streaming with high quality settings'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end