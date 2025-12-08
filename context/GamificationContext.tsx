// This context is primarily used as an event bus for toasts triggered by logic 
// that doesn't have direct access to the UI (like inside the global reducer).

export let toastDispatcher: (title: string, message: string) => void = () => {};

export const setGamificationToastDispatcher = (dispatcher: (title: string, message: string) => void) => {
    toastDispatcher = dispatcher;
};

// This export is a placeholder for the old context if needed during transition.
export {};