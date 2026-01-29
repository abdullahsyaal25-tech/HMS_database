import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Doctor, Patient, Appointment, Medicine, LabTest, Bill } from '../types';

// Auth State Types
interface AuthState {
    user: {
        id: number;
        name: string;
        username: string;
        role: string;
    } | null;
    isAuthenticated: boolean;
    permissions: string[];
}

type AuthAction =
    | { type: 'LOGIN'; payload: { user: AuthState['user']; permissions: string[] } }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_PERMISSIONS'; payload: string[] };

// Patient State Types
interface PatientState {
    patients: Patient[];
    selectedPatient: Patient | null;
    loading: boolean;
    error: string | null;
    totalPages: number;
    currentPage: number;
    filters: {
        search: string;
        gender: string;
        bloodGroup: string;
    };
}

type PatientAction =
    | { type: 'SET_PATIENTS'; payload: Patient[] }
    | { type: 'SET_SELECTED_PATIENT'; payload: Patient | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_CURRENT_PAGE'; payload: number }
    | { type: 'SET_FILTERS'; payload: Partial<PatientState['filters']> }
    | { type: 'ADD_PATIENT'; payload: Patient }
    | { type: 'UPDATE_PATIENT'; payload: Patient }
    | { type: 'REMOVE_PATIENT'; payload: number };

// UI State Types
interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark';
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        timestamp: Date;
    }>;
    modals: {
        patientForm: boolean;
        doctorForm: boolean;
        appointmentForm: boolean;
        medicineForm: boolean;
        labTestForm: boolean;
        billForm: boolean;
    };
}

type UIAction =
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'SET_THEME'; payload: 'light' | 'dark' }
    | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id' | 'timestamp'> }
    | { type: 'REMOVE_NOTIFICATION'; payload: string }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'OPEN_MODAL'; payload: keyof UIState['modals'] }
    | { type: 'CLOSE_MODAL'; payload: keyof UIState['modals'] }
    | { type: 'TOGGLE_MODAL'; payload: keyof UIState['modals'] };

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                permissions: action.payload.permissions,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                permissions: [],
            };
        case 'UPDATE_PERMISSIONS':
            return {
                ...state,
                permissions: action.payload,
            };
        default:
            return state;
    }
};

// Patient Reducer
const patientReducer = (state: PatientState, action: PatientAction): PatientState => {
    switch (action.type) {
        case 'SET_PATIENTS':
            return { ...state, patients: action.payload };
        case 'SET_SELECTED_PATIENT':
            return { ...state, selectedPatient: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload };
        case 'SET_FILTERS':
            return {
                ...state,
                filters: { ...state.filters, ...action.payload },
                currentPage: 1, // Reset to first page when filters change
            };
        case 'ADD_PATIENT':
            return {
                ...state,
                patients: [action.payload, ...state.patients],
            };
        case 'UPDATE_PATIENT':
            return {
                ...state,
                patients: state.patients.map(p =>
                    p.id === action.payload.id ? action.payload : p
                ),
            };
        case 'REMOVE_PATIENT':
            return {
                ...state,
                patients: state.patients.filter(p => p.id !== action.payload),
            };
        default:
            return state;
    }
};

// UI Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    { ...action.payload, id: Date.now().toString(), timestamp: new Date() },
                ],
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };
        case 'CLEAR_NOTIFICATIONS':
            return { ...state, notifications: [] };
        case 'OPEN_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: true },
            };
        case 'CLOSE_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: false },
            };
        case 'TOGGLE_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: !state.modals[action.payload] },
            };
        default:
            return state;
    }
};

// Initial States
const initialAuthState: AuthState = {
    user: null,
    isAuthenticated: false,
    permissions: [],
};

const initialPatientState: PatientState = {
    patients: [],
    selectedPatient: null,
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 1,
    filters: {
        search: '',
        gender: '',
        bloodGroup: '',
    },
};

const initialUIState: UIState = {
    sidebarCollapsed: false,
    theme: 'light',
    notifications: [],
    modals: {
        patientForm: false,
        doctorForm: false,
        appointmentForm: false,
        medicineForm: false,
        labTestForm: false,
        billForm: false,
    },
};

// Context Types
interface StoreContextType {
    auth: {
        state: AuthState;
        dispatch: React.Dispatch<AuthAction>;
        login: (user: AuthState['user'], permissions: string[]) => void;
        logout: () => void;
        updatePermissions: (permissions: string[]) => void;
    };
    patients: {
        state: PatientState;
        dispatch: React.Dispatch<PatientAction>;
        setPatients: (patients: Patient[]) => void;
        setSelectedPatient: (patient: Patient | null) => void;
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setCurrentPage: (page: number) => void;
        setFilters: (filters: Partial<PatientState['filters']>) => void;
        addPatient: (patient: Patient) => void;
        updatePatient: (patient: Patient) => void;
        removePatient: (patientId: number) => void;
    };
    ui: {
        state: UIState;
        dispatch: React.Dispatch<UIAction>;
        toggleSidebar: () => void;
        setTheme: (theme: 'light' | 'dark') => void;
        addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
        removeNotification: (id: string) => void;
        clearNotifications: () => void;
        openModal: (modal: keyof UIState['modals']) => void;
        closeModal: (modal: keyof UIState['modals']) => void;
        toggleModal: (modal: keyof UIState['modals']) => void;
    };
}

// Create Context
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Provider Component
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
    const [patientState, patientDispatch] = useReducer(patientReducer, initialPatientState);
    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

    // Load initial data from localStorage
    useEffect(() => {
        // Load auth state
        const savedAuth = localStorage.getItem('auth-storage');
        if (savedAuth) {
            try {
                const parsed = JSON.parse(savedAuth);
                authDispatch({ type: 'LOGIN', payload: parsed });
            } catch (error) {
                console.error('Failed to parse saved auth state:', error);
            }
        }

        // Load UI state
        const savedUI = localStorage.getItem('ui-storage');
        if (savedUI) {
            try {
                const parsed = JSON.parse(savedUI);
                uiDispatch({ type: 'SET_THEME', payload: parsed.theme || 'light' });
                uiDispatch({ type: 'TOGGLE_SIDEBAR' });
            } catch (error) {
                console.error('Failed to parse saved UI state:', error);
            }
        }
    }, []);

    // Save auth state to localStorage
    useEffect(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
            user: authState.user,
            permissions: authState.permissions,
        }));
    }, [authState.user, authState.permissions]);

    // Save UI state to localStorage
    useEffect(() => {
        localStorage.setItem('ui-storage', JSON.stringify({
            theme: uiState.theme,
            sidebarCollapsed: uiState.sidebarCollapsed,
        }));
    }, [uiState.theme, uiState.sidebarCollapsed]);

    // Auth Actions
    const login = (user: AuthState['user'], permissions: string[]) => {
        authDispatch({ type: 'LOGIN', payload: { user, permissions } });
    };

    const logout = () => {
        authDispatch({ type: 'LOGOUT' });
    };

    const updatePermissions = (permissions: string[]) => {
        authDispatch({ type: 'UPDATE_PERMISSIONS', payload: permissions });
    };

    // Patient Actions
    const setPatients = (patients: Patient[]) => {
        patientDispatch({ type: 'SET_PATIENTS', payload: patients });
    };

    const setSelectedPatient = (patient: Patient | null) => {
        patientDispatch({ type: 'SET_SELECTED_PATIENT', payload: patient });
    };

    const setLoading = (loading: boolean) => {
        patientDispatch({ type: 'SET_LOADING', payload: loading });
    };

    const setError = (error: string | null) => {
        patientDispatch({ type: 'SET_ERROR', payload: error });
    };

    const setCurrentPage = (page: number) => {
        patientDispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    };

    const setFilters = (filters: Partial<PatientState['filters']>) => {
        patientDispatch({ type: 'SET_FILTERS', payload: filters });
    };

    const addPatient = (patient: Patient) => {
        patientDispatch({ type: 'ADD_PATIENT', payload: patient });
    };

    const updatePatient = (patient: Patient) => {
        patientDispatch({ type: 'UPDATE_PATIENT', payload: patient });
    };

    const removePatient = (patientId: number) => {
        patientDispatch({ type: 'REMOVE_PATIENT', payload: patientId });
    };

    // UI Actions
    const toggleSidebar = () => {
        uiDispatch({ type: 'TOGGLE_SIDEBAR' });
    };

    const setTheme = (theme: 'light' | 'dark') => {
        uiDispatch({ type: 'SET_THEME', payload: theme });
    };

    const addNotification = (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => {
        uiDispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    const removeNotification = (id: string) => {
        uiDispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    };

    const clearNotifications = () => {
        uiDispatch({ type: 'CLEAR_NOTIFICATIONS' });
    };

    const openModal = (modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'OPEN_MODAL', payload: modal });
    };

    const closeModal = (modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'CLOSE_MODAL', payload: modal });
    };

    const toggleModal = (modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'TOGGLE_MODAL', payload: modal });
    };

    const value: StoreContextType = {
        auth: {
            state: authState,
            dispatch: authDispatch,
            login,
            logout,
            updatePermissions,
        },
        patients: {
            state: patientState,
            dispatch: patientDispatch,
            setPatients,
            setSelectedPatient,
            setLoading,
            setError,
            setCurrentPage,
            setFilters,
            addPatient,
            updatePatient,
            removePatient,
        },
        ui: {
            state: uiState,
            dispatch: uiDispatch,
            toggleSidebar,
            setTheme,
            addNotification,
            removeNotification,
            clearNotifications,
            openModal,
            closeModal,
            toggleModal,
        },
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// Custom Hooks
export const useAuthStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useAuthStore must be used within a StoreProvider');
    }
    return context.auth;
};

export const usePatientStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('usePatientStore must be used within a StoreProvider');
    }
    return context.patients;
};

export const useUIStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useUIStore must be used within a StoreProvider');
    }
    return context.ui;
};

// Combined store hook for complex operations
export const useAppStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within a StoreProvider');
    }
    return context;
};