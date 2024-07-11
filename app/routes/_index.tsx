import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Design Tools" },
    { name: "description", content: "A collection of useful design tools" },
  ];
};

export default function Index() {
  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Design Tools</h1>
      <ul className="list-disc mt-4 pl-6 space-y-2">
        <li>
          <Link to="/palette" className="text-blue-500 hover:underline">
            Palette
          </Link>
        </li>
      </ul>
    </div>
  );
}
