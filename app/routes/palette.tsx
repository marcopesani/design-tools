import type { MetaFunction } from "@remix-run/node";
import { PaletteProvider } from "../contexts/PaletteContext";
import ImageContainer from "../components/ImageContainer";
import PaletteDisplay from "../components/PaletteDisplay";

export const meta: MetaFunction = () => {
  return [
    { title: "Palette Generator" },
    {
      name: "description",
      content: "Generate a palette from an image using k-means clustering",
    },
  ];
};

export default function Index() {
  return (
    <PaletteProvider>
      <div className="font-sans h-screen flex flex-col bg-gray-900 text-gray-200">
        <header className="bg-gray-800 p-4">
          <h1 className="text-2xl font-bold">Palette Generator</h1>
        </header>
        <main className="flex-grow flex flex-col">
          <ImageContainer />
          <PaletteDisplay />
        </main>
      </div>
    </PaletteProvider>
  );
}