interface StorybookFeatures {
    sidebarOnboardingChecklist?: boolean;
}

const root = globalThis as typeof globalThis & { FEATURES?: StorybookFeatures };
const features = root.FEATURES ?? {};
features.sidebarOnboardingChecklist = false;
root.FEATURES = features;
