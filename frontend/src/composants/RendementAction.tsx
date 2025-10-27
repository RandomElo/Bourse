export default function RendementAction({ valeur, id }: { valeur: number; id?: string }) {
    const styleBase = {
        padding: "5px 7px",
        fontSize: "1.2em",
        borderRadius: "8px",
        height: "25px",
        maxWidth: "max-content",
    };

    const styleValeur = valeur > 0 ? { color: "#137333", backgroundColor: "#e6f4ea" } : { color: "#a50e0e", backgroundColor: "#fce8e6" };

    return (
        <p id={id} style={{ ...styleBase, ...styleValeur }}>
            {valeur > 0 ? "+ " : "- "}
            {Math.abs(valeur)} %
        </p>
    );
}
