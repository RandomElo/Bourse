import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./styles/App.css";
import Accueil from "./pages/Accueil";
import Generale from "./pages/fragments/Generale";
import { AuthProvider } from "./contexts/AuthContext";
import Identification from "./pages/Identification";
import Compte from "./pages/Compte";
import { ErreurProvider } from "./contexts/ErreurContext";
import ErreurRoute from "./pages/ErreurRoute";
import ErreurElement from "./pages/ErreurElement";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Generale />,
        errorElement: <ErreurElement />,
        children: [
            {
                path: "/",
                element: <Accueil />,
            },
            {
                path: "/inscription",
                element: <Identification mode="inscription" />,
            },
            {
                path: "/connexion",
                element: <Identification mode="connexion" />,
            },
            {
                path: "/compte",
                element: <Compte />,
            },
            {
                path: "*",
                element: <ErreurRoute />,
            },
        ],
    },
]);

export default function App() {
    return (
        <ErreurProvider>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ErreurProvider>
    );
}
