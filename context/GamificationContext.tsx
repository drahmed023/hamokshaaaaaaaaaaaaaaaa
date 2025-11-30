// This context is now deprecated and its state management has been
// moved to the centralized AppDataContext.
// The toast dispatcher logic remains as a bridge.

let toastDispatcher: (title: string, message: string) => void = () => {};
export const setGamificationToastDispatcher = (dispatcher: (title: string, message: string) => void) => {
    toastDispatcher = dispatcher;
};

// This export is a placeholder for the old context if needed during transition.
export {};
