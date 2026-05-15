import { LiffPluginContext } from '@line/liff';

declare const androidManifestFixPlugin: {
    name: "android-manifest-fix";
    install(context: LiffPluginContext): void;
};

export { androidManifestFixPlugin, androidManifestFixPlugin as default };
