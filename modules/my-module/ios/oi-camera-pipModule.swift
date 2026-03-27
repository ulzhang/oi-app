import ExpoModulesCore
import AVFoundation
import AVKit
import UIKit

// MARK: - Delegate Helper

/// Separate NSObject subclass to handle AVFoundation delegates,
/// since Expo's Module class doesn't inherit from NSObject.
class PipCameraDelegate: NSObject,
                         AVCaptureVideoDataOutputSampleBufferDelegate,
                         AVPictureInPictureSampleBufferPlaybackDelegate,
                         AVPictureInPictureControllerDelegate {

  weak var module: OiCameraPipModule?
  var sampleBufferDisplayLayer: AVSampleBufferDisplayLayer?
  /// Track whether PiP has successfully started to suppress stale error events
  var pipDidStart = false

  // MARK: AVCaptureVideoDataOutputSampleBufferDelegate

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard let layer = sampleBufferDisplayLayer else { return }
    if layer.status == .failed {
      layer.flush()
    }
    layer.enqueue(sampleBuffer)
  }

  // MARK: AVPictureInPictureSampleBufferPlaybackDelegate

  func pictureInPictureController(
    _ controller: AVPictureInPictureController,
    setPlaying playing: Bool
  ) {}

  func pictureInPictureControllerTimeRangeForPlayback(
    _ controller: AVPictureInPictureController
  ) -> CMTimeRange {
    CMTimeRange(start: .zero, duration: .positiveInfinity)
  }

  func pictureInPictureControllerIsPlaybackPaused(
    _ controller: AVPictureInPictureController
  ) -> Bool {
    false
  }

  func pictureInPictureController(
    _ controller: AVPictureInPictureController,
    didTransitionToRenderSize newRenderSize: CMVideoDimensions
  ) {}

  func pictureInPictureController(
    _ controller: AVPictureInPictureController,
    skipByInterval skipInterval: CMTime,
    completion completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }

  // MARK: AVPictureInPictureControllerDelegate

  func pictureInPictureControllerDidStartPictureInPicture(
    _ controller: AVPictureInPictureController
  ) {
    pipDidStart = true
    module?.sendEvent("onPipStateChanged", ["state": "active"])
    module?.startBatteryMonitoring()
  }

  func pictureInPictureControllerDidStopPictureInPicture(
    _ controller: AVPictureInPictureController
  ) {
    pipDidStart = false
    module?.stopBatteryMonitoring()
    module?.sendEvent("onPipStateChanged", ["state": "stopped"])
  }

  func pictureInPictureController(
    _ controller: AVPictureInPictureController,
    failedToStartPictureInPictureWithError error: Error
  ) {
    // Only send error if PiP hasn't already started successfully
    guard !pipDidStart else { return }
    module?.sendEvent("onPipStateChanged", ["state": "error", "message": error.localizedDescription])
  }
}

// MARK: - Expo Module

public class OiCameraPipModule: Module {

  private var captureSession: AVCaptureSession?
  private var pipController: AVPictureInPictureController?
  private let sessionQueue = DispatchQueue(label: "com.oi.camera.session")
  private let delegate = PipCameraDelegate()
  /// Hidden container view to host the sample buffer layer in the view hierarchy
  private var containerView: UIView?
  private var pipPossibleObservation: NSKeyValueObservation?
  private var batteryMonitoringTimer: Timer?

  public func definition() -> ModuleDefinition {
    Name("OiCameraPip")

    Events("onPipStateChanged", "onDeviceStatusChanged")

    OnCreate {
      self.delegate.module = self
    }

    AsyncFunction("startCamera") { (promise: Promise) in
      AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
        guard let self = self else {
          promise.reject(Exception(name: "ERR_DEALLOCATED", description: "Module was deallocated"))
          return
        }

        guard granted else {
          promise.reject(Exception(name: "ERR_CAMERA_PERMISSION", description: "Camera permission denied"))
          return
        }

        self.sessionQueue.async {
          do {
            let session = AVCaptureSession()
            session.beginConfiguration()
            session.sessionPreset = .medium

            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
              promise.reject(Exception(name: "ERR_NO_CAMERA", description: "No rear camera available"))
              return
            }

            let input = try AVCaptureDeviceInput(device: device)
            guard session.canAddInput(input) else {
              promise.reject(Exception(name: "ERR_CAMERA_INPUT", description: "Cannot add camera input"))
              return
            }
            session.addInput(input)

            let output = AVCaptureVideoDataOutput()
            output.setSampleBufferDelegate(self.delegate, queue: self.sessionQueue)
            output.alwaysDiscardsLateVideoFrames = true
            guard session.canAddOutput(output) else {
              promise.reject(Exception(name: "ERR_CAMERA_OUTPUT", description: "Cannot add video output"))
              return
            }
            session.addOutput(output)

            // Lock video orientation to portrait
            if let connection = output.connection(with: .video) {
              if #available(iOS 17.0, *) {
                connection.videoRotationAngle = 90
              } else {
                connection.videoOrientation = .portrait
              }
            }

            // Enable multitasking camera access for PiP background support
            // Note: Only supported on iPad Pro 4th gen+, iPad Air 5th gen+
            // On iPhone, this returns false and camera will freeze in background
            let mtSupported = session.isMultitaskingCameraAccessSupported
            print("[Oi] Multitasking camera supported: \(mtSupported)")
            if mtSupported {
              session.isMultitaskingCameraAccessEnabled = true
            }

            session.commitConfiguration()

            // Audio session with .playback is required for PiP to start
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, options: [.mixWithOthers])
            try audioSession.setActive(true)

            session.startRunning()
            self.captureSession = session

            promise.resolve(true)
          } catch {
            promise.reject(Exception(name: "ERR_CAMERA_SETUP", description: error.localizedDescription))
          }
        }
      }
    }

    AsyncFunction("startPip") { (promise: Promise) in
      DispatchQueue.main.async { [weak self] in
        guard let self = self else {
          promise.reject(Exception(name: "ERR_DEALLOCATED", description: "Module was deallocated"))
          return
        }

        // Create the sample buffer display layer
        let layer = AVSampleBufferDisplayLayer()
        layer.frame = CGRect(x: 0, y: 0, width: 480, height: 640)
        layer.videoGravity = .resizeAspectFill
        self.delegate.sampleBufferDisplayLayer = layer

        // The layer MUST be in a visible view hierarchy for PiP to work.
        // Create a tiny hidden container view and attach the layer to it.
        guard let window = UIApplication.shared.connectedScenes
          .compactMap({ $0 as? UIWindowScene })
          .flatMap({ $0.windows })
          .first(where: { $0.isKeyWindow }) else {
          promise.reject(Exception(name: "ERR_NO_WINDOW", description: "No key window found"))
          return
        }

        let container = UIView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))
        container.clipsToBounds = true
        container.alpha = 0.01 // Nearly invisible but still "visible" to the system
        window.addSubview(container)
        container.layer.addSublayer(layer)
        self.containerView = container

        // Create the PiP controller
        let contentSource = AVPictureInPictureController.ContentSource(
          sampleBufferDisplayLayer: layer,
          playbackDelegate: self.delegate
        )

        let controller = AVPictureInPictureController(contentSource: contentSource)
        controller.delegate = self.delegate
        self.pipController = controller

        self.delegate.pipDidStart = false
        self.sendEvent("onPipStateChanged", ["state": "started"])

        // Track whether we've already resolved the promise
        var resolved = false

        // Wait for isPictureInPicturePossible to become true via KVO
        self.pipPossibleObservation = controller.observe(
          \.isPictureInPicturePossible,
          options: [.new, .initial]
        ) { [weak self] ctrl, change in
          guard !resolved, let possible = change.newValue, possible else { return }
          resolved = true
          self?.pipPossibleObservation?.invalidate()
          self?.pipPossibleObservation = nil
          DispatchQueue.main.async {
            ctrl.startPictureInPicture()
            promise.resolve(true)
          }
        }

        // Timeout: if PiP doesn't become possible within 3 seconds, fail
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
          guard !resolved else { return }
          resolved = true
          self?.pipPossibleObservation?.invalidate()
          self?.pipPossibleObservation = nil
          promise.resolve(false)
          self?.sendEvent("onPipStateChanged", [
            "state": "error",
            "message": "PiP did not become available. Make sure you're on a physical device."
          ])
        }
      }
    }

    Function("stopPip") {
      DispatchQueue.main.async { [weak self] in
        self?.pipController?.stopPictureInPicture()
        self?.containerView?.removeFromSuperview()
        self?.containerView = nil
      }
    }

    Function("stopCamera") { [weak self] in
      guard let self = self else { return }
      self.stopBatteryMonitoring()
      self.sessionQueue.async {
        self.captureSession?.stopRunning()
        self.captureSession = nil
      }
      DispatchQueue.main.async {
        self.pipController = nil
        self.delegate.sampleBufferDisplayLayer = nil
        self.containerView?.removeFromSuperview()
        self.containerView = nil
        self.pipPossibleObservation?.invalidate()
        self.pipPossibleObservation = nil
      }
    }

    Function("isPipActive") { [weak self] () -> Bool in
      self?.pipController?.isPictureInPictureActive ?? false
    }

    Function("getDeviceStatus") { () -> [String: Any] in
      let device = UIDevice.current
      let wasEnabled = device.isBatteryMonitoringEnabled
      if !wasEnabled {
        device.isBatteryMonitoringEnabled = true
      }
      let batteryLevel = device.batteryLevel
      let isCharging = device.batteryState == .charging || device.batteryState == .full
      let thermalState = Self.thermalStateString(ProcessInfo.processInfo.thermalState)
      if !wasEnabled {
        device.isBatteryMonitoringEnabled = false
      }
      return [
        "batteryLevel": batteryLevel,
        "thermalState": thermalState,
        "isCharging": isCharging
      ]
    }
  }

  // MARK: - Thermal State Helpers

  private static func thermalStateString(_ state: ProcessInfo.ThermalState) -> String {
    switch state {
    case .nominal: return "nominal"
    case .fair: return "fair"
    case .serious: return "serious"
    case .critical: return "critical"
    @unknown default: return "nominal"
    }
  }

  // MARK: - Battery Monitoring

  func startBatteryMonitoring() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      UIDevice.current.isBatteryMonitoringEnabled = true
      self.batteryMonitoringTimer?.invalidate()
      self.batteryMonitoringTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
        guard let self = self else { return }
        let device = UIDevice.current
        let batteryLevel = device.batteryLevel
        let isCharging = device.batteryState == .charging || device.batteryState == .full
        let thermalState = ProcessInfo.processInfo.thermalState
        let thermalString = Self.thermalStateString(thermalState)

        self.sendEvent("onDeviceStatusChanged", [
          "batteryLevel": batteryLevel,
          "thermalState": thermalString,
          "isCharging": isCharging
        ])

        if thermalState == .critical {
          self.sendEvent("onPipStateChanged", [
            "state": "error",
            "message": "Device is overheating. Stopping PiP."
          ])
          DispatchQueue.main.async {
            self.pipController?.stopPictureInPicture()
            self.containerView?.removeFromSuperview()
            self.containerView = nil
          }
          self.stopBatteryMonitoring()
          self.sessionQueue.async {
            self.captureSession?.stopRunning()
            self.captureSession = nil
          }
        }
      }
    }
  }

  func stopBatteryMonitoring() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.batteryMonitoringTimer?.invalidate()
      self.batteryMonitoringTimer = nil
      UIDevice.current.isBatteryMonitoringEnabled = false
    }
  }
}
