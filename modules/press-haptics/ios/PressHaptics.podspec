Pod::Spec.new do |s|
  s.name = 'PressHaptics'
  s.version = '1.0.0'
  s.summary = 'Native touch-down feedback for Chomp'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Chomp'
  s.homepage = 'https://chompgrocery.com'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
