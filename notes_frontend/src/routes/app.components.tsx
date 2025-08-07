import {
  component$,
  useSignal,
  useTask$,
  $,
} from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import { globalApiClient, type Folder, type Note, type User } from "./app.api";

// ------ AUTH MODAL ------
/**
 * Modal UI for login/signup flows
 */
export const AuthModal = component$(
  (props: {
    onAuth: QRL<(user: User) => void>;
    error: string;
    setError: QRL<(error: string) => void>;
  }) => {
    const formMode = useSignal<'login'|'signup'>('login');
    const email = useSignal("");
    const password = useSignal("");
    const working = useSignal(false);

    // PUBLIC_INTERFACE
    const handleSubmit = $(async (e: any) => {
      e.preventDefault();
      working.value = true;
      await props.setError("");
      let result;
      if (formMode.value === "login") {
        result = await globalApiClient.login(email.value, password.value);
      } else {
        result = await globalApiClient.signup(email.value, password.value);
      }
      if (result.status === "success") {
        props.onAuth(result.user);
        email.value = "";
        password.value = "";
      } else {
        await props.setError(result.error);
      }
      working.value = false;
    });

    // PUBLIC_INTERFACE
    const switchMode = $(async () => {
      formMode.value = formMode.value === "login" ? "signup" : "login";
      await props.setError("");
    });

    return (
      <div class="notes-auth-modal">
        <div class="notes-auth-title">
          {formMode.value === "login" ? "Log In to Notes" : "Sign Up to Notes"}
        </div>
        <form preventdefault:submit onSubmit$={handleSubmit}>
          <input
            class="notes-auth-input"
            type="email"
            required
            autoFocus
            placeholder="Email"
            value={email.value}
            onInput$={e => (email.value = (e.target as any).value)}
          />
          <input
            class="notes-auth-input"
            type="password"
            required
            placeholder="Password"
            value={password.value}
            minLength={6}
            onInput$={e => { password.value = (e.target as any).value; }}
          />
          {props.error && (
            <div style="color:var(--secondary-color);font-size:0.99rem;margin-bottom:3px;">
              {props.error}
            </div>
          )}
          <button class="notes-auth-btn" type="submit" disabled={working.value}>
            {working.value
              ? "Please wait..."
              : formMode.value === "login"
              ? "Log In"
              : "Sign Up"}
          </button>
        </form>
        <button class="notes-auth-alt-switch" type="button" onClick$={switchMode}>
          {formMode.value === "login"
            ? "Need an account? Sign Up"
            : "Have an account? Log In"}
        </button>
      </div>
    );
  }
);

// ------ NAVBAR ------
export const Navbar = component$(
  (props: { user: User|null; onLogout: QRL<() => void> }) => (
    <header class="notes-navbar">
      <div class="notes-navbar-title">Personal Notes Organizer</div>
      {props.user && (
        <>
          <span style="margin-right:2.1rem;font-size:1.06rem;">
            {props.user?.email}
          </span>
          <button
            class="notes-btn secondary"
            onClick$={props.onLogout}
            style="margin-left:0.35rem;"
          >
            Log Out
          </button>
        </>
      )}
    </header>
  )
);

// ------ SIDEBAR / FOLDERS ------
export const Sidebar = component$(
  (props: {
    folders: Folder[];
    selectedFolderId: string;
    onSelect: QRL<(id: string) => void>;
    onAdd: QRL<(name: string) => void>;
  }) => {
    const creating = useSignal(false);
    const newFolderName = useSignal("");
    // PUBLIC_INTERFACE
    const addFolder = $(async (e: any) => {
      e.preventDefault();
      if (!newFolderName.value.trim()) return;
      await props.onAdd(newFolderName.value);
      creating.value = false;
      newFolderName.value = "";
    });
    return (
      <aside class="notes-sidebar">
        <div class="notes-folders-header" style="flex:0 0;">
          Folders
          <button
            class="notes-add-folder-btn"
            aria-label="Add folder"
            onClick$={() => (creating.value = !creating.value)}>
            +
          </button>
        </div>
        <ul class="notes-folderlist">
          {props.folders.map((f) => (
            <li
              key={f.id}
              class={[
                "notes-folder",
                props.selectedFolderId === f.id ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick$={() => props.onSelect(f.id)}
            >
              {f.name}
            </li>
          ))}
        </ul>
        {creating.value && (
          <form preventdefault:submit onSubmit$={addFolder} style="padding:0.4rem 1rem;">
            <input
              class="notes-auth-input"
              type="text"
              required
              maxLength={40}
              autoFocus
              placeholder="Folder name"
              value={newFolderName.value}
              onInput$={e => (newFolderName.value = (e.target as any).value)}
            />
            <button class="notes-btn" type="submit">
              Create
            </button>
          </form>
        )}
      </aside>
    );
  }
);

// ------ NOTES LIST PANEL ------
export const NotesListPanel = component$(
  (props: {
    notes: Note[];
    selectedNoteId: string;
    onSelect: QRL<(id: string) => void>;
    onAddNote: QRL<() => void>;
    searchTerm: string;
    setSearchTerm: QRL<(s: string) => void>;
  }) => (
    <div class="notes-list-panel">
      <div class="notes-search-bar-container">
        <input
          class="notes-search-bar"
          type="search"
          name="search"
          placeholder="Search notes..."
          value={props.searchTerm}
          onInput$={e =>
            props.setSearchTerm((e.target as any).value || "")
          }
        />
        <button class="notes-add-btn" onClick$={props.onAddNote}>+ New</button>
      </div>
      <ul class="notes-note-list">
        {props.notes.map((note) => (
          <li
            class={[
              "notes-note-item",
              props.selectedNoteId === note.id ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={note.id}
            onClick$={() => props.onSelect(note.id)}
          >
            <div>{note.title || <span style="color:#7c7c7c;">Untitled</span>}</div>
            {note.updatedAt && (
              <span class="note-date">
                {new Date(note.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
);

// ------ NOTE EDITOR PANEL ------
export const NoteEditor = component$(
  (props: {
    note: Note | null;
    isEditing: boolean;
    setIsEditing: QRL<(v: boolean) => void>;
    onSave: QRL<(note: Note) => void>;
    onDelete: QRL<(id: string) => void>;
    onUpdate: QRL<(n: Partial<Note>) => void>;
    isSaving: boolean;
  }) => {
    const title = useSignal(props.note?.title || "");
    const content = useSignal(props.note?.content || "");

    useTask$(({ track }) => {
      track(() => props.note?.id);
      title.value = props.note?.title || "";
      content.value = props.note?.content || "";
    });

    // PUBLIC_INTERFACE
    const startEdit = $(() => props.setIsEditing(true));
    // PUBLIC_INTERFACE
    const cancelEdit = $(() => {
      props.setIsEditing(false);
      title.value = props.note?.title || "";
      content.value = props.note?.content || "";
    });
    // PUBLIC_INTERFACE
    const handleSave = $(async (e: any) => {
      e?.preventDefault?.();
      if (!title.value.trim()) return;
      await props.onSave({
        ...props.note!,
        title: title.value,
        content: content.value,
      });
      props.setIsEditing(false);
    });

    // PUBLIC_INTERFACE
    const handleDelete = $(async () => {
      if (props.note && confirm("Delete this note?")) {
        await props.onDelete(props.note.id);
      }
    });

    if (!props.note) {
      return (
        <div style="padding:2.1rem;">Select a note to view or edit.</div>
      );
    }
    return (
      <div class="notes-editor-panel">
        <form preventdefault:submit onSubmit$={handleSave}>
          <div class="notes-editor-header">
            <input
              class="notes-editor-title-input"
              type="text"
              value={title.value}
              disabled={!props.isEditing}
              onInput$={e => (title.value = (e.target as any).value)}
              required
              placeholder="Note title"
              maxLength={120}
            />
            <div class="notes-editor-actions">
              {props.isEditing ? (
                <>
                  <button
                    type="button"
                    class="notes-btn"
                    disabled={props.isSaving}
                    onClick$={handleSave}
                  >
                    {props.isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    class="notes-btn danger"
                    disabled={props.isSaving}
                    onClick$={cancelEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick$={startEdit}
                    class="notes-btn"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick$={handleDelete}
                    class="notes-btn danger"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            class="notes-editor-content-input"
            value={content.value}
            placeholder="Type your note..."
            disabled={!props.isEditing}
            onInput$={e => (content.value = (e.target as any).value)}
            rows={12}
          />
        </form>
      </div>
    );
  }
);

// ------ MAIN APP CONTAINER ------
/** Main App - manages layout, auth, folders, notes */
export const NotesAppMain = component$(() => {
  // --- app state ---
  const authError = useSignal("");
  const user = useSignal<User|null>(null);

  const folders = useSignal<Folder[]>([]);
  const notes = useSignal<Note[]>([]);
  const selectedFolderId = useSignal("");
  const selectedNoteId = useSignal("");
  const selectedNote = useSignal<Note|null>(null);
  const isEditing = useSignal(false);
  const isSaving = useSignal(false);

  const searchTerm = useSignal("");
  const appError = useSignal("");

  // --- LOAD USER ---
  useTask$(async () => {
    user.value = await globalApiClient.getUser();
  });

  // --- LOAD FOLDERS WHEN AUTHENTICATED ---
  useTask$(async ({ track }) => {
    track(() => user.value?.id);
    if (!user.value) return;
    try {
      folders.value = await globalApiClient.getFolders();
      // pick first folder by default
      if (folders.value.length > 0 && !selectedFolderId.value) {
        selectedFolderId.value = folders.value[0].id;
      }
    } catch {
      appError.value = "Failed to load folders.";
    }
  });

  // --- LOAD NOTES ON FOLDER or SEARCH CHANGE ---
  useTask$(async ({ track }) => {
    track(() => selectedFolderId.value);
    track(() => searchTerm.value);
    if (!user.value || !selectedFolderId.value) {
      notes.value = [];
      return;
    }
    try {
      notes.value = await globalApiClient.getNotes(
        selectedFolderId.value,
        searchTerm.value.trim()
      );
    } catch {
      appError.value = "Failed to load notes.";
    }
  });

  // --- LOAD SELECTED NOTE ---
  useTask$(async ({ track }) => {
    track(() => selectedNoteId.value);
    if (!selectedNoteId.value || !user.value) {
      selectedNote.value = null;
      return;
    }
    try {
      selectedNote.value = await globalApiClient.getNote(selectedNoteId.value);
      isEditing.value = false;
    } catch {
      appError.value = "Failed to load note.";
      selectedNote.value = null;
    }
  });

  // --- handlers ---
  // PUBLIC_INTERFACE
  const handleAuth = $((u: User) => {
    user.value = u;
    authError.value = "";
  });
  // PUBLIC_INTERFACE
  const setAuthError = $(async (msg: string): Promise<void> => {
    authError.value = msg;
  });
  // PUBLIC_INTERFACE
  const handleLogout = $(async () => {
    await globalApiClient.logout();
    user.value = null;
    folders.value = [];
    notes.value = [];
    selectedFolderId.value = "";
    selectedNoteId.value = "";
    selectedNote.value = null;
    authError.value = "";
  });
  // PUBLIC_INTERFACE
  const handleFolderSelect = $((id: string) => {
    selectedFolderId.value = id;
    selectedNoteId.value = "";
    selectedNote.value = null;
    searchTerm.value = "";
  });
  // PUBLIC_INTERFACE
  const handleAddFolder = $(async (name: string) => {
    try {
      const folder = await globalApiClient.createFolder(name);
      folders.value = await globalApiClient.getFolders();
      selectedFolderId.value = folder.id;
    } catch {
      appError.value = "Failed to create folder.";
    }
  });
  // PUBLIC_INTERFACE
  const handleNoteSelect = $((id: string) => {
    selectedNoteId.value = id;
    isEditing.value = false;
  });
  // PUBLIC_INTERFACE
  const handleAddNote = $(async () => {
    try {
      const note = await globalApiClient.createNote({
        folderId: selectedFolderId.value,
        title: "Untitled",
        content: "",
      });
      notes.value = await globalApiClient.getNotes(selectedFolderId.value, "");
      selectedNoteId.value = note.id;
      isEditing.value = true;
    } catch {
      appError.value = "Failed to create note.";
    }
  });
  // PUBLIC_INTERFACE
  const handleNoteSave = $(async (edited: Note) => {
    try {
      isSaving.value = true;
      await globalApiClient.updateNote(edited.id, {
        title: edited.title,
        content: edited.content,
      });
      notes.value = await globalApiClient.getNotes(selectedFolderId.value, searchTerm.value);
      selectedNote.value = await globalApiClient.getNote(edited.id);
      isSaving.value = false;
    } catch {
      appError.value = "Failed to save note.";
      isSaving.value = false;
    }
  });
  // PUBLIC_INTERFACE
  const handleNoteDelete = $(async (id: string) => {
    try {
      await globalApiClient.deleteNote(id);
      notes.value = await globalApiClient.getNotes(selectedFolderId.value, searchTerm.value);
      if (notes.value.length > 0) {
        selectedNoteId.value = notes.value[0].id;
      } else {
        selectedNoteId.value = "";
        selectedNote.value = null;
      }
    } catch {
      appError.value = "Failed to delete note.";
    }
  });
  // PUBLIC_INTERFACE
  const handleNoteUpdate = $(async (n: Partial<Note>) => {
    selectedNote.value = { ...selectedNote.value!, ...n };
  });
  // PUBLIC_INTERFACE
  const handleSetEditing = $((v: boolean) => {
    isEditing.value = v;
  });
  // PUBLIC_INTERFACE
  const handleSetSearch = $((s: string) => {
    searchTerm.value = s;
  });

  // ----------- RENDER -----------
  return (
    <div class="notes-app-main-root">
      <Navbar user={user.value} onLogout={handleLogout} />
      <div class="notes-layout-content">
        {user.value ? (
          <>
            <Sidebar
              folders={folders.value}
              selectedFolderId={selectedFolderId.value}
              onSelect={handleFolderSelect}
              onAdd={handleAddFolder}
            />
            <div class="notes-main-area">
              <NotesListPanel
                notes={notes.value}
                selectedNoteId={selectedNoteId.value}
                onSelect={handleNoteSelect}
                onAddNote={handleAddNote}
                searchTerm={searchTerm.value}
                setSearchTerm={handleSetSearch}
              />
              <NoteEditor
                note={selectedNote.value}
                isEditing={isEditing.value}
                setIsEditing={handleSetEditing}
                onSave={handleNoteSave}
                onDelete={handleNoteDelete}
                onUpdate={handleNoteUpdate}
                isSaving={isSaving.value}
              />
            </div>
          </>
        ) : (
          <div style="flex:1;display:flex;align-items:center;justify-content:center;">
            <AuthModal
              onAuth={handleAuth}
              error={authError.value}
              setError={setAuthError}
            />
          </div>
        )}
      </div>
      {appError.value && (
        <div
          style="
            background:var(--secondary-color);
            color: #fff;
            font-weight:600;
            font-size:1.01rem;
            text-align:center;
            padding: 0.93em 0;
          "
        >
          {appError.value}
        </div>
      )}
    </div>
  );
});
