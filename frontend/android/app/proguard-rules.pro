# Capacitor requires these classes for the WebView bridge
-keep class com.getcapacitor.** { *; }
-keep class com.allstarastrology.app.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JS interface
-keepattributes JavascriptInterface

# Don't warn about Capacitor internals
-dontwarn com.getcapacitor.**
