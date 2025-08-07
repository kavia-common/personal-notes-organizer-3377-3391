import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import "./app.styles.css";
import { NotesAppMain } from "./app.components";

// PUBLIC_INTERFACE
export default component$(() => <NotesAppMain />);

export const head: DocumentHead = {
  title: "Notes Organizer",
  meta: [
    {
      name: "description",
      content:
        "A modern notes app for organizing and editing personal notes, with search and folder support.",
    },
  ],
};
