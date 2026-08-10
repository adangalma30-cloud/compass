package com.adangalma30.compass;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.view.View;
import android.view.animation.PathInterpolator;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            View splashView = splashScreenView.getView();
            View iconView = splashScreenView.getIconView();

            ObjectAnimator splashFade = ObjectAnimator.ofFloat(splashView, View.ALPHA, 1f, 0f);
            ObjectAnimator iconScaleX = ObjectAnimator.ofFloat(iconView, View.SCALE_X, 1f, 1.08f);
            ObjectAnimator iconScaleY = ObjectAnimator.ofFloat(iconView, View.SCALE_Y, 1f, 1.08f);
            ObjectAnimator iconFade = ObjectAnimator.ofFloat(iconView, View.ALPHA, 1f, 0f);

            AnimatorSet exit = new AnimatorSet();
            exit.playTogether(splashFade, iconScaleX, iconScaleY, iconFade);
            exit.setDuration(260L);
            exit.setInterpolator(new PathInterpolator(0.22f, 1f, 0.36f, 1f));
            exit.addListener(new android.animation.AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(android.animation.Animator animation) {
                    splashScreenView.remove();
                }
            });
            exit.start();
        });
        super.onCreate(savedInstanceState);
    }
}
