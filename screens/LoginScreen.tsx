import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { AppDataActionType } from '../types';
import Button from '../components/Button';
import { AppLogoIcon } from '../components/icons/AppLogoIcon';
import { APP_NAME } from '../constants';

function LoginScreen() {
    const { dispatch } = useAppData();

    const handleLogin = () => {
        // In a real app, this would involve an API call.
        // Here, we just set the auth state and trigger a data load.
        // The AppDataContext will see there's no data in localStorage for a "new user"
        // and proceed with an initial state. If data exists, it will be loaded.
        dispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: true, isInitialized: true } });
        // The data loading is now handled by the context's useEffect when isLoggedIn becomes true.
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="text-center p-8 max-w-md w-full">
                <AppLogoIcon className="w-24 h-24 text-primary-600 mx-auto" />
                <h1 className="text-4xl font-bold mt-4 text-slate-800 dark:text-white">{APP_NAME}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Your AI-powered study companion.</p>
                <div className="mt-8">
                    <Button onClick={handleLogin} size="lg" className="w-full">
                        Login / Continue Session
                    </Button>
                    <p className="text-xs text-slate-400 mt-4">
                        By continuing, you agree to store your study data in this browser.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;