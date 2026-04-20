import { featuredClients } from "../data/clients";

export default function ClientsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="mb-4 text-sm tracking-widest text-gold">לקוחות</p>
      <h1 className="mb-6 text-4xl font-bold md:text-5xl">לקוחות שסומכים עלינו</h1>
      <p className="mb-12 text-gray-400">
        רשימה מסודרת לפי הדרישה העסקית. ניתן להחליף בשמות מלאים, לוגואים מאושרים וקישורים לאתרים כשיהיו זמינים.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {featuredClients.map((name) => (
          <li
            key={name}
            className="border border-white/10 bg-darkGray/50 px-6 py-4 text-lg text-gray-100"
          >
            {name}
          </li>
        ))}
        <li className="border border-gold/30 bg-gold/5 px-6 py-4 text-lg text-gold">ועוד</li>
      </ul>
    </div>
  );
}
