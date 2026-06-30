package com.flow.apex;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.animation.LinearInterpolator;
import android.widget.FrameLayout;

import androidx.core.graphics.Insets;
import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemBarScrim")
public class SystemBarScrimPlugin extends Plugin {

    private View statusBarScrimView;
    private View navigationBarScrimView;
    private boolean isDimmed = false;
    private final float maxScrimOpacity = 0.42f;
    private final long animDurationIn = 180;
    private final long animDurationOut = 160;

    // Restore configurations (contrast enforcement)
    private boolean originalNavBarContrastEnforced;
    private boolean originalStatusBarContrastEnforced;
    private boolean isEdgeToEdgeSet = false;

    // Current transition state trackers
    private int lastBaseStatusColor;
    private int lastBaseNavColor;
    private int currentStatusBarColor;
    private int currentNavigationBarColor;
    private ValueAnimator activeAnimator;

    @Override
    public void load() {
        super.load();
        getBridge().getActivity().runOnUiThread(() -> {
            Activity activity = getBridge().getActivity();
            
            // Create non-interactive status bar scrim view
            statusBarScrimView = new View(activity);
            statusBarScrimView.setBackgroundColor(Color.TRANSPARENT);
            statusBarScrimView.setClickable(false);
            statusBarScrimView.setFocusable(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                statusBarScrimView.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            }

            // Create non-interactive navigation bar scrim view
            navigationBarScrimView = new View(activity);
            navigationBarScrimView.setBackgroundColor(Color.TRANSPARENT);
            navigationBarScrimView.setClickable(false);
            navigationBarScrimView.setFocusable(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                navigationBarScrimView.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            }

            // Bind layout insets listener
            Window window = activity.getWindow();
            ViewGroup decorView = (ViewGroup) window.getDecorView();
            ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
                updateScrimBounds(insets);
                return insets;
            });
        });
    }

    private void updateScrimBounds(WindowInsetsCompat insets) {
        if (statusBarScrimView == null || navigationBarScrimView == null || insets == null) {
            return;
        }

        Insets statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars());
        Insets navigationBarInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
        boolean isKeyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

        int statusBarHeight = statusBarInsets.top;

        // Position Status Bar scrim View
        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            statusBarHeight
        );
        statusParams.gravity = Gravity.TOP;
        statusBarScrimView.setLayoutParams(statusParams);

        // Position Navigation Bar scrim View
        FrameLayout.LayoutParams navParams;
        if (isKeyboardVisible) {
            navParams = new FrameLayout.LayoutParams(0, 0);
        } else {
            int navLeft = navigationBarInsets.left;
            int navRight = navigationBarInsets.right;
            int navBottom = navigationBarInsets.bottom;

            if (navBottom > 0) {
                navParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    navBottom
                );
                navParams.gravity = Gravity.BOTTOM;
            } else if (navRight > 0) {
                navParams = new FrameLayout.LayoutParams(
                    navRight,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                navParams.gravity = Gravity.RIGHT;
            } else if (navLeft > 0) {
                navParams = new FrameLayout.LayoutParams(
                    navLeft,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                navParams.gravity = Gravity.LEFT;
            } else {
                navParams = new FrameLayout.LayoutParams(0, 0);
            }
        }
        navigationBarScrimView.setLayoutParams(navParams);
    }

    @PluginMethod
    public void show(PluginCall call) {
        getBridge().getActivity().runOnUiThread(() -> {
            try {
                Activity activity = getBridge().getActivity();
                Window window = activity.getWindow();

                String statusColorHex = call.getString("statusBarColor", "#FAFAFA");
                String navColorHex = call.getString("navigationBarColor", "#FAFAFA");
                int baseStatusColor = Color.parseColor(statusColorHex);
                int baseNavColor = Color.parseColor(navColorHex);

                int statusStart;
                int navStart;

                if (!isDimmed) {
                    // Save original contrast flags only
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        originalNavBarContrastEnforced = window.isNavigationBarContrastEnforced();
                        originalStatusBarContrastEnforced = window.isStatusBarContrastEnforced();
                    }

                    statusStart = baseStatusColor;
                    navStart = baseNavColor;
                } else {
                    // Cancel active animator
                    if (activeAnimator != null) {
                        activeAnimator.cancel();
                    }
                    statusStart = currentStatusBarColor;
                    navStart = currentNavigationBarColor;
                }

                // 4. Configure Activity edge-to-edge
                if (!isEdgeToEdgeSet) {
                    WindowCompat.setDecorFitsSystemWindows(window, false);
                    isEdgeToEdgeSet = true;
                }

                // 8. Disable contrast enforcement
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setNavigationBarContrastEnforced(false);
                    window.setStatusBarContrastEnforced(false);
                }

                ViewGroup decorView = (ViewGroup) window.getDecorView();

                if (statusBarScrimView.getParent() == null) {
                    decorView.addView(statusBarScrimView);
                }
                if (navigationBarScrimView.getParent() == null) {
                    decorView.addView(navigationBarScrimView);
                }

                WindowInsetsCompat currentInsets = ViewCompat.getRootWindowInsets(decorView);
                if (currentInsets != null) {
                    updateScrimBounds(currentInsets);
                }

                statusBarScrimView.bringToFront();
                navigationBarScrimView.bringToFront();

                // Save parameters for dynamic color tracking
                lastBaseStatusColor = baseStatusColor;
                lastBaseNavColor = baseNavColor;

                // Calculate final target dimmed colors
                int statusEnd = compositeWithBlack(baseStatusColor, maxScrimOpacity);
                int navEnd = compositeWithBlack(baseNavColor, maxScrimOpacity);

                // Select system-icon appearance based on luminance of target dimmed colors
                boolean statusIconsDark = isColorLight(statusEnd);
                boolean navIconsDark = isColorLight(navEnd);
                setSystemBarIconsDark(window, statusIconsDark, navIconsDark);

                // Animate color change over 180ms
                ArgbEvaluator evaluator = new ArgbEvaluator();
                activeAnimator = ValueAnimator.ofFloat(0f, 1f);
                activeAnimator.setDuration(animDurationIn);
                activeAnimator.setInterpolator(new LinearInterpolator());
                activeAnimator.addUpdateListener(animation -> {
                    float fraction = animation.getAnimatedFraction();
                    int currentStatus = (int) evaluator.evaluate(fraction, statusStart, statusEnd);
                    int currentNav = (int) evaluator.evaluate(fraction, navStart, navEnd);

                    currentStatusBarColor = currentStatus;
                    currentNavigationBarColor = currentNav;

                    statusBarScrimView.setBackgroundColor(currentStatus);
                    navigationBarScrimView.setBackgroundColor(currentNav);

                    if (Build.VERSION.SDK_INT < 35) {
                        window.setStatusBarColor(currentStatus);
                        window.setNavigationBarColor(currentNav);
                    }
                });
                activeAnimator.start();

                isDimmed = true;
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to show native system-bar scrim: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getBridge().getActivity().runOnUiThread(() -> {
            try {
                Activity activity = getBridge().getActivity();
                Window window = activity.getWindow();

                if (activeAnimator != null) {
                    activeAnimator.cancel();
                }

                // Do not restore stale captured states: read explicit targets passed from JS
                String statusColorHex = call.getString("statusBarColor", "#FAFAFA");
                String navColorHex = call.getString("navigationBarColor", "#FAFAFA");
                boolean statusBarIconsDark = call.getBoolean("statusBarIconsDark", true);
                boolean navBarIconsDark = call.getBoolean("navigationBarIconsDark", true);

                int targetStatusColor = Color.parseColor(statusColorHex);
                int targetNavColor = Color.parseColor(navColorHex);

                int statusStart = currentStatusBarColor;
                int statusEnd = targetStatusColor;
                int navStart = currentNavigationBarColor;
                int navEnd = targetNavColor;

                // Animate color restoration over 160ms
                ArgbEvaluator evaluator = new ArgbEvaluator();
                activeAnimator = ValueAnimator.ofFloat(0f, 1f);
                activeAnimator.setDuration(animDurationOut);
                activeAnimator.setInterpolator(new LinearInterpolator());
                activeAnimator.addUpdateListener(animation -> {
                    float fraction = animation.getAnimatedFraction();
                    int currentStatus = (int) evaluator.evaluate(fraction, statusStart, statusEnd);
                    int currentNav = (int) evaluator.evaluate(fraction, navStart, navEnd);

                    currentStatusBarColor = currentStatus;
                    currentNavigationBarColor = currentNav;

                    statusBarScrimView.setBackgroundColor(currentStatus);
                    navigationBarScrimView.setBackgroundColor(currentNav);

                    if (Build.VERSION.SDK_INT < 35) {
                        window.setStatusBarColor(currentStatus);
                        window.setNavigationBarColor(currentNav);
                    }
                });

                activeAnimator.addListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        if (!isDimmed) {
                            removeScrimViews();

                            // Restore original contrast configurations
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                window.setNavigationBarContrastEnforced(originalNavBarContrastEnforced);
                                window.setStatusBarContrastEnforced(originalStatusBarContrastEnforced);
                            }

                            if (Build.VERSION.SDK_INT < 35) {
                                window.setStatusBarColor(targetStatusColor);
                                window.setNavigationBarColor(targetNavColor);
                            }

                            // Explicitly restore the target icon styles
                            setSystemBarIconsDark(window, statusBarIconsDark, navBarIconsDark);
                        }
                    }
                });
                activeAnimator.start();

                isDimmed = false;
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to hide native system-bar scrim: " + e.getMessage());
            }
        });
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        getBridge().getActivity().runOnUiThread(() -> {
            if (isDimmed) {
                ViewGroup decorView = (ViewGroup) getBridge().getActivity().getWindow().getDecorView();
                statusBarScrimView.bringToFront();
                navigationBarScrimView.bringToFront();
                WindowInsetsCompat currentInsets = ViewCompat.getRootWindowInsets(decorView);
                if (currentInsets != null) {
                    updateScrimBounds(currentInsets);
                }

                // Maintain dimmed color and state
                int statusEnd = compositeWithBlack(lastBaseStatusColor, maxScrimOpacity);
                int navEnd = compositeWithBlack(lastBaseNavColor, maxScrimOpacity);

                statusBarScrimView.setBackgroundColor(statusEnd);
                navigationBarScrimView.setBackgroundColor(navEnd);

                Activity activity = getBridge().getActivity();
                Window window = activity.getWindow();
                if (Build.VERSION.SDK_INT < 35) {
                    window.setStatusBarColor(statusEnd);
                    window.setNavigationBarColor(navEnd);
                }

                boolean statusIconsDark = isColorLight(statusEnd);
                boolean navIconsDark = isColorLight(navEnd);
                setSystemBarIconsDark(window, statusIconsDark, navIconsDark);
            }
        });
    }

    private int compositeWithBlack(int baseColor, float opacity) {
        int r = Color.red(baseColor);
        int g = Color.green(baseColor);
        int b = Color.blue(baseColor);
        int a = Color.alpha(baseColor);

        int newR = Math.round(r * (1.0f - opacity));
        int newG = Math.round(g * (1.0f - opacity));
        int newB = Math.round(b * (1.0f - opacity));

        return Color.argb(a, newR, newG, newB);
    }

    private boolean isColorLight(int color) {
        double r = Color.red(color) / 255.0;
        double g = Color.green(color) / 255.0;
        double b = Color.blue(color) / 255.0;

        // Relative luminance
        double luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance > 0.5;
    }

    private void setSystemBarIconsDark(Window window, boolean statusBarDark, boolean navBarDark) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            android.view.WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                int statusFlag = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;
                int navFlag = android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;

                controller.setSystemBarsAppearance(
                    statusBarDark ? statusFlag : 0,
                    statusFlag
                );
                controller.setSystemBarsAppearance(
                    navBarDark ? navFlag : 0,
                    navFlag
                );
            }
        } else {
            View decorView = window.getDecorView();
            int flags = decorView.getSystemUiVisibility();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (statusBarDark) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                } else {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (navBarDark) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decorView.setSystemUiVisibility(flags);
        }
    }

    private void removeScrimViews() {
        if (statusBarScrimView != null && statusBarScrimView.getParent() != null) {
            ((ViewGroup) statusBarScrimView.getParent()).removeView(statusBarScrimView);
        }
        if (navigationBarScrimView != null && navigationBarScrimView.getParent() != null) {
            ((ViewGroup) navigationBarScrimView.getParent()).removeView(navigationBarScrimView);
        }
    }
}
