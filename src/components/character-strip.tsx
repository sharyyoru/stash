"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type Character = {
  id: number;
  name: string;
  code: string;
  description: string;
  moodColor: string;
  imageSrc?: string;
  slug?: string;
};

const defaultCharacters: Character[] = [
  {
    id: 1,
    name: "Nohnoh",
    code: "The calm one",
    description:
      "Slow mornings, soft playlists and neat little stacks of paper.",
    moodColor: "from-emerald-100 to-emerald-200",
    imageSrc: "/media/characters/nohnoh.png",
  },
  {
    id: 2,
    name: "Mimi",
    code: "The organiser",
    description:
      "Colour-coded tabs, tidy timelines and gentle accountability.",
    moodColor: "from-sky-100 to-sky-200",
    imageSrc: "/media/characters/mimi.png",
  },
  {
    id: 3,
    name: "Mega Greninja",
    code: "Mega Greninja",
    description: "Mega Greninja",
    moodColor: "from-amber-100 to-amber-200",
    imageSrc: "/media/characters/mega-greninja.png",
  },
  {
    id: 4,
    name: "Mega Delphox",
    code: "Mega Delphox",
    description: "Mega Delphox",
    moodColor: "from-violet-100 to-violet-200",
    imageSrc: "/media/characters/mega-delphox.png",
  },
  {
    id: 5,
    name: "Mega Chesnaught",
    code: "Mega Chesnaught",
    description: "Mega Chesnaught",
    moodColor: "from-emerald-100 to-emerald-200",
    imageSrc: "/media/characters/mega-chesnaught.png",
  },
];

type CharacterStripProps = {
  characters?: Character[];
};

export default function CharacterStrip({
  characters = defaultCharacters,
}: CharacterStripProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const scrollByAmount = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const beginDrag = (clientX: number) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = clientX;
    dragStartScrollLeft.current = el.scrollLeft;
  };

  const moveDrag = (clientX: number) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    const delta = clientX - dragStartX.current;
    el.scrollLeft = dragStartScrollLeft.current - delta;
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  return (
    <section className="space-y-4 md:grid md:grid-cols-2 md:items-center md:gap-6">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] stash-rainbow-text">
          Shop by character
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Which Stash character matches your desk energy?
        </h2>
        <p className="text-xs text-neutral-700">
          Pick a character and shop a mix of stickers and stationery that match
          their mood.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            aria-label="Scroll characters left"
            onClick={() => scrollByAmount(-220)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            <span className="sr-only">Previous</span>
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Scroll characters right"
            onClick={() => scrollByAmount(220)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            <span className="sr-only">Next</span>
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className={`-mx-4 flex gap-4 overflow-x-auto pb-2 md:mx-0 no-scrollbar ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={(event) => beginDrag(event.clientX)}
        onMouseMove={(event) => {
          if (!isDragging) return;
          event.preventDefault();
          moveDrag(event.clientX);
        }}
        onMouseLeave={endDrag}
        onMouseUp={endDrag}
        onTouchStart={(event) => {
          const first = event.touches[0];
          beginDrag(first.clientX);
        }}
        onTouchMove={(event) => {
          const first = event.touches[0];
          moveDrag(first.clientX);
        }}
        onTouchEnd={endDrag}
      >
        {characters.map((character) => (
          <div
            key={character.id}
            className={`group relative flex min-w-[190px] max-w-[230px] flex-col items-center justify-between rounded-3xl bg-gradient-to-br ${character.moodColor} p-4 text-center shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            {character.imageSrc ? (
              <div className="relative h-40 w-full">
                <Image
                  src={character.imageSrc}
                  alt={character.name}
                  fill
                  className="object-contain drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/90 text-sm font-semibold text-neutral-900 shadow-sm">
                {character.name}
              </div>
            )}
            <div className="mt-3">
              <p className="text-xs font-semibold text-neutral-900">
                {character.code}
              </p>
            </div>
            {character.slug ? (
              <Link
                href={`/characters/${character.slug}`}
                className="mt-3 inline-flex items-center text-[11px] font-medium text-neutral-800"
              >
                Shop {character.name}'s picks
                <span className="ml-1 text-xs">→</span>
              </Link>
            ) : (
              <span className="mt-3 inline-flex items-center text-[11px] font-medium text-neutral-800">
                Shop {character.name}'s picks
                <span className="ml-1 text-xs">→</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
