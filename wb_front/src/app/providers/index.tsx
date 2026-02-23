import { RouterProvider } from "./router";

interface ProvidersProps {
    children?: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <>
            <RouterProvider />
            {children}
        </>
    );
}
