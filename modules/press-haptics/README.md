# Press haptics

Local Expo view used by frequent-item rows. Touch-down feedback runs on the
native UI thread, independently of React rendering, quantity persistence, and
the JavaScript task queue. iOS retains and prepares a selection generator;
Android uses platform view haptics and respects the device haptic setting.

The view only observes touches. Gesture Handler still decides whether a tap
adds an item. As with the previous touch-down behavior, a touch that turns into
a scroll can produce press feedback without adding anything. Accessibility
activation uses the existing Expo haptic call because it has no touch-down.

## Build and validation

Expo autolinks this directory on iOS and Android. Rebuild the development client
or release binary to include it. Before distributing a release, assign a new
app version/runtime under the project's appVersion runtime policy. An OTA to an
older binary falls back to JavaScript haptics and does not gain this timing fix.

On a physical device, rapidly add several different frequent items while earlier
adds are still saving. Each touch should pulse once, before release; releasing
must not pulse again. Repeat offline, scroll from a row without adding it, and
activate rows with VoiceOver/TalkBack. Verify normal row height, gap closure,
and scrolling with enlarged text. Hardware timing cannot be verified in the
simulator or in the mocked interaction tests.
