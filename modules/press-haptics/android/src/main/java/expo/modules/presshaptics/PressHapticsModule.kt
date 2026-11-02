package expo.modules.presshaptics

import android.content.Context
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView

class PressHapticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PressHaptics")
    View(PressHapticsView::class) {}
  }
}

class PressHapticsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
    }
    // Keep dispatch intact: the row handles taps and the parent handles scrolling.
    return super.dispatchTouchEvent(event)
  }
}
