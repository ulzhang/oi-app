import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct OiProvider: TimelineProvider {
  func placeholder(in context: Context) -> OiEntry {
    OiEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (OiEntry) -> Void) {
    completion(OiEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<OiEntry>) -> Void) {
    let entry = OiEntry(date: Date())
    // Refresh every 30 minutes
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }
}

// MARK: - Timeline Entry

struct OiEntry: TimelineEntry {
  let date: Date
}

// MARK: - Widget Views

struct OiWidgetSmallView: View {
  var body: some View {
    ZStack {
      Color(red: 0.04, green: 0.04, blue: 0.04)

      VStack(spacing: 6) {
        Text("Oi.")
          .font(.system(size: 28, weight: .black))
          .foregroundColor(.white)

        Text("Tap to start")
          .font(.system(size: 11, weight: .medium))
          .foregroundColor(Color(red: 0.56, green: 0.56, blue: 0.58))
      }
    }
    .widgetURL(URL(string: "oi:///"))
  }
}

struct OiWidgetAccessoryCircularView: View {
  var body: some View {
    ZStack {
      AccessoryWidgetBackground()
      Text("Oi")
        .font(.system(size: 16, weight: .black))
    }
    .widgetURL(URL(string: "oi:///"))
  }
}

struct OiWidgetAccessoryRectangularView: View {
  var body: some View {
    HStack(spacing: 8) {
      Text("Oi.")
        .font(.system(size: 20, weight: .black))
      Text("Tap to start PiP")
        .font(.system(size: 13, weight: .medium))
        .foregroundColor(.secondary)
    }
    .widgetURL(URL(string: "oi:///"))
  }
}

struct OiWidgetAccessoryInlineView: View {
  var body: some View {
    Text("Oi — Tap to start")
      .widgetURL(URL(string: "oi:///"))
  }
}

// MARK: - Widget Entry View

struct OiWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  var entry: OiProvider.Entry

  var body: some View {
    switch family {
    case .accessoryCircular:
      OiWidgetAccessoryCircularView()
    case .accessoryRectangular:
      OiWidgetAccessoryRectangularView()
    case .accessoryInline:
      OiWidgetAccessoryInlineView()
    case .systemSmall:
      OiWidgetSmallView()
    default:
      OiWidgetSmallView()
    }
  }
}

// MARK: - Widget

@main
struct OiWidget: Widget {
  let kind: String = "OiWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: OiProvider()) { entry in
      if #available(iOSApplicationExtension 17.0, *) {
        OiWidgetEntryView(entry: entry)
          .containerBackground(.fill.tertiary, for: .widget)
      } else {
        OiWidgetEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Oi")
    .description("Quick-launch rear camera PiP")
    .supportedFamilies([
      .systemSmall,
      .accessoryCircular,
      .accessoryRectangular,
      .accessoryInline,
    ])
  }
}
