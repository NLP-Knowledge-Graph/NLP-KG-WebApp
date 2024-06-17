import React from "react";
import Script from 'next/script';

const GoogleAnalytics = () => {
    // change Google Analytics ID for new project
    const googleAnalyticsId = "G-WP4R3G4LQW";

    return (
        <>
            <Script
                strategy='lazyOnload'
                src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            />

            <Script id='' strategy='lazyOnload'>
                {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}', {
              page_path: window.location.pathname,
              });
          `}
            </Script>
        </>
    );
};
export default GoogleAnalytics;