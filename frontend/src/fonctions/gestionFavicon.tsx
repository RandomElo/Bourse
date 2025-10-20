import { useEffect } from "react";

export default function useFavicon() {
    useEffect(() => {
        const favicon = document.getElementById("favicon") as HTMLLinkElement | null;
        if (!favicon) return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const selectFavicon = () => {
            favicon.href = media.matches ? "../marcheBlanc.svg" : "../marche.svg";
        };

        selectFavicon();
        media.addEventListener("change", selectFavicon);

        return () => media.removeEventListener("change", selectFavicon);
    }, []);
}
