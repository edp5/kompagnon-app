describe("Accordion — Integration Tests", () => {
    // Unfolding an answer is covered through the screens that use the accordion.
    // What they cannot reach is the Android-only setup, since the tests run as iOS.
    it("turns on the layout animation Android needs to unfold smoothly", () => {
        jest.isolateModules(() => {
            const reactNative = require("react-native");
            const previousOS = reactNative.Platform.OS;
            const enable = jest.fn();
            reactNative.Platform.OS = "android";
            reactNative.UIManager.setLayoutAnimationEnabledExperimental = enable;

            require("../../components/Accordion");

            expect(enable).toHaveBeenCalledWith(true);
            reactNative.Platform.OS = previousOS;
        });
    });
});
