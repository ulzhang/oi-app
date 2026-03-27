import ExpoModulesCore
import UIKit

public class OiAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    if userActivity.activityType == "com.oi.walkpip.startPiP" {
      // Post a notification that the JS side can listen for
      NotificationCenter.default.post(
        name: NSNotification.Name("OiSiriShortcutTriggered"),
        object: nil
      )
      return true
    }
    return false
  }
}
