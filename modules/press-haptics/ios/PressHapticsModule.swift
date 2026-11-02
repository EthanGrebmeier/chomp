import ExpoModulesCore
import UIKit

public class PressHapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PressHaptics")
    View(PressHapticsView.self) {}
  }
}

final class PressHapticsView: ExpoView {
  private let feedback = PressFeedbackRecognizer(target: nil, action: nil)

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    feedback.cancelsTouchesInView = false
    feedback.delaysTouchesBegan = false
    feedback.delaysTouchesEnded = false
    addGestureRecognizer(feedback)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil { feedback.prepare() }
  }
}

// Observe touches in descendants without recognizing or competing with the
// row's tap recognizer or its scroll view. Feedback never crosses the JS queue.
private final class PressFeedbackRecognizer: UIGestureRecognizer {
  private let generator = UISelectionFeedbackGenerator()
  private var didPulse = false

  func prepare() { generator.prepare() }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    guard !didPulse else { return }
    didPulse = true
    generator.selectionChanged()
    generator.prepare()
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    state = .failed
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    state = .failed
  }

  override func reset() {
    super.reset()
    didPulse = false
  }

  override func canPrevent(_ other: UIGestureRecognizer) -> Bool { false }
  override func canBePrevented(by other: UIGestureRecognizer) -> Bool { false }
}
